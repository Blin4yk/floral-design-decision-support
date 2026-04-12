"""Каталог растений: Lab цветения, допуски pH и Z (для шагов 5–7)."""

from __future__ import annotations

from flora_recommend.scoring import PlantSpec

# bloom_lab в CIELAB (типичный цвет соцветий/листьев для скоринга)
RAW_PLANTS: list[dict] = [
    {
        "id": 1,
        "nameRu": "Лаванда узколистная",
        "nameLat": "Lavandula angustifolia",
        "bloom_lab": (58.0, 52.0, -42.0),
        "ph_min": 6.5,
        "ph_max": 8.0,
        "z_min": 5.0,
        "z_max": 9.0,
        "flowering": True,
        "shade": False,
        "zone": "5b",
        "description": "Ароматный многолетник с фиолетовыми соцветиями.",
        "compatibility": ["Шалфей", "Котовник", "Роза", "Тимьян"],
    },
    {
        "id": 2,
        "nameRu": "Хоста гибридная",
        "nameLat": "Hosta hybrida",
        "bloom_lab": (82.0, -18.0, 22.0),
        "ph_min": 5.5,
        "ph_max": 7.5,
        "z_min": 3.0,
        "z_max": 8.5,
        "flowering": True,
        "shade": True,
        "zone": "5b",
        "description": "Декоративно-лиственный многолетник для полутени.",
        "compatibility": ["Астильба", "Папоротник", "Гейхера"],
    },
    {
        "id": 3,
        "nameRu": "Эхинацея пурпурная",
        "nameLat": "Echinacea purpurea",
        "bloom_lab": (62.0, 48.0, -18.0),
        "ph_min": 6.0,
        "ph_max": 7.5,
        "z_min": 4.0,
        "z_max": 9.0,
        "flowering": True,
        "shade": False,
        "zone": "5b",
        "description": "Морозостойкий многолетник с розово-пурпурными корзинками.",
        "compatibility": ["Лаванда", "Осока", "Шалфей мускатный"],
    },
    {
        "id": 4,
        "nameRu": "Бересклет форчуна",
        "nameLat": "Euonymus fortunei",
        "bloom_lab": (48.0, -28.0, 38.0),
        "ph_min": 6.0,
        "ph_max": 7.8,
        "z_min": 5.5,
        "z_max": 8.0,
        "flowering": False,
        "shade": True,
        "zone": "6a",
        "description": "Вечнозелёный почвопокровник, зелёно-кремовая окраска листвы.",
        "compatibility": ["Плющ", "Хоста", "Папоротник"],
    },
    {
        "id": 5,
        "nameRu": "Гейхера гибридная",
        "nameLat": "Heuchera hybrida",
        "bloom_lab": (42.0, 38.0, -8.0),
        "ph_min": 6.0,
        "ph_max": 7.2,
        "z_min": 4.0,
        "z_max": 8.5,
        "flowering": True,
        "shade": True,
        "zone": "5b",
        "description": "Декоративные листья бордово-красных тонов.",
        "compatibility": ["Астильба", "Хоста", "Папоротник"],
    },
    {
        "id": 6,
        "nameRu": "Седум видный",
        "nameLat": "Hylotelephium spectabile",
        "bloom_lab": (55.0, 58.0, 28.0),
        "ph_min": 6.5,
        "ph_max": 8.0,
        "z_min": 4.0,
        "z_max": 9.0,
        "flowering": True,
        "shade": False,
        "zone": "5b",
        "description": "Осенние соцветия насыщенно-розовые, засухоустойчив.",
        "compatibility": ["Лаванда", "Овсяница", "Молочай"],
    },
]


def load_plant_specs() -> list[PlantSpec]:
    out: list[PlantSpec] = []
    for row in RAW_PLANTS:
        extra = {k: v for k, v in row.items() if k not in ("bloom_lab", "ph_min", "ph_max", "z_min", "z_max")}
        out.append(
            PlantSpec(
                id=row["id"],
                name_ru=row["nameRu"],
                name_lat=row["nameLat"],
                bloom_lab=tuple(row["bloom_lab"]),
                ph_min=float(row["ph_min"]),
                ph_max=float(row["ph_max"]),
                z_min=float(row["z_min"]),
                z_max=float(row["z_max"]),
                extra=extra,
            )
        )
    return out


PLANT_SPECS: list[PlantSpec] = load_plant_specs()


def plant_response_dict(spec: PlantSpec, score: float) -> dict:
    base = dict(spec.extra or {})
    base["id"] = spec.id
    base["nameRu"] = spec.name_ru
    base["nameLat"] = spec.name_lat
    base["matchPercent"] = max(0, min(100, int(round(score * 100.0))))
    return base
