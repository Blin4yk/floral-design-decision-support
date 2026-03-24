from fastapi import FastAPI, Query

app = FastAPI(title="flora-geo-mock")


@app.get("/api/location/zone")
async def get_zone(lat: float = Query(...), lng: float = Query(...)):
    zone = "5b" if lat >= 50 else "6a"
    city = "Москва" if lng > 30 else "Санкт-Петербург"
    season = "Апрель-Май"
    return {"zone": zone, "city": city, "season": season}
