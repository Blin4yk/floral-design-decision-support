# YourBestFlora

Сервис подбора растений на основе анализа цвета фотографии участка, климатической зоны и типа почвы.

## Технологии
- FastAPI (Python)
- PostgreSQL + SQLAlchemy (async)
- scikit-learn (KMeans) + Pillow для анализа цвета
- Docker Compose

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repo>
cd plant-picker-backend
```

### Docker Compose

Из корня `plant_picker_backend`:

```bash
docker compose up --build
```

Том кода смонтирован как `./app` → `/app/app`, чтобы в контейнере сохранялся пакет Python `app` и работала команда `uvicorn app.main:app`.

### Локальный запуск (без Docker)

Из корня `plant_picker_backend`, с учётом `PYTHONPATH`:

```bash
# Windows (PowerShell)
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Linux / macOS
export PYTHONPATH="$(pwd)"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```