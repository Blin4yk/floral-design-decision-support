import uvicorn
from fastapi import FastAPI

from api.v1 import images
from core.config import project_settings

# @contextlib.asynccontextmanager
# async def lifespan(app: FastAPI) -> AsyncIterator[None]:
#     pass


app = FastAPI(
    title=project_settings.project_name,
    docs_url='/api/openapi',
    openapi_url='/api/openapi.json',
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
    # lifespan=lifespan,
)

app.include_router(images.router)

# Для локальной разработки надо раскомментировать код ниже
if __name__ == '__main__':
    uvicorn.run("main:app", host='0.0.0.0', port=8000, reload=True)
