# Pydantic схемы
from pydantic import BaseModel
from typing import List, Optional

class ColorInfo(BaseModel):
    hex: str
    rgb: tuple[int, int, int]
    weight: float

class DominantColorsResponse(BaseModel):
    colors: List[ColorInfo]

class HarmonyColorsResponse(BaseModel):
    hex_list: List[str]

class PlantColorSchema(BaseModel):
    id: int
    name: str
    hex_code: str

class PlantResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    height_cm: Optional[int]
    width_cm: Optional[int]
    care_difficulty: Optional[str]
    image_url: Optional[str]
    colors: List[PlantColorSchema]
    match_percent: Optional[int] = None
    zone: Optional[str] = None
    color_score: Optional[float] = None
    harmony_score: Optional[float] = None

class AnalyzeResponse(BaseModel):
    dominant_colors: List[ColorInfo]
    harmony_colors: List[str]
    recommended_plants: List[PlantResponse]

class ExtractColorsResponse(BaseModel):
    dominant_colors: List[ColorInfo]
    palette: List[str]

class HarmonyRequest(BaseModel):
    base_color: str
    harmony_type: str = "complementary"

class HarmonyResponse(BaseModel):
    harmony_colors: List[str]

class RecommendRequest(BaseModel):
    city: str
    soil_type: str
    photo_palette: List[str]
    harmony_colors: List[str]
    top_n: int = 15
    w3: float = 0.6
    w4: float = 0.4

class RecommendResponse(BaseModel):
    zone: str
    recommended_plants: List[PlantResponse]

class SoilTypeItem(BaseModel):
    id: int
    name: str

class RegionItem(BaseModel):
    name: str
    zone: str

class ErrorResponse(BaseModel):
    detail: str