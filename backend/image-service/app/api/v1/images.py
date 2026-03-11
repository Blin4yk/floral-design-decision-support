import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, Form

from app.services.ignore_bg import get_dominant_colors

router = APIRouter(prefix='/api/v1/images', tags=['images'])

@router.post("/process")
async def process_image(
    file: UploadFile = File(...),
    n_clusters: int = Form(3, ge=1, le=10),
    ignore_bg: bool = Form(True)
):
    """
    Загружает изображение, выделяет передний план (опционально) и возвращает
    доминирующие цвета в формате RGB, их процентное соотношение и названия.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Не удалось декодировать изображение"}

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        colors = get_dominant_colors(img_rgb, n_clusters=n_clusters, ignore_bg=ignore_bg)

        return {"colors": colors}
    except Exception as e:
        return {"error": str(e)}
