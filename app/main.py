import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from kubernetes import client, config
from typing import List
import sys

from . import models, database
from .routers import cameras, persons, faces, kuber, auth, db, logging as logging_router
from .cron_tasks import setup_scheduler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=database.engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Загрузка ML моделей при старте
    logger.info("ML модели успешно загружены")
    
    setup_scheduler(app)
    logger.info("Планировщик задач успешно настроен")
    
    yield
    
    logger.info("Приложение завершает работу")

app = FastAPI(
    title="Video Surveillance App",
    description="Приложение для видеонаблюдения",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan
)

try:
    config.load_kube_config()
    logger.info("Kubernetes конфигурация загружена")
except Exception as e:
    logger.warning(f"Не удалось загрузить Kubernetes конфигурацию: {str(e)}")

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

app.include_router(auth.router, prefix='/api')
app.include_router(cameras.router, prefix='/api')
app.include_router(persons.router, prefix="/api")
app.include_router(faces.router, prefix="/api")
app.include_router(kuber.router, prefix="/api")
app.include_router(db.router, prefix="/api")
app.include_router(logging_router.router, prefix="/api")