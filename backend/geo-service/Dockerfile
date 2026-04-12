FROM python:3.11-slim

WORKDIR /app

COPY backend/geo-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/geo-service/app ./app
COPY shared/python ./shared/python

ENV PYTHONPATH=/app/shared/python

EXPOSE 8003

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
