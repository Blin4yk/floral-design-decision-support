"""
Пайплайн рекомендаций растений по модели: Lab, k-means++, гармония, скоринг.
"""

from flora_recommend.color_lab import convert_to_lab, lab_to_hex, lab_with_hue_deg, hex_to_lab
from flora_recommend.harmony import harmony_colors
from flora_recommend.scoring import PlantSpec, compute_scores, rank_plants

try:
    from flora_recommend.palette import extract_palette
except Exception:  # pragma: no cover
    extract_palette = None

__all__ = [
    "convert_to_lab",
    "extract_palette",
    "harmony_colors",
    "compute_scores",
    "rank_plants",
    "PlantSpec",
    "lab_to_hex",
    "lab_with_hue_deg",
    "hex_to_lab",
]
