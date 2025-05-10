import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from kubernetes import client, config
from typing import List

from . import models, database
from .routers import cameras, persons, faces, kuber, auth, db
import dlib


logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=database.engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_ml_models(app)
    logger.info("Application startup complete")
    yield
    # Shutdown
    logger.info("Application shutdown")

app = FastAPI(
    title="Video Surveillance App",
    description="Приложение для видеонаблюдения",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan
)

#config.load_incluster_config()
try:
    config.load_kube_config()
except:
    pass


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


app.include_router(auth.router, prefix='/api')
app.include_router(cameras.router, prefix='/api')
app.include_router(persons.router, prefix="/api")
app.include_router(faces.router, prefix="/api")
app.include_router(kuber.router, prefix="/api")
app.include_router(db.router, prefix="/api")

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