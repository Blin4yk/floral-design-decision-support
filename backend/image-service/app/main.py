from fastapi import FastAPI, File, Form, UploadFile

app = FastAPI(title="flora-image-mock")


@app.post("/api/upload")
async def upload_image(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg", "image/png"}:
        return {"palette": []}

    # Заглушка: палитра подменяется стабильными цветами.
    return {
        "palette": ["#8FAF6F", "#D6B58F", "#A9C5D8", "#6E7C3A", "#D9756C", "#EFE4D2"]
    }


@app.post("/api/v1/images/process")
async def process_image(
    file: UploadFile = File(...),
    n_clusters: int = Form(3),
    ignore_bg: bool = Form(True),
):
    if file.content_type not in {"image/jpeg", "image/png"}:
        return {"colors": []}

    # Заглушка в формате вашего backend-контракта process.
    return {
        "colors": [
            {"rgb": [56, 168, 64], "percentage": 0.42, "color_name": "green"},
            {"rgb": [40, 120, 200], "percentage": 0.33, "color_name": "blue"},
            {"rgb": [144, 192, 48], "percentage": 0.25, "color_name": "yellowgreen"},
        ],
        "meta": {"n_clusters": n_clusters, "ignore_bg": ignore_bg},
    }
