from fastapi import APIRouter, Depends, status, HTTPException
from kubernetes.client import CoreV1Api
from kubernetes import config
import yaml
import os
import logging
from typing import List
from sqlalchemy.orm import Session
import subprocess
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

from .. import models, schemas, database, auth
from ..schemas import StreamProcessorConfig, StreamProcessorResponse, StreamProcessorList

# Настройка логгера
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/kubernetes",
    tags=["kubernetes"],
)

NAMESPACE = 'default'
HELM_TIMEOUT = "300s"  # 5 минут таймаут для Helm
HELM_ATOMIC = True     # Откат при ошибке
HELM_WAIT = True       # Ждать готовности подов
IP = "158.160.133.8"


# Получаем абсолютный путь к директории проекта
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Путь к чарту stream-processor
HELM_CHART_PATH = Path('/app/helm/stream-processor')
logger.debug(f"Helm chart path: {HELM_CHART_PATH}")

try:
    config.load_kube_config()
    logger.debug("Kubernetes config loaded successfully")
except Exception as e:
    logger.warning(f"Failed to load kubernetes config: {str(e)}")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def run_helm_command(cmd: List[str]) -> tuple[int, str, str]:
    """Выполняет команду Helm в отдельном процессе"""
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        return process.returncode, stdout.decode(), stderr.decode()
    except Exception as e:
        logger.error(f"Error running helm command: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute helm command: {str(e)}"
        )

