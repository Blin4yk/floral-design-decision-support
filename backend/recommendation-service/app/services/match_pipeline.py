"""Оркестрация шагов 3–9: гармония, центроиды, pH/Z участка, rank_plants."""

from __future__ import annotations

import numpy as np

from app.data.catalog import plant_response_dict
from flora_recommend.scoring import PlantSpec
from flora_recommend.color_lab import hex_to_lab, lab_to_hue_deg
from flora_recommend.harmony import harmony_colors
from flora_recommend.scoring import compute_scores, rank_plants
from flora_recommend.site_soil import site_ph_profile
from flora_recommend.zone_numeric import usda_zone_string_to_z_numeric

from app.services.harmony_api import normalize_harmony_mode


def _fallback_centroids_from_palette(palette: list[str]) -> np.ndarray:
    """Если нет imageAnalysis: один «центроид» — Lab доминирующего цвета палитры."""
    if not palette:
        return np.zeros((1, 3), dtype=np.float64)
    lab = hex_to_lab(palette[0])
    return lab.reshape(1, 3)


def run_match(
    *,
    palette: list[str],
    harmony_type: str,
    zone: str,
    location: dict,
    hue_user: float | None,
    base_color: str | None,
    image_analysis: dict | None,
    top_n: int,
    plants: list[PlantSpec],
) -> tuple[list[dict], dict]:
    mode = normalize_harmony_mode(harmony_type)
    if hue_user is not None:
        h_u = float(hue_user) % 360.0
    elif base_color:
        h_u = float(lab_to_hue_deg(hex_to_lab(base_color)))
    elif palette:
        h_u = float(lab_to_hue_deg(hex_to_lab(palette[0])))
    else:
        h_u = 0.0

    T = harmony_colors(h_u, mode)

    if image_analysis and image_analysis.get("lab_centroids"):
        mu = np.array(image_analysis["lab_centroids"], dtype=np.float64)
    else:
        mu = _fallback_centroids_from_palette(palette)

    lat = location.get("lat")
    lng = location.get("lng")
    if lat is not None and lng is not None:
        ph_site = float(site_ph_profile(float(lat), float(lng))["ph_site"])
        z_site = usda_zone_string_to_z_numeric(zone)
    else:
        ph_site = 6.8
        z_site = usda_zone_string_to_z_numeric(zone)

    rows = compute_scores(plants, T, mu, ph_site=ph_site, z_site=z_site)
    ranked = rank_plants(plants, rows, top_n=top_n)
    plants_out = [plant_response_dict(spec, sc["Score"]) for spec, sc in ranked]
    debug = {
        "h_u": h_u,
        "harmony_hues": T,
        "ph_site": ph_site,
        "z_site": z_site,
        "components": [
            {"plantId": spec.id, **sc} for spec, sc in ranked
        ],
    }
    return plants_out, debug

