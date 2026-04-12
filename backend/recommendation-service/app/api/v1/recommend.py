from fastapi import APIRouter

from app.schemas.recommend import HarmonyRequest, MatchRequest
from app.db import get_session
from app.services.harmony_api import harmony_partner_hexes
from app.services.catalog_db import list_plants_from_db, load_plant_specs_from_db
from app.services.match_pipeline import run_match

router = APIRouter(tags=["recommend"])


@router.post("/api/harmony")
async def save_harmony(payload: HarmonyRequest):
    """Шаг 3 (сервер): T(h_u, s_mode) → HEX-партнёры."""
    base = payload.baseColor or (payload.palette[0] if payload.palette else None)
    if not base:
        return {"partners": [], "h_u": None, "harmonyHues": []}
    partners, h_u, T = harmony_partner_hexes(base, payload.harmonyType)
    return {"partners": partners, "h_u": h_u, "harmonyHues": T}


@router.post("/api/match")
async def match(payload: MatchRequest):
    """Шаги 3–9: итоговый Score и R* (top N, Score > 0)."""
    ia = payload.imageAnalysis.model_dump() if payload.imageAnalysis else None
    with get_session() as session:
        plant_specs = load_plant_specs_from_db(session)
    plants, _debug = run_match(
        palette=payload.palette,
        harmony_type=payload.harmonyType,
        zone=payload.zone,
        location=payload.location or {},
        hue_user=payload.hueUser,
        base_color=payload.baseColor,
        image_analysis=ia,
        top_n=payload.topN,
        plants=plant_specs,
    )
    return {"plants": plants, "total": len(plants)}


@router.get("/api/plants")
async def list_plants():
    with get_session() as session:
        plants = list_plants_from_db(session)
    return {"plants": plants, "total": len(plants)}


@router.get("/api/plants/{plant_id}")
async def get_plant(plant_id: int):
    with get_session() as session:
        plants = list_plants_from_db(session)
    plant = next((p for p in plants if p["id"] == plant_id), None)
    return {"plant": plant or (plants[0] if plants else None)}
