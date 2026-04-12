"""
Шаг 1 модели: RGB → CIELAB (нормализация, гамма, XYZ, кусочная f(t)).
Все дальнейшие расстояния — в пространстве Lab.
"""

from __future__ import annotations

import numpy as np

from flora_recommend.constants import (
    CHROMA_EPS,
    LAB_DELTA,
    LAB_EPSILON,
    RGB_GAMMA_DIVISOR,
    RGB_GAMMA_OFFSET,
    RGB_GAMMA_POWER,
    RGB_LINEAR_DIVISOR,
    RGB_LINEAR_THRESHOLD,
    RGB_TO_XYZ_ROW0,
    RGB_TO_XYZ_ROW1,
    RGB_TO_XYZ_ROW2,
    XYZ_REF_XN,
    XYZ_REF_YN,
    XYZ_REF_ZN,
)


def _lab_f_piecewise(t: np.ndarray) -> np.ndarray:
    """Кусочная f(t) для XYZ → Lab: f(t) = t^(1/3) при t > ε, иначе линейная ветвь."""
    t = np.asarray(t, dtype=np.float64)
    out = np.empty_like(t, dtype=np.float64)
    mask = t > LAB_EPSILON
    out[mask] = np.cbrt(t[mask])
    out[~mask] = t[~mask] / (3.0 * LAB_DELTA**2) + 4.0 / 29.0
    return out


def _linearize_srgb_channel(c_srgb: np.ndarray) -> np.ndarray:
    """Гамма-коррекция канала C ∈ [0,1] по условию из модели."""
    c = np.asarray(c_srgb, dtype=np.float64)
    out = np.empty_like(c)
    low = c <= RGB_LINEAR_THRESHOLD
    out[low] = c[low] / RGB_LINEAR_DIVISOR
    out[~low] = ((c[~low] + RGB_GAMMA_OFFSET) / RGB_GAMMA_DIVISOR) ** RGB_GAMMA_POWER
    return out


def rgb_01_to_xyz(rgb_01: np.ndarray) -> np.ndarray:
    """X = 0.4124R′ + …; Y, Z — как в спецификации."""
    r, g, b = np.split(_linearize_srgb_channel(rgb_01), 3, axis=-1)
    r = r[..., 0]
    g = g[..., 0]
    b = b[..., 0]
    x = RGB_TO_XYZ_ROW0[0] * r + RGB_TO_XYZ_ROW0[1] * g + RGB_TO_XYZ_ROW0[2] * b
    y = RGB_TO_XYZ_ROW1[0] * r + RGB_TO_XYZ_ROW1[1] * g + RGB_TO_XYZ_ROW1[2] * b
    z = RGB_TO_XYZ_ROW2[0] * r + RGB_TO_XYZ_ROW2[1] * g + RGB_TO_XYZ_ROW2[2] * b
    return np.stack([x, y, z], axis=-1) * 100.0


def xyz_to_lab(xyz: np.ndarray) -> np.ndarray:
    """L* = 116 f(Y/Yn) − 16; a*, b* — стандартные формулы CIELAB."""
    xyz = np.asarray(xyz, dtype=np.float64)
    x, y, z = np.split(xyz, 3, axis=-1)
    x = x[..., 0] / XYZ_REF_XN
    y = y[..., 0] / XYZ_REF_YN
    z = z[..., 0] / XYZ_REF_ZN
    fx = _lab_f_piecewise(x)
    fy = _lab_f_piecewise(y)
    fz = _lab_f_piecewise(z)
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b = 200.0 * (fy - fz)
    return np.stack([L, a, b], axis=-1)


def convert_to_lab(image_rgb_uint8: np.ndarray) -> np.ndarray:
    """
    I (H×W×3) uint8 RGB → массив Lab (H×W×3).
    Соответствует шагу 1: нормализация [0,1], гамма, RGB→XYZ, XYZ→Lab.
    """
    img = np.asarray(image_rgb_uint8, dtype=np.float64)
    if img.ndim != 3 or img.shape[-1] != 3:
        raise ValueError("Ожидается изображение RGB формы (H, W, 3)")
    rgb_01 = np.clip(img / 255.0, 0.0, 1.0)
    xyz = rgb_01_to_xyz(rgb_01)
    return xyz_to_lab(xyz)


def lab_to_hue_deg(lab: np.ndarray) -> np.ndarray:
    """
    Угол оттенка h° в [0, 360) из (L*, a*, b*) — цилиндрическое представление Lab (h = atan2(b*, a*)).
    Для нулевой хромы возвращаем 0 (нейтральный оттенок).
    """
    lab = np.atleast_2d(np.asarray(lab, dtype=np.float64))
    a = lab[:, 1]
    b = lab[:, 2]
    h_rad = np.arctan2(b, a)
    h_deg = np.degrees(h_rad)
    h_deg = np.mod(h_deg, 360.0)
    chroma = np.hypot(a, b)
    h_deg = np.where(chroma < CHROMA_EPS, 0.0, h_deg)
    return h_deg if lab.shape[0] > 1 else h_deg[0]


def _lab_f_inverse_piecewise(t: np.ndarray) -> np.ndarray:
    """Обратная к f для Lab → XYZ (ветвление по |t| > δ)."""
    t = np.asarray(t, dtype=np.float64)
    out = np.empty_like(t)
    mask = t > LAB_DELTA
    out[mask] = t[mask] ** 3
    out[~mask] = 3.0 * LAB_DELTA**2 * (t[~mask] - 4.0 / 29.0)
    return out


def lab_to_xyz(lab: np.ndarray) -> np.ndarray:
    """Обратное преобразование Lab → XYZ (для отображения центроидов в HEX)."""
    lab = np.asarray(lab, dtype=np.float64)
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16.0) / 116.0
    fx = a / 500.0 + fy
    fz = fy - b / 200.0
    xr = _lab_f_inverse_piecewise(fx)
    yr = _lab_f_inverse_piecewise(fy)
    zr = _lab_f_inverse_piecewise(fz)
    X = xr * XYZ_REF_XN
    Y = yr * XYZ_REF_YN
    Z = zr * XYZ_REF_ZN
    return np.stack([X, Y, Z], axis=-1)


def xyz_to_rgb_01(xyz: np.ndarray) -> np.ndarray:
    """XYZ (×100 шкала как выше) → линейный RGB, затем компандирование sRGB."""
    xyz = np.asarray(xyz, dtype=np.float64) / 100.0
    x, y, z = xyz[..., 0], xyz[..., 1], xyz[..., 2]
    # Обратная матрицы M⁻¹ (стандарт sRGB)
    r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
    g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z
    b = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    rgb_lin = np.stack([r, g, b], axis=-1)
    rgb_lin = np.clip(rgb_lin, 0.0, 1.0)
    a = np.empty_like(rgb_lin)
    low = rgb_lin <= 0.0031308
    a[low] = RGB_LINEAR_DIVISOR * rgb_lin[low]
    a[~low] = (1.0 + RGB_GAMMA_OFFSET) * (rgb_lin[~low] ** (1.0 / RGB_GAMMA_POWER)) - RGB_GAMMA_OFFSET
    return np.clip(a, 0.0, 1.0)


def lab_to_hex(lab: np.ndarray) -> str:
    """Один цвет Lab → #RRGGBB для UI."""
    lab_v = np.asarray(lab, dtype=np.float64).reshape(1, 3)
    xyz = lab_to_xyz(lab_v)
    rgb = xyz_to_rgb_01(xyz)[0]
    r, g, b = (np.round(rgb * 255.0)).astype(int)
    return f"#{r:02X}{g:02X}{b:02X}"


def lab_with_hue_deg(lab: np.ndarray, h_new_deg: float, default_chroma: float = 40.0) -> np.ndarray:
    """
    Сохраняет L*, подменяет оттенок на h_new (°), хрому — как у исходного Lab
    (если хрома ≈ 0, берётся default_chroma для отображаемого HEX-партнёра).
    """
    lab = np.asarray(lab, dtype=np.float64).reshape(3)
    L = lab[0]
    a, b = lab[1], lab[2]
    C = float(np.hypot(a, b))
    if C < CHROMA_EPS:
        C = default_chroma
    h_rad = np.radians(float(h_new_deg))
    a2 = C * np.cos(h_rad)
    b2 = C * np.sin(h_rad)
    return np.array([L, a2, b2], dtype=np.float64)


def hex_to_lab(hex_color: str) -> np.ndarray:
    """#RRGGBB → Lab (для согласования h_u с выбранным на колесе цветом)."""
    s = hex_color.strip().lstrip("#")
    if len(s) != 6:
        raise ValueError("Ожидается HEX длины 6")
    r = int(s[0:2], 16) / 255.0
    g = int(s[2:4], 16) / 255.0
    b = int(s[4:6], 16) / 255.0
    rgb = np.array([[r, g, b]], dtype=np.float64)
    xyz = rgb_01_to_xyz(rgb)
    lab = xyz_to_lab(xyz)
    return lab.reshape(3)

