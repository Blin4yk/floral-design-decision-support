from pydantic import BaseModel, Field


class ImageAnalysisIn(BaseModel):
    """Результат шага 2 (image-service): центроиды Lab и веса."""

    lab_centroids: list[list[float]] = Field(..., min_length=1)
    weights: list[float] | None = None
    k: int | None = None
    h_photo: float | None = None


class HarmonyRequest(BaseModel):
    harmonyType: str
    palette: list[str] = Field(default_factory=list)
    baseColor: str | None = None


class MatchRequest(BaseModel):
    palette: list[str] = Field(default_factory=list)
    harmonyType: str
    zone: str
    location: dict = Field(default_factory=dict)
    hueUser: float | None = None
    baseColor: str | None = None
    imageAnalysis: ImageAnalysisIn | None = None
    topN: int = Field(20, ge=1, le=100)
