from fastapi import FastAPI, File, UploadFile
import cv2
import numpy as np

from app.api.v1.images import router as images_router
from app.services.palette_extract import build_process_response

app = FastAPI(title="flora-image-service")
app.include_router(images_router)


@app.post("/api/upload")
async def upload_image(image: UploadFile = File(...)):
    """Совместимость с фронтом: та же обработка, что и /api/v1/images/process."""
    if image.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        return {"palette": [], "colors": [], "error": "Поддерживаются JPG и PNG"}
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"palette": [], "colors": [], "error": "Не удалось декодировать изображение"}
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return build_process_response(img_rgb)
