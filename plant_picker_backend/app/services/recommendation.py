# Логика подбора растений
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Tuple, Dict, Set
import logging

from ..models import Plant, PlantColor, Color, City, SoilType
from ..schemas import PlantResponse, PlantColorSchema
from ..utils.zone_utils import is_zone_in_range
from .color_analysis import generate_harmony_colors, rgb_to_hex

logger = logging.getLogger(__name__)

async def get_city_climate_zone(db: AsyncSession, city_name: str) -> str:
    result = await db.execute(
        select(City).options(selectinload(City.climate_zone)).where(City.name.ilike(city_name))
    )
    city = result.scalar_one_or_none()
    if not city:
        raise ValueError(f"Город '{city_name}' не найден")
    return city.climate_zone.zone_code

async def get_soil_type_id(db: AsyncSession, soil_name: str) -> int:
    result = await db.execute(select(SoilType).where(SoilType.name == soil_name))
    soil = result.scalar_one_or_none()
    if not soil:
        raise ValueError(f"Тип почвы '{soil_name}' не найден")
    return soil.id

async def list_soil_types(db: AsyncSession) -> List[SoilType]:
    result = await db.execute(select(SoilType).order_by(SoilType.name.asc()))
    return list(result.scalars().all())

async def get_plants_with_colors(db: AsyncSession) -> List[Plant]:
    result = await db.execute(
        select(Plant)
        .options(selectinload(Plant.plant_colors).selectinload(PlantColor.color))
        .options(selectinload(Plant.soil_type))
    )
    return result.scalars().all()

def compute_color_score(plant: Plant, weights_dict: Dict[Tuple[int, int, int], float], harmony_sets: Dict[Tuple[int, int, int], Set[str]]) -> float:
    if not plant.plant_colors:
        return 0.0

    plant_hex_set = {pc.color.hex_code.upper() for pc in plant.plant_colors}

    score = 0.0
    for base_rgb, weight in weights_dict.items():
        harmony_hexes = harmony_sets.get(base_rgb, set())
        if plant_hex_set.intersection(harmony_hexes):
            score += weight
    return score

async def recommend_plants(
    db: AsyncSession,
    dominant_colors_data: List[dict],      # список словарей с "rgb", "weight"
    user_zone: str,
    soil_type_id: int,
    top_n: int = 10
) -> List[PlantResponse]:
    """
    Основная функция подбора растений.
    dominant_colors_data: [{"rgb": [r,g,b], "weight": 0.3}, ...]
    """
    # 1. Генерируем гармоничные цвета и формируем словари весов
    harmony_sets = {}
    weights_dict = {}
    for item in dominant_colors_data:
        rgb_tuple = tuple(item["rgb"])
        weight = item["weight"]
        weights_dict[rgb_tuple] = weight

        harmony_hexes = set(generate_harmony_colors(rgb_tuple))
        harmony_hexes.add(rgb_to_hex(rgb_tuple).upper())
        harmony_sets[rgb_tuple] = harmony_hexes

    # 2. Загружаем растения с цветами
    plants = await get_plants_with_colors(db)

    # 3. Фильтрация и расчёт рейтинга
    candidates = []
    for plant in plants:
        climate_ok = is_zone_in_range(user_zone, plant.climate_zone_min, plant.climate_zone_max)
        if not climate_ok:
            continue

        soil_ok = (plant.soil_type_id == soil_type_id)
        if not soil_ok:
            continue

        color_score = compute_color_score(plant, weights_dict, harmony_sets)
        rating = 0.6 * color_score + 0.2 * 1.0 + 0.2 * 1.0
        candidates.append((plant, rating, color_score))

    candidates.sort(key=lambda x: x[1], reverse=True)

    result = []
    for plant, rating, color_score in candidates[:top_n]:
        plant_colors = [
            PlantColorSchema(
                id=pc.color.id,
                name=pc.color.name,
                hex_code=pc.color.hex_code
            )
            for pc in plant.plant_colors
        ]
        result.append(PlantResponse(
            id=plant.id,
            name=plant.name,
            description=plant.description,
            height_cm=plant.height_cm,
            width_cm=plant.width_cm,
            care_difficulty=plant.care_difficulty,
            image_url=plant.image_url,
            colors=plant_colors
        ))
    return result

async def recommend_plants_by_palette(
    db: AsyncSession,
    palette_hexes: List[str],
    user_zone: str,
    soil_type_id: int,
    top_n: int = 15
) -> List[PlantResponse]:
    palette_set = {hex_code.upper() for hex_code in palette_hexes if isinstance(hex_code, str) and hex_code.strip()}
    if not palette_set:
        return []

    plants = await get_plants_with_colors(db)
    candidates = []
    for plant in plants:
        climate_ok = is_zone_in_range(user_zone, plant.climate_zone_min, plant.climate_zone_max)
        if not climate_ok or plant.soil_type_id != soil_type_id:
            continue

        plant_hex_set = {pc.color.hex_code.upper() for pc in plant.plant_colors}
        matched = plant_hex_set.intersection(palette_set)
        color_score = len(matched) / len(palette_set)
        if color_score <= 0:
            continue

        rating = 0.7 * color_score + 0.3 * 1.0
        candidates.append((plant, rating))

    candidates.sort(key=lambda x: x[1], reverse=True)

    response: List[PlantResponse] = []
    for plant, _rating in candidates[:top_n]:
        plant_colors = [
            PlantColorSchema(
                id=pc.color.id,
                name=pc.color.name,
                hex_code=pc.color.hex_code
            )
            for pc in plant.plant_colors
        ]
        response.append(
            PlantResponse(
                id=plant.id,
                name=plant.name,
                description=plant.description,
                height_cm=plant.height_cm,
                width_cm=plant.width_cm,
                care_difficulty=plant.care_difficulty,
                image_url=plant.image_url,
                colors=plant_colors
            )
        )
    return response