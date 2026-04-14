# Точка входа FastAPI
import colorsys
import logging
import os
import tempfile

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .schemas import (
    AnalyzeResponse,
    ErrorResponse,
    ExtractColorsResponse,
    HarmonyRequest,
    HarmonyResponse,
    RecommendRequest,
    RecommendResponse,
    SoilTypeItem,
)
from .services.color_analysis import extract_dominant_colors
from .services.recommendation import (
    get_city_climate_zone,
    get_soil_type_id,
    list_soil_types,
    recommend_plants_by_palette,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Plant Picker API", version="1.0.0")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

def _hex_to_rgb_tuple(hex_value: str) -> tuple[int, int, int]:
    clean = hex_value.strip().lstrip("#")
    if len(clean) != 6:
        raise ValueError("Невалидный HEX-цвет")
    return tuple(int(clean[i : i + 2], 16) for i in (0, 2, 4))


def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def _harmony_from_hex(base_hex: str, harmony_type: str) -> list[str]:
    base_rgb = _hex_to_rgb_tuple(base_hex)
    r, g, b = [value / 255.0 for value in base_rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)

    def rotate(deg: float) -> str:
        next_h = (h + deg / 360.0) % 1.0
        rgb_next = colorsys.hsv_to_rgb(next_h, s, v)
        return _rgb_to_hex((int(rgb_next[0] * 255), int(rgb_next[1] * 255), int(rgb_next[2] * 255)))

    mapping = {
        "analogous": [-30, 30],
        "complementary": [180],
        "triadic": [120, 240],
        "tetradic": [90, 180, 270],
        "splitComplementary": [150, 210],
    }
    return [color.upper() for color in [rotate(deg) for deg in mapping.get(harmony_type, [180])]]


async def _save_upload_file(photo: UploadFile) -> str:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            contents = await photo.read()
            if not contents:
                raise HTTPException(status_code=400, detail="Файл изображения пустой")
            tmp.write(contents)
            tmp_path = tmp.name
            return tmp_path
    except Exception as e:
        logger.error(f"Ошибка сохранения файла: {e}")
        raise HTTPException(status_code=400, detail="Не удалось сохранить изображение")


@app.get("/api/soil-types", response_model=list[SoilTypeItem])
async def soil_types(db: AsyncSession = Depends(get_db)):
    soil_list = await list_soil_types(db)
    return [SoilTypeItem(id=soil.id, name=soil.name) for soil in soil_list]


@app.post("/api/colors/extract", response_model=ExtractColorsResponse, responses={400: {"model": ErrorResponse}})
async def extract_colors(photo: UploadFile = File(...)):
    tmp_path = await _save_upload_file(photo)
    try:
        dominant_colors_info = extract_dominant_colors(tmp_path, n_colors=5)
        palette = [color["hex"].upper() for color in dominant_colors_info]
        return ExtractColorsResponse(dominant_colors=dominant_colors_info, palette=palette)
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Не удалось обработать изображение")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/api/harmony", response_model=HarmonyResponse, responses={400: {"model": ErrorResponse}})
async def build_harmony(payload: HarmonyRequest):
    try:
        colors = _harmony_from_hex(payload.base_color, payload.harmony_type)
        return HarmonyResponse(harmony_colors=colors)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/recommend", response_model=RecommendResponse, responses={400: {"model": ErrorResponse}})
async def recommend(payload: RecommendRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_zone = await get_city_climate_zone(db, payload.city)
        soil_id = await get_soil_type_id(db, payload.soil_type)
        plants = await recommend_plants_by_palette(
            db=db,
            palette_hexes=payload.palette,
            user_zone=user_zone,
            soil_type_id=soil_id,
            top_n=max(1, min(payload.top_n, 50)),
        )
        return RecommendResponse(zone=user_zone, recommended_plants=plants)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/analyze", response_model=AnalyzeResponse, responses={400: {"model": ErrorResponse}})
async def analyze_photo(
    photo: UploadFile = File(...),
    city: str = Form(...),
    soil_type: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    tmp_path = await _save_upload_file(photo)

    try:
        dominant_colors_info = extract_dominant_colors(tmp_path, n_colors=5)
        base_hex = dominant_colors_info[0]["hex"] if dominant_colors_info else "#7A8C64"
        harmony_list = _harmony_from_hex(base_hex, "complementary")
        user_zone = await get_city_climate_zone(db, city)
        soil_id = await get_soil_type_id(db, soil_type)
        palette = [color["hex"].upper() for color in dominant_colors_info] + harmony_list
        plants = await recommend_plants_by_palette(
            db=db,
            palette_hexes=palette,
            user_zone=user_zone,
            soil_type_id=soil_id,
            top_n=10,
        )
        return AnalyzeResponse(
            dominant_colors=dominant_colors_info,
            harmony_colors=harmony_list,
            recommended_plants=plants,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)