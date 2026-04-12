"""
Шаг 3–4: rot(h,θ), множество T(h_u, s_mode), arc, Φ, компоненты C_score.
"""

from __future__ import annotations

import numpy as np

from flora_recommend.constants import HUE_ARC_DENOMINATOR, HUE_ARC_PHI_DEG


def rot_h(h: float, theta_deg: float) -> float:
    """rot(h, θ) = (h + θ) mod 360."""
    return float((h + theta_deg) % 360.0)


def harmony_colors(h_u: float, s_mode: str) -> list[float]:
    """
    T(h_u, s_mode) как в модели (все углы в [0,360)).
    s_mode: complementary | analogous | triadic | tetradic | split_complementary
    """
    h_u = float(np.mod(h_u, 360.0))
    mode = s_mode.strip().lower().replace(" ", "_")
    if mode in ("splitcomplementary", "split-complementary"):
        mode = "split_complementary"

    if mode == "complementary":
        hues = {h_u, rot_h(h_u, 180.0)}
    elif mode == "analogous":
        hues = {rot_h(h_u, -30.0), h_u, rot_h(h_u, 30.0)}
    elif mode == "triadic":
        hues = {h_u, rot_h(h_u, 120.0), rot_h(h_u, 240.0)}
    elif mode == "tetradic":
        hues = {h_u, rot_h(h_u, 90.0), rot_h(h_u, 180.0), rot_h(h_u, 270.0)}
    elif mode == "split_complementary":
        hues = {h_u, rot_h(h_u, 150.0), rot_h(h_u, 210.0)}
    else:
        raise ValueError(f"Неизвестный режим гармонии: {s_mode}")

    return sorted(hues)


def arc_h(h1: float, h2: float) -> float:
    """arc(h1, h2) = min(|h1−h2|, 360 − |h1−h2|)."""
    d = abs(h1 - h2)
    return float(min(d, 360.0 - d))


def phi_gate(arc_deg: float) -> float:
    """Φ = 1 если arc ≤ 20°, иначе 0."""
    return 1.0 if arc_deg <= HUE_ARC_PHI_DEG else 0.0


def harmony_term_for_target(h_bloom: float, t: float) -> float:
    """Φ * (1 - arc/180) для одного t_i."""
    a = arc_h(h_bloom, t)
    return phi_gate(a) * (1.0 - a / HUE_ARC_DENOMINATOR)


def color_score_from_hues(h_bloom: float, harmony_hues: list[float]) -> float:
    """C_score(p) = max по t_i из T."""
    if not harmony_hues:
        return 0.0
    return float(max(harmony_term_for_target(h_bloom, t) for t in harmony_hues))

