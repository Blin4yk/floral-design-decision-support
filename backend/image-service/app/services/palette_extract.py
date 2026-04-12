"""Сборка шагов 1–2: RGB-изображение → Lab-пиксели → extract_palette."""

from __future__ import annotations

import numpy as np

from flora_recommend.color_lab import convert_to_lab, lab_to_hex, xyz_to_rgb_01, lab_to_xyz
from flora_recommend.palette import extract_palette


def _lab_centroid_to_rgb_uint8(lab: np.ndarray) -> list[int]:
    lab_v = np.asarray(lab, dtype=np.float64).reshape(1, 3)
    xyz = lab_to_xyz(lab_v)
    rgb01 = xyz_to_rgb_01(xyz)[0]
    return [int(round(float(c) * 255.0)) for c in rgb01]


def build_process_response(img_rgb: np.ndarray, rng: np.random.Generator | None = None) -> dict:
    """Ответ для /api/v1/images/process и /api/upload: палитра + imageAnalysis для match."""
    lab_img = convert_to_lab(img_rgb)
    h, w, _ = lab_img.shape
    pixels = lab_img.reshape(-1, 3)
    pal = extract_palette(pixels, rng=rng)
    centroids = np.array(pal["centroids_lab"], dtype=np.float64)
    weights = pal["weights"]
    colors = []
    for i in range(len(weights)):
        rgb = _lab_centroid_to_rgb_uint8(centroids[i])
        colors.append(
            {
                "rgb": rgb,
                "percentage": float(weights[i]),
                "lab": [float(centroids[i, j]) for j in range(3)],
                "hex": lab_to_hex(centroids[i]),
            }
        )
    hex_palette = [c["hex"] for c in colors]
    return {
        "palette": hex_palette,
        "colors": colors,
        "imageAnalysis": {
            "lab_centroids": pal["centroids_lab"],
            "weights": pal["weights"],
            "k": pal["k"],
            "h_photo": pal["h_photo"],
            "h": h,
            "w": w,
        },
    }
