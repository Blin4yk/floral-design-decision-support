"""
Шаги 5–9: Photo_score, Soil_score, Clim_score, итоговый Score, ранжирование R*.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from flora_recommend.color_lab import lab_to_hue_deg
from flora_recommend.constants import (
    PHOTO_SCORE_DISTANCE_SCALE,
    SOIL_PH_DELTA_DIVISOR,
    WEIGHT_COLOR_SCORE,
    WEIGHT_PHOTO_SCORE,
    WEIGHT_SOIL_SCORE,
)
from flora_recommend.harmony import color_score_from_hues


@dataclass
class PlantSpec:
    """Данные растения для скоринга (Lab цветения, pH и климатические допуски)."""

    id: int
    name_ru: str
    name_lat: str
    bloom_lab: tuple[float, float, float]
    ph_min: float
    ph_max: float
    z_min: float
    z_max: float
    # опционально для ответа API
    extra: dict[str, Any] | None = None


def photo_score_for_plant(bloom_lab: np.ndarray, lab_centroids: np.ndarray) -> float:
    """
    d_photo(p) = min_k ||Lab(bloom) − μ_k|| (евклидова в Lab);
    Photo_score = max(0, 1 − d/50).
    """
    b = np.asarray(bloom_lab, dtype=np.float64).reshape(1, 3)
    mu = np.asarray(lab_centroids, dtype=np.float64)
    if mu.size == 0:
        return 0.0
    d = np.linalg.norm(mu - b, axis=1)
    d_min = float(np.min(d))
    return float(max(0.0, 1.0 - d_min / PHOTO_SCORE_DISTANCE_SCALE))


def soil_score(ph_site: float, ph_min: float, ph_max: float) -> float:
    """
    Если pH ∈ [min, max]: 1; иначе max(0, 1 − δ/1.0), δ — расстояние до интервала.
    """
    if ph_min <= ph_site <= ph_max:
        return 1.0
    if ph_site < ph_min:
        delta = ph_min - ph_site
    else:
        delta = ph_site - ph_max
    return float(max(0.0, 1.0 - delta / SOIL_PH_DELTA_DIVISOR))


def clim_score(z_site: float, z_min: float, z_max: float) -> float:
    """Если Z_site ∈ [Z_min, Z_max]: 1, иначе 0 (жёсткий фильтр)."""
    return 1.0 if z_min <= z_site <= z_max else 0.0


def compute_scores(
    plants: list[PlantSpec],
    harmony_hues: list[float],
    lab_centroids: np.ndarray,
    ph_site: float,
    z_site: float,
) -> list[dict[str, float]]:
    """
    Score(p) = Clim * (0.55*C_score + 0.25*Photo + 0.20*Soil).
    Возвращает список словарей с компонентами для каждого растения (порядок как plants).
    """
    mu = np.asarray(lab_centroids, dtype=np.float64)
    out: list[dict[str, float]] = []
    for p in plants:
        bl = np.array(p.bloom_lab, dtype=np.float64)
        h_bloom = float(lab_to_hue_deg(bl))
        c_s = color_score_from_hues(h_bloom, harmony_hues)
        ph_s = photo_score_for_plant(bl, mu)
        so_s = soil_score(ph_site, p.ph_min, p.ph_max)
        cl_s = clim_score(z_site, p.z_min, p.z_max)
        total = cl_s * (WEIGHT_COLOR_SCORE * c_s + WEIGHT_PHOTO_SCORE * ph_s + WEIGHT_SOIL_SCORE * so_s)
        out.append(
            {
                "C_score": c_s,
                "Photo_score": ph_s,
                "Soil_score": so_s,
                "Clim_score": cl_s,
                "Score": total,
            }
        )
    return out


def rank_plants(
    plants: list[PlantSpec],
    score_rows: list[dict[str, float]],
    top_n: int = 20,
) -> list[tuple[PlantSpec, dict[str, float]]]:
    """R* = top N по убыванию Score, только Score > 0."""
    pairs = list(zip(plants, score_rows, strict=True))
    pairs = [(pl, sc) for pl, sc in pairs if sc["Score"] > 0.0]
    pairs.sort(key=lambda x: x[1]["Score"], reverse=True)
    return pairs[:top_n]

