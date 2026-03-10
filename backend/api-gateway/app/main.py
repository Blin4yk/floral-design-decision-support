from fastapi import FastAPI, Request
import httpx
from httpx import Response

app = FastAPI()

SERVICES = {
    "auth": "http://auth-service:8001",
    "images": "http://image-service:8002",
    # ...
}

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def gateway(service: str, path: str, request: Request):
    async with httpx.AsyncClient() as client:
        url = f"{SERVICES[service]}/{path}"
        resp = await client.request(
            method=request.method,
            url=url,
            headers=request.headers,
            content=await request.body()
        )
        return Response(content=resp.content, status_code=resp.status_code)