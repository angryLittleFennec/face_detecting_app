import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from kubernetes import client, config
from typing import List

from . import models, database
from .routers import cameras, stream, persons, faces
import dlib


logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Video Surveillance App",
    description="Приложение для видеонаблюдения",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

config.load_incluster_config()


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(cameras.router, prefix='/api')
app.include_router(stream.router, prefix='/api')
app.include_router(persons.router, prefix="/api")
app.include_router(faces.router, prefix="/api")

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


def load_ml_models(app: FastAPI):
    try:
        app.state.face_detector = dlib.get_frontal_face_detector()
        app.state.shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
        app.state.face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        raise

@app.on_event("startup")
async def startup_event():
        # Load ML models
    load_ml_models(app)
        
        # Any other startup tasks
    logger.info("Application startup complete")