from fastapi import FastAPI, Query

from app.api.v1.geo import router as geo_router
from flora_recommend.site_soil import site_ph_profile
from flora_recommend.zone_numeric import usda_zone_string_to_z_numeric

app = FastAPI(title="flora-geo-service")
app.include_router(geo_router)


def _mock_zone_label(lat: float, lng: float) -> str:
    return "5b" if lat >= 50 else "6a"


@app.get("/api/location/zone")
async def get_zone(lat: float = Query(...), lng: float = Query(...)):
    zone = _mock_zone_label(lat, lng)
    city = "Москва" if lng > 30 else "Санкт-Петербург"
    season = "Апрель-Май"
    ph = site_ph_profile(lat, lng)
    z_site = usda_zone_string_to_z_numeric(zone)
    return {
        "zone": zone,
        "city": city,
        "season": season,
        "z_site": z_site,
        **ph,
    }
