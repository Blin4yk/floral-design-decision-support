from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="flora-preferences-mock")

GARDEN = []


class GardenAddRequest(BaseModel):
    plantId: int


@app.get("/api/user/garden")
async def get_garden():
    return {"plants": GARDEN}


@app.post("/api/user/garden")
async def add_to_garden(payload: GardenAddRequest):
    if not any(item["id"] == payload.plantId for item in GARDEN):
        GARDEN.append(
            {
                "id": payload.plantId,
                "nameRu": f"Растение {payload.plantId}",
                "nameLat": f"Plantus {payload.plantId}",
            }
        )
    return {"success": True}


@app.delete("/api/user/garden/{plant_id}")
async def remove_from_garden(plant_id: int):
    global GARDEN
    GARDEN = [item for item in GARDEN if item["id"] != plant_id]
    return {"success": True}
