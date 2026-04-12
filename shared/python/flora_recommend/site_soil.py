"""Демо-модель почвы: pH по слоям и pH_site = среднее трёх (шаг 6)."""


def site_ph_profile(lat: float, lng: float) -> dict[str, float]:
    base = 6.5 + 0.012 * (lat - 55.0) + 0.004 * (lng - 37.0)
    ph_0_5 = float(base)
    ph_5_15 = float(base - 0.12)
    ph_15_30 = float(base - 0.22)
    ph_site = (ph_0_5 + ph_5_15 + ph_15_30) / 3.0
    return {
        "ph_0_5": ph_0_5,
        "ph_5_15": ph_5_15,
        "ph_15_30": ph_15_30,
        "ph_site": ph_site,
    }
