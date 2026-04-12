from __future__ import annotations

import os
from uuid import UUID

from fastapi import FastAPI, Header
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

app = FastAPI(title="flora-preferences-mock")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://flora:flora@postgres:5432/flora")
engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _resolve_user_id(authorization: str | None) -> UUID | None:
    if not authorization or not authorization.startswith("Bearer mock-token-"):
        return None
    token_value = authorization.replace("Bearer mock-token-", "", 1).strip()
    try:
        return UUID(token_value)
    except Exception:
        return None


def _ensure_tables() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS user_garden_plants (
                    id SERIAL PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, plant_id)
                )
                """
            )
        )


@app.on_event("startup")
def startup() -> None:
    _ensure_tables()


class GardenAddRequest(BaseModel):
    plantId: int


@app.get("/api/user/garden")
async def get_garden(authorization: str | None = Header(default=None)):
    user_id = _resolve_user_id(authorization)
    if user_id is None:
        return {"plants": []}
    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT p.id, p.name_ru AS "nameRu", p.name_latin AS "nameLat"
                FROM user_garden_plants ug
                JOIN plants p ON p.id = ug.plant_id
                WHERE ug.user_id = :user_id
                ORDER BY ug.created_at DESC
                """
            ),
            {"user_id": user_id},
        ).mappings().all()
        return {"plants": [dict(row) for row in rows]}


@app.post("/api/user/garden")
async def add_to_garden(payload: GardenAddRequest, authorization: str | None = Header(default=None)):
    user_id = _resolve_user_id(authorization)
    if user_id is None:
        return {"success": False, "detail": "Требуется авторизация"}
    with SessionLocal() as session:
        session.execute(
            text(
                """
                INSERT INTO user_garden_plants(user_id, plant_id)
                VALUES (:user_id, :plant_id)
                ON CONFLICT (user_id, plant_id) DO NOTHING
                """
            ),
            {"user_id": user_id, "plant_id": payload.plantId},
        )
        session.commit()
    return {"success": True}


@app.delete("/api/user/garden/{plant_id}")
async def remove_from_garden(plant_id: int, authorization: str | None = Header(default=None)):
    user_id = _resolve_user_id(authorization)
    if user_id is None:
        return {"success": False, "detail": "Требуется авторизация"}
    with SessionLocal() as session:
        session.execute(
            text("DELETE FROM user_garden_plants WHERE user_id = :user_id AND plant_id = :plant_id"),
            {"user_id": user_id, "plant_id": plant_id},
        )
        session.commit()
    return {"success": True}
