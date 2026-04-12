"""Серверная гармония T(h_u, s_mode) → HEX-партнёры для UI."""

from __future__ import annotations

from flora_recommend.color_lab import hex_to_lab, lab_to_hex, lab_to_hue_deg, lab_with_hue_deg
from flora_recommend.harmony import arc_h, harmony_colors


def normalize_harmony_mode(harmony_type: str) -> str:
    key = harmony_type.strip()
    mapping = {
        "splitComplementary": "split_complementary",
        "splitcomplementary": "split_complementary",
        "split_complementary": "split_complementary",
        "split": "split_complementary",
        "complementary": "complementary",
        "analogous": "analogous",
        "triadic": "triadic",
        "tetradic": "tetradic",
    }
    return mapping.get(key, key.lower())


def harmony_partner_hexes(base_hex: str, harmony_type: str) -> tuple[list[str], float, list[float]]:
    """
    h_u из базового HEX; T из модели; в партнёры — все t ∈ T с arc(t, h_u) > ε (как на фронте).
    """
    lab_b = hex_to_lab(base_hex)
    h_u = float(lab_to_hue_deg(lab_b))
    mode = normalize_harmony_mode(harmony_type)
    T = harmony_colors(h_u, mode)
    partners: list[str] = []
    for t in T:
        if arc_h(t, h_u) > 1e-3:
            lab_t = lab_with_hue_deg(lab_b, t)
            partners.append(lab_to_hex(lab_t))
    return partners, h_u, T
