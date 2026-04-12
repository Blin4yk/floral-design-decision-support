"""
Пример end-to-end вызова пайплайна (без HTTP).

Запуск из корня репозитория с PYTHONPATH=shared/python:
  python -m flora_recommend.example_pipeline
"""

from __future__ import annotations

import numpy as np

from flora_recommend.color_lab import convert_to_lab
from flora_recommend.harmony import harmony_colors
from flora_recommend.palette import extract_palette
from flora_recommend.scoring import PlantSpec, compute_scores, rank_plants


def main() -> None:
    rng = np.random.default_rng(7)
    # Имитация изображения 32×32: два пятна в Lab
    h, w = 32, 32
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:] = (120, 140, 90)
    img[:, :16] = (180, 160, 200)

    lab_img = convert_to_lab(img)
    pal = extract_palette(lab_img.reshape(-1, 3), rng=rng)
    mu = np.array(pal["centroids_lab"], dtype=np.float64)

    h_u = 95.0
    T = harmony_colors(h_u, "analogous")
    plants = [
        PlantSpec(
            id=1,
            name_ru="Тест",
            name_lat="Test",
            bloom_lab=(70.0, -20.0, 55.0),
            ph_min=6.0,
            ph_max=7.5,
            z_min=4.0,
            z_max=8.0,
        )
    ]
    rows = compute_scores(plants, T, mu, ph_site=6.5, z_site=5.5)
    ranked = rank_plants(plants, rows, top_n=5)
    print("K=", pal["k"], "h_photo=", pal["h_photo"], "T=", T)
    for spec, sc in ranked:
        print(spec.name_ru, sc)


if __name__ == "__main__":
    main()
