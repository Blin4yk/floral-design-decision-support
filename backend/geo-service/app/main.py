import uvicorn
from fastapi import FastAPI

from api.v1 import geo

# @contextlib.asynccontextmanager
# async def lifespan(app: FastAPI) -> AsyncIterator[None]:
#     pass


app = FastAPI(
    docs_url='/api/openapi',
    openapi_url='/api/openapi.json',
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
    # lifespan=lifespan,
)

app.include_router(geo.router)

# Для локальной разработки надо раскомментировать код ниже
if __name__ == '__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8001, reload=True)
