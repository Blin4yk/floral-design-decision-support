from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="flora-recommendation-mock")

PLANTS = [
    {
        "id": 1,
        "nameRu": "Лаванда узколистная",
        "nameLat": "Lavandula angustifolia",
        "matchPercent": 93,
        "flowering": True,
        "shade": False,
        "zone": "5b",
        "description": "Ароматный многолетник с фиолетовыми соцветиями.",
        "compatibility": ["Шалфей", "Котовник", "Роза", "Тимьян"],
    },
    {
        "id": 2,
        "nameRu": "Хоста гибридная",
        "nameLat": "Hosta hybrida",
        "matchPercent": 88,
        "flowering": True,
        "shade": True,
        "zone": "5b",
        "description": "Декоративно-лиственный многолетник для полутени.",
        "compatibility": ["Астильба", "Папоротник", "Гейхера"],
    },
]


class HarmonyRequest(BaseModel):
    harmonyType: str
    palette: list[str]


class MatchRequest(BaseModel):
    palette: list[str]
    harmonyType: str
    zone: str
    location: dict


@app.post("/api/harmony")
async def save_harmony(payload: HarmonyRequest):
    if payload.harmonyType == "complementary":
        partners = ["#5C7CFA", "#F08C00"]
    elif payload.harmonyType == "triadic":
        partners = ["#F03E3E", "#12B886"]
    elif payload.harmonyType == "splitComplementary":
        partners = ["#3BC9DB", "#FCC419"]
    else:
        partners = ["#9CCC65", "#81C784"]
    return {"partners": partners}


@app.post("/api/match")
async def match(payload: MatchRequest):
    return {"plants": PLANTS}


@app.get("/api/plants")
async def list_plants():
    return {"plants": PLANTS, "total": len(PLANTS)}


@app.get("/api/plants/{plant_id}")
async def get_plant(plant_id: int):
    plant = next((p for p in PLANTS if p["id"] == plant_id), None)
    return {"plant": plant or PLANTS[0]}
