FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi==0.115.12 uvicorn==0.34.0 pydantic==2.10.6 numpy==2.2.4 httpx==0.28.1 SQLAlchemy==2.0.48 "psycopg[binary]==3.2.12"

COPY backend/recommendation-service/app ./app
COPY shared/python ./shared/python

ENV PYTHONPATH=/app/shared/python

EXPOSE 8004

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
