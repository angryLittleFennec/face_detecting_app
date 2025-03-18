FROM ubuntu:22.04
WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential cmake git pkg-config \
    python3-dev python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN apt-get update

RUN pip install schedule fastapi uvicorn[standard] pydantic fpdf pytelegrambotapi

COPY . .

EXPOSE 8090
