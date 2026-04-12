import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile

from app.services.palette_extract import build_process_response

router = APIRouter(prefix="/api/v1/images", tags=["images"])


@router.post("/process")
async def process_image(
    file: UploadFile = File(...),
    ignore_bg: bool = Form(False),
):
    """
    Шаги 1–2 модели: RGB→Lab по всем пикселям, K-means++ [5,8], silhouette, веса w_k.
    ignore_bg зарезервирован (полная модель использует всё изображение I при False).
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Не удалось декодировать изображение", "palette": [], "colors": []}

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    _ = ignore_bg  # явно не меняем I в соответствии с формальной моделью по умолчанию
    return build_process_response(img_rgb)
