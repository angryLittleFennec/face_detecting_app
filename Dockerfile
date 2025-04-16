FROM ubuntu:24.04

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y  cmake python3-pip && pip install --no-cache-dir -r requirements.txt --break-system-packages

EXPOSE 8000

ENV PYTHONPATH=/app

COPY ml_models ml_models

COPY app app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