@router.post("/stream-processor", response_model=StreamProcessorResponse)
async def deploy_stream_processor(
    config: StreamProcessorConfig,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Starting stream processor deployment for camera_id: {config.camera_id}")
    try:
        # Проверяем существование процессора с таким именем
        existing_processor = db.query(models.StreamProcessor).filter(models.StreamProcessor.name == config.name).first()
        if existing_processor:
            logger.error(f"Stream processor with name {config.name} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stream processor with name {config.name} already exists"
            )

        # Проверяем существование камеры, если указан camera_id
        if config.camera_id:
            logger.debug(f"Checking camera existence: {config.camera_id}")
            camera = db.query(models.Camera).filter(models.Camera.id == config.camera_id).first()
            if not camera:
                logger.error(f"Camera not found: {config.camera_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Camera with id {config.camera_id} not found"
                )

        # Проверяем существование чарта
        logger.debug(f"Checking helm chart existence at: {HELM_CHART_PATH}")
        if not HELM_CHART_PATH.exists():
            logger.error(f"Helm chart not found at {HELM_CHART_PATH}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Helm chart not found at {HELM_CHART_PATH}"
            )

        # Создаем временный values.yaml с захардкоженными значениями
        values = {
            "replicaCount": 1,
            "image": {
                "repository": "angrylittlefennec/stream-processor",
                "tag": "latest",
                "pullPolicy": "Always"
            },
            "command": ["/bin/sh"],
            "args": [
                "-c",
                f"python3.10 read_frames.py"
            ],
            "podAnnotations": {
                "container.name": f"stream-processor-{config.name}"
            },
            "nameOverride": f"stream-processor-{config.name}",
            "fullnameOverride": f"stream-processor-{config.name}",
            "resources": {
                "limits": {
                    "cpu": "2"
                },
                "requests": {
                    "cpu": "2"
                }
            },
            "env": [
                {
                    "name": "RTSP_IN",
                    "value": camera.url
                },
                {
                    "name": "RTSP_OUT",
                    "value": f"rtsp://mediamtx-svc:8554/mediamtx/processed/{config.name}"
                }
            ]
        }
        logger.debug(f"Generated values.yaml: {values}")

        values_path = f"/tmp/stream-processor-{config.name}-values.yaml"
        with open(values_path, "w") as f:
            yaml.dump(values, f)
        logger.debug(f"Values file written to: {values_path}")

        # Деплоим с помощью Helm
        release_name = f"stream-processor-{config.name}"
        cmd = [
            "helm",
            "upgrade",
            "--install",
            release_name,
            str(HELM_CHART_PATH),
            "-f",
            values_path,
            "--debug"
        ]
        cmd = [x for x in cmd if x]  # Убираем пустые строки

        returncode, stdout, stderr = await run_helm_command(cmd)
        logger.debug(f"Helm command output: {stdout}")
        
        if returncode != 0:
            logger.error(f"Helm command failed: {stderr}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to deploy stream processor: {stderr}"
            )

        # Сохраняем информацию в БД
        stream_processor = models.StreamProcessor(
            name=config.name,
            camera_id=config.camera_id,
            input_stream=camera.url if camera else None,
            output_stream=f"http://{IP}:80/mediamtx/processed/{config.name}",
            release_name=release_name
        )
        db.add(stream_processor)
        db.commit()
        db.refresh(stream_processor)

        # Удаляем временный файл
        os.remove(values_path)
        logger.debug(f"Temporary values file removed: {values_path}")

        logger.info(f"Stream processor deployed successfully: {release_name}")
        return StreamProcessorResponse(
            name=config.name,
            release_name=release_name,
            camera_id=config.camera_id,
            input_stream=stream_processor.input_stream,
            output_stream=stream_processor.output_stream,
            status="success",
            message="Stream processor deployed successfully"
        )

    except HTTPException as e:
        logger.error(f"HTTP Exception during deployment: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during deployment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/stream-processor/{name}")
async def delete_stream_processor(
    name: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Starting stream processor deletion: {name}")
    try:
        # Получаем информацию о процессоре из БД
        stream_processor = db.query(models.StreamProcessor).filter(models.StreamProcessor.name == name).first()
        if not stream_processor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stream processor {name} not found"
            )

        cmd = [
            "helm",
            "uninstall",
            stream_processor.release_name,
            "--timeout", HELM_TIMEOUT,
            "--debug"
        ]
        
        returncode, stdout, stderr = await run_helm_command(cmd)
        logger.debug(f"Helm command output: {stdout}")
        
        if returncode != 0:
            logger.error(f"Helm command failed: {stderr}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete stream processor: {stderr}"
            )

        # Удаляем запись из БД
        db.delete(stream_processor)
        db.commit()

        logger.info(f"Stream processor deleted successfully: {name}")
        return {"status": "success", "message": "Stream processor deleted successfully"}

    except HTTPException as e:
        logger.error(f"HTTP Exception during deletion: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during deletion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/stream-processor/{name}/status")
async def get_stream_processor_status(
    name: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Getting stream processor status: {name}")
    try:
        # Получаем информацию о процессоре из БД
        stream_processor = db.query(models.StreamProcessor).filter(models.StreamProcessor.name == name).first()
        if not stream_processor:
            logger.error(f"Stream processor not found in database: {name}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stream processor {name} not found in database"
            )

        cmd = [
            "helm",
            "status",
            stream_processor.release_name,
            "--timeout", HELM_TIMEOUT,
            "--debug"
        ]
        
        returncode, stdout, stderr = await run_helm_command(cmd)
        logger.debug(f"Helm command output: {stdout}")
        
        if returncode != 0:
            logger.error(f"Helm command failed: {stderr}")
            # Если релиз не найден в Helm, но есть в БД, возвращаем специальный статус
            if "not found" in stderr.lower():
                return {
                    "name": name,
                    "status": "not_deployed",
                    "details": "Process found in database but not deployed in Kubernetes",
                    "database_info": {
                        "camera_id": stream_processor.camera_id,
                        "input_stream": stream_processor.input_stream,
                        "output_stream": stream_processor.output_stream,
                        "created_at": stream_processor.created_at.isoformat()
                    }
                }
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get stream processor status: {stderr}"
            )

        logger.info(f"Successfully retrieved status for: {name}")
        return {
            "name": name,
            "status": "success",
            "details": stdout,
            "database_info": {
                "camera_id": stream_processor.camera_id,
                "input_stream": stream_processor.input_stream,
                "output_stream": stream_processor.output_stream,
                "created_at": stream_processor.created_at.isoformat()
            }
        }

    except HTTPException as e:
        logger.error(f"HTTP Exception during status check: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during status check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/deploy")
def install_chart(
    release_name: str, 
    chart: str,
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        cmd = [
            "helm", "install", release_name, chart,
            "--namespace", NAMESPACE, "--set", "ingress.enabled=false" 
        ]
        
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Helm error: {e.stderr}"
        )

@router.get("/stream-processors", response_model=StreamProcessorList)
async def get_stream_processors(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Получает список всех процессоров потоков.
    """
    logger.info("Getting list of all stream processors")
    try:
        processors = db.query(models.StreamProcessor).all()
        logger.info(f"Found {len(processors)} stream processors")
        return {"processors": processors}

    except Exception as e:
        logger.error(f"Error getting stream processors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stream processors: {str(e)}"
        )

