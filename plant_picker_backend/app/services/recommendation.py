# Логика подбора растений
from math import sqrt
from typing import Any, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas import PlantColorSchema, PlantResponse
from ..utils.zone_utils import is_zone_in_range, zone_to_number

DEFAULT_ZONE = "5b"

CITY_ZONE_MAP: dict[str, str] = {
    "москва": "5b",
    "санкт-петербург": "5a",
    "спб": "5a",
    "екатеринбург": "4b",
    "казань": "5a",
    "новосибирск": "4a",
    "краснодар": "6b",
}


def _normalize_city(city_name: str) -> str:
    return (city_name or "").strip().lower()


def _care_level_to_text(value: Any) -> str | None:
    if value is None:
        return None
    mapping = {
        1: "очень простой",
        2: "простой",
        3: "средний",
        4: "сложный",
        5: "очень сложный",
    }
    try:
        level = int(value)
    except Exception:
        return str(value)
    return mapping.get(level, str(level))


def _hex_to_rgb(hex_code: str) -> tuple[int, int, int]:
    clean = str(hex_code or "").strip().lstrip("#")
    if len(clean) != 6:
        return (0, 0, 0)
    return tuple(int(clean[i : i + 2], 16) for i in (0, 2, 4))


def _rgb_distance(rgb1: tuple[int, int, int], rgb2: tuple[int, int, int]) -> float:
    return sqrt(sum((left - right) ** 2 for left, right in zip(rgb1, rgb2)))


def _color_similarity(left_hex: str, right_hex: str) -> float:
    left_rgb = _hex_to_rgb(left_hex)
    right_rgb = _hex_to_rgb(right_hex)
    max_distance = sqrt(3 * (255**2))
    return max(0.0, 1.0 - (_rgb_distance(left_rgb, right_rgb) / max_distance))


def _zone_score(user_zone: str, min_zone: str | None, max_zone: str | None) -> float:
    if not min_zone or not max_zone:
        return 0.5
    if is_zone_in_range(user_zone, min_zone, max_zone):
        return 1.0
    try:
        user_value = zone_to_number(user_zone)
        min_value = zone_to_number(min_zone)
        max_value = zone_to_number(max_zone)
        if user_value < min_value:
            distance = min_value - user_value
        else:
            distance = user_value - max_value
        return max(0.0, 1.0 - distance / 3.0)
    except Exception:
        return 0.5


def _soil_score(requested_soil_type_id: int, plant_soil_type_id: Any) -> float:
    if plant_soil_type_id is None:
        return 0.35
    return 1.0 if int(plant_soil_type_id) == int(requested_soil_type_id) else 0.2


def _care_score(care_complexity: Any) -> float:
    if care_complexity is None:
        return 0.6
    try:
        level = int(care_complexity)
    except Exception:
        return 0.6
    return max(0.0, 1.0 - ((level - 1) / 4.0))


def _color_score(palette_hexes: list[str], plant_colors: list[dict]) -> float:
    if not palette_hexes or not plant_colors:
        return 0.0

    weighted_scores: list[float] = []
    for palette_hex in palette_hexes:
        best_score = 0.0
        for plant_color in plant_colors:
            similarity = _color_similarity(palette_hex, plant_color.get("hex_code", ""))
            intensity = float(plant_color.get("intensity") or 1.0)
            intensity_factor = min(1.0, max(0.2, intensity / 10.0))
            score = similarity * (0.7 + 0.3 * intensity_factor)
            if score > best_score:
                best_score = score
        weighted_scores.append(best_score)
    return sum(weighted_scores) / len(weighted_scores)


async def get_city_climate_zone(db: AsyncSession, city_name: str) -> str:
    # Таблицы cities нет в dump_plants.sql, поэтому используем карту + безопасный fallback.
    _ = db
    normalized = _normalize_city(city_name)
    return CITY_ZONE_MAP.get(normalized, DEFAULT_ZONE)


async def get_soil_type_id(db: AsyncSession, soil_name: str) -> int:
    query = text(
        """
        SELECT id
        FROM soil_types
        WHERE lower(name) = lower(:soil_name)
        LIMIT 1
        """
    )
    result = await db.execute(query, {"soil_name": soil_name})
    row = result.first()
    if not row:
        raise ValueError(f"Тип почвы '{soil_name}' не найден")
    return int(row[0])


