from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.data.catalog import RAW_PLANTS, load_plant_specs
from flora_recommend.color_lab import hex_to_lab
from flora_recommend.scoring import PlantSpec
from flora_recommend.zone_numeric import usda_zone_string_to_z_numeric


@dataclass
class PlantRow:
    id: int
    name_ru: str
    name_latin: str
    climate_zone_min: str | None
    climate_zone_max: str | None
    ph_min: float | None
    ph_max: float | None
    flower_hex: str | None
    description: str | None


def _rows_from_db(session: Session) -> list[PlantRow]:
    query = text(
        """
        SELECT
            p.id,
            p.name_ru,
            p.name_latin,
            p.climate_zone_min,
            p.climate_zone_max,
            st.ph_min,
            st.ph_max,
            c.hex_code AS flower_hex,
            p.description
        FROM plants p
        LEFT JOIN soil_types st ON st.id = p.soil_type_id
        LEFT JOIN LATERAL (
            SELECT c.hex_code
            FROM plant_colors pc
            JOIN colors c ON c.id = pc.color_id
            WHERE pc.plant_id = p.id
            ORDER BY
                CASE WHEN pc.color_type = 'flower' THEN 0 ELSE 1 END,
                pc.intensity DESC
            LIMIT 1
        ) c ON true
        ORDER BY p.id
        """
    )
    records = session.execute(query).mappings().all()
    return [PlantRow(**dict(row)) for row in records]


def load_plant_specs_from_db(session: Session) -> list[PlantSpec]:
    try:
        rows = _rows_from_db(session)
    except Exception:
        return load_plant_specs()

    if not rows:
        return load_plant_specs()

    specs: list[PlantSpec] = []
    for row in rows:
        bloom_lab = tuple(hex_to_lab(row.flower_hex).tolist()) if row.flower_hex else RAW_PLANTS[0]["bloom_lab"]
        ph_min = float(row.ph_min) if row.ph_min is not None else 5.5
        ph_max = float(row.ph_max) if row.ph_max is not None else 7.5
        z_min = usda_zone_string_to_z_numeric(row.climate_zone_min or "3a")
        z_max = usda_zone_string_to_z_numeric(row.climate_zone_max or "9b")
        specs.append(
            PlantSpec(
                id=row.id,
                name_ru=row.name_ru,
                name_lat=row.name_latin,
                bloom_lab=bloom_lab,
                ph_min=ph_min,
                ph_max=ph_max,
                z_min=z_min,
                z_max=z_max,
                extra={
                    "description": row.description or "",
                    "zone": row.climate_zone_min or "",
                },
            )
        )
    return specs


def list_plants_from_db(session: Session) -> list[dict]:
    specs = load_plant_specs_from_db(session)
    out: list[dict] = []
    for spec in specs:
        out.append(
            {
                "id": spec.id,
                "nameRu": spec.name_ru,
                "nameLat": spec.name_lat,
                **(spec.extra or {}),
            }
        )
    return out
