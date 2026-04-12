FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi==0.115.12 uvicorn==0.34.0 pydantic==2.10.6 email-validator==2.2.0 SQLAlchemy==2.0.48 "psycopg[binary]==3.2.12"

COPY backend/auth-service/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