async def list_soil_types(db: AsyncSession) -> list[dict]:
    query = text(
        """
        SELECT id, name
        FROM soil_types
        ORDER BY name
        """
    )
    result = await db.execute(query)
    return [{"id": int(row.id), "name": row.name} for row in result.mappings().all()]


async def recommend_plants_by_palette(
    db: AsyncSession,
    photo_palette_hexes: List[str],
    harmony_hexes: List[str],
    user_zone: str,
    soil_type_id: int,
    w3: float = 0.6,
    w4: float = 0.4,
    top_n: int = 15,
) -> List[PlantResponse]:
    photo_palette_list = [hex_code.upper() for hex_code in photo_palette_hexes if isinstance(hex_code, str) and hex_code.strip()]
    harmony_palette_list = [hex_code.upper() for hex_code in harmony_hexes if isinstance(hex_code, str) and hex_code.strip()]
    if not photo_palette_list:
        return []

    total_weight = w3 + w4
    if total_weight <= 0:
        w3_normalized, w4_normalized = 0.6, 0.4
    else:
        w3_normalized = w3 / total_weight
        w4_normalized = w4 / total_weight

    query = text(
        """
        SELECT
            p.id,
            p.name_ru,
            p.name_latin,
            p.description,
            p.height_max,
            p.width_max,
            p.care_complexity,
            p.image_url,
            p.climate_zone_min,
            p.climate_zone_max,
            p.soil_type_id,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', c.id,
                        'name', c.name,
                        'hex_code', c.hex_code,
                        'intensity', pc.intensity,
                        'color_type', pc.color_type
                    )
                ) FILTER (WHERE c.id IS NOT NULL),
                '[]'::json
            ) AS colors
        FROM plants p
        LEFT JOIN plant_colors pc ON pc.plant_id = p.id
        LEFT JOIN colors c ON c.id = pc.color_id
        GROUP BY p.id
        """
    )
    rows = (await db.execute(query)).mappings().all()

    candidates: list[tuple[dict, float]] = []
    for row in rows:
        # K1(rj): бинарный фильтр по климатической зоне
        if not is_zone_in_range(user_zone, row["climate_zone_min"], row["climate_zone_max"]):
            continue
        # K2(rj): бинарный фильтр по типу почвы
        if row["soil_type_id"] is None or int(row["soil_type_id"]) != int(soil_type_id):
            continue

        plant_colors = row.get("colors") or []
        # f3(rj): цветовое сходство палитры растения и фото
        color_score = _color_score(photo_palette_list, plant_colors)
        # f4(rj): гармония по Иттену
        harmony_score = _color_score(harmony_palette_list, plant_colors) if harmony_palette_list else 0.0

        total_score = (w3_normalized * color_score) + (w4_normalized * harmony_score)
        row_with_scores = dict(row)
        row_with_scores["color_score"] = color_score
        row_with_scores["harmony_score"] = harmony_score
        candidates.append((row_with_scores, total_score))

    candidates.sort(key=lambda item: item[1], reverse=True)

    response: List[PlantResponse] = []
    for row, total_score in candidates[:top_n]:
        colors = [
            PlantColorSchema(id=int(item["id"]), name=item["name"], hex_code=item["hex_code"])
            for item in (row.get("colors") or [])
            if item.get("id") is not None
        ]
        response.append(
            PlantResponse(
                id=int(row["id"]),
                name=row["name_ru"],
                description=row.get("description"),
                height_cm=int(row["height_max"]) if row.get("height_max") is not None else None,
                width_cm=int(row["width_max"]) if row.get("width_max") is not None else None,
                care_difficulty=_care_level_to_text(row.get("care_complexity")),
                image_url=row.get("image_url"),
                colors=colors,
                match_percent=max(1, min(100, int(round(total_score * 100)))),
                zone=user_zone,
                color_score=round(float(row.get("color_score", 0.0)), 4),
                harmony_score=round(float(row.get("harmony_score", 0.0)), 4),
            )
        )
    return response