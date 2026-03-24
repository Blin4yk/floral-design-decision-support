from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx

app = FastAPI(title="flora-api-gateway")

ROUTES = [
    ("/api/auth", "http://auth-service:8001"),
    ("/api/upload", "http://image-service:8002"),
    ("/api/v1/images", "http://image-service:8002"),
    ("/api/location", "http://geo-service:8003"),
    ("/api/harmony", "http://recommendation-service:8004"),
    ("/api/match", "http://recommendation-service:8004"),
    ("/api/plants", "http://recommendation-service:8004"),
    ("/api/user/garden", "http://preferences-service:8005"),
]


def resolve_target(path: str) -> str | None:
    for prefix, target in ROUTES:
        if path.startswith(prefix):
            return target
    return None


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def gateway(path: str, request: Request):
    clean_path = f"/{path}"
    target = resolve_target(clean_path)
    if not target:
        return JSONResponse(status_code=404, content={"detail": "Route not found"})

    query = request.url.query
    full_url = f"{target}{clean_path}" + (f"?{query}" if query else "")

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.request(
                method=request.method,
                url=full_url,
                content=await request.body(),
                headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
            )
            return JSONResponse(status_code=response.status_code, content=response.json())
        except Exception as exc:
            return JSONResponse(status_code=502, content={"detail": f"Gateway error: {exc}"})