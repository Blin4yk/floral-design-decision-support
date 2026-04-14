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
    palette: List[str]
    top_n: int = 15

class RecommendResponse(BaseModel):
    zone: str
    recommended_plants: List[PlantResponse]

class SoilTypeItem(BaseModel):
    id: int
    name: str

class ErrorResponse(BaseModel):
    detail: str