from fastapi import FastAPI

from app.api.v1.recommend import router as recommend_router

app = FastAPI(title="flora-recommendation-service")
app.include_router(recommend_router)
