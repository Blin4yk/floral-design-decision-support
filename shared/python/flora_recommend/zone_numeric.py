"""Числовая климатическая метка Z_site из строки зоны USDA (для Clim_score)."""

from __future__ import annotations

import re


def usda_zone_string_to_z_numeric(zone: str) -> float:
    """
    '5b' → 5.5, '6a' → 6.0, '10' → 10.0.
    Неизвестный формат — умеренное значение по умолчанию.
    """
    s = (zone or "").strip().lower()
    m = re.match(r"^(\d{1,2})([ab])?$", s)
    if not m:
        return 5.5
    n = int(m.group(1))
    half = m.group(2)
    if half == "a":
        return float(n)
    if half == "b":
        return float(n) + 0.5
    return float(n) + 0.25
