# app/main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from . import models, database
from .routers import cameras, stream

# Инициализируем базу данных и создаем таблицы
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Video Surveillance App",
    description="Приложение для видеонаблюдения",
    version="1.0.0",
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cameras.router)
app.include_router(stream.router)

# Добавляем тестовую камеру
from sqlalchemy.orm import Session

def add_test_camera():
    db = database.SessionLocal()
    try:
        # Проверяем, существует ли уже тестовая камера
        existing_camera = db.query(models.Camera).filter(models.Camera.name == "Тестовая камера").first()
        if existing_camera is None:
            test_camera = models.Camera(
                name="Тестовая камера",
                url="http://techslides.com/demos/sample-videos/small.mp4",  # Можно заменить на доступный видеопоток
                description="Это тестовая камера для целей разработки",
                is_active=True
            )
            db.add(test_camera)
            db.commit()
            db.refresh(test_camera)
            print("Тестовая камера добавлена.")
        else:
            print("Тестовая камера уже существует.")
    finally:
        db.close()

add_test_camera()

# WebSocket для взаимодействия с фронтендом
connected_clients: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Здесь можно обработать входящие данные от клиента
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
