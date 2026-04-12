from __future__ import annotations

import os
from uuid import UUID

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

app = FastAPI(title="flora-auth-mock")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://flora:flora@postgres:5432/flora")
engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _ensure_tables() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS auth_credentials (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    name TEXT NOT NULL,
                    password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )


@app.on_event("startup")
def startup() -> None:
    _ensure_tables()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    zone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/register")
async def register(payload: RegisterRequest):
    with SessionLocal() as session:
        existing = session.execute(text("SELECT id FROM users WHERE email=:email"), {"email": payload.email}).first()
        if existing:
            raise HTTPException(status_code=409, detail="Пользователь уже существует")
        user_id = session.execute(
            text("INSERT INTO users(email) VALUES (:email) RETURNING id"),
            {"email": payload.email},
        ).scalar_one()
        session.execute(
            text("INSERT INTO auth_credentials(user_id, name, password) VALUES (:user_id, :name, :password)"),
            {"user_id": user_id, "name": payload.name, "password": payload.password},
        )
        session.commit()
        user = {
            "id": str(user_id),
            "name": payload.name,
            "email": payload.email,
            "zone": payload.zone or "5b",
        }
        return {"token": f"mock-token-{user['id']}", "user": user}


@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    with SessionLocal() as session:
        row = session.execute(
            text(
                """
                SELECT u.id, u.email, c.name, c.password
                FROM users u
                JOIN auth_credentials c ON c.user_id = u.id
                WHERE u.email = :email
                """
            ),
            {"email": payload.email},
        ).mappings().first()
        if not row or row["password"] != payload.password:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        user = {
            "id": str(row["id"]),
            "name": row["name"],
            "email": row["email"],
            "zone": "5b",
        }
        return {"token": f"mock-token-{user['id']}", "user": user}


@app.get("/api/auth/me")
async def me(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer mock-token-"):
        return {"user": None}
    token_value = authorization.replace("Bearer mock-token-", "", 1).strip()
    try:
        user_id = UUID(token_value)
    except Exception:
        return {"user": None}
    with SessionLocal() as session:
        row = session.execute(
            text(
                """
                SELECT u.id, u.email, c.name
                FROM users u
                LEFT JOIN auth_credentials c ON c.user_id = u.id
                WHERE u.id = :user_id
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
        if not row:
            return {"user": None}
        return {
            "user": {
                "id": str(row["id"]),
                "name": row["name"] or row["email"].split("@")[0],
                "email": row["email"],
                "zone": "5b",
            }
        }


@app.get("/api/auth/yandex/url")
async def yandex_auth_url():
    # Заглушка для фронтенда: в реальном окружении сюда вернется OAuth URL Яндекса.
    return {"url": "https://oauth.yandex.ru/authorize?response_type=code&client_id=mock-client-id"}
