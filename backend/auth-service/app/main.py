from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

app = FastAPI(title="flora-auth-mock")

USERS = {}


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
    if payload.email in USERS:
        raise HTTPException(status_code=409, detail="Пользователь уже существует")
    user = {
        "id": len(USERS) + 1,
        "name": payload.name,
        "email": payload.email,
        "zone": payload.zone or "5b",
    }
    USERS[payload.email] = {"user": user, "password": payload.password}
    return {"token": f"mock-token-{user['id']}", "user": user}


@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    entry = USERS.get(payload.email)
    if not entry or entry["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return {"token": f"mock-token-{entry['user']['id']}", "user": entry["user"]}


@app.get("/api/auth/me")
async def me():
    if USERS:
        first = next(iter(USERS.values()))["user"]
        return {"user": first}
    return {"user": None}


@app.get("/api/auth/yandex/url")
async def yandex_auth_url():
    # Заглушка для фронтенда: в реальном окружении сюда вернется OAuth URL Яндекса.
    return {"url": "https://oauth.yandex.ru/authorize?response_type=code&client_id=mock-client-id"}
