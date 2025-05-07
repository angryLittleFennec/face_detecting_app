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
from ..schemas import StreamProcessorConfig, StreamProcessorResponse

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

async def run_helm_command(cmd: List[str]) -> tuple[int, str, str]:
    """Асинхронное выполнение команды Helm"""
    logger.debug(f"Executing helm command: {' '.join(cmd)}")
    
    def _run():
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=int(HELM_TIMEOUT.replace('s', ''))
        )
    
    try:
        with ThreadPoolExecutor() as executor:
            result = await asyncio.get_event_loop().run_in_executor(executor, _run)
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        logger.error(f"Helm command timed out after {HELM_TIMEOUT}")
        return 1, "", f"Command timed out after {HELM_TIMEOUT}"
    except Exception as e:
        logger.error(f"Error executing helm command: {str(e)}")
        return 1, "", str(e)

@router.get("/pods")
def list_pods(current_user: models.User = Depends(auth.get_current_active_user)):
    v1 = CoreV1Api()
    pods = v1.list_namespaced_pod(namespace='default')
    return [p.metadata.name for p in pods.items]

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/stream-processor", response_model=StreamProcessorResponse)
async def deploy_stream_processor(
    config: StreamProcessorConfig,
    #current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Starting stream processor deployment for camera_id: {config.camera_id}")
    try:
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
                f"python3.10 read_frames.py --input {config.input_stream} --output {config.output_stream}"
            ],
            "podAnnotations": {
                "container.name": f"stream-processor-{config.name}-camera-{config.camera_id}"
            },
            "nameOverride": f"stream-processor-{config.name}-camera-{config.camera_id}",
            "fullnameOverride": f"stream-processor-{config.name}-camera-{config.camera_id}"
        }
        logger.debug(f"Generated values.yaml: {values}")

        values_path = f"/tmp/stream-processor-{config.name}-values.yaml"
        with open(values_path, "w") as f:
            yaml.dump(values, f)
        logger.debug(f"Values file written to: {values_path}")

        # Деплоим с помощью Helm
        release_name = f"stream-processor-{config.name}-camera-{config.camera_id}"
        cmd = [
            "helm",
            "upgrade",
            "--install",
            release_name,
            str(HELM_CHART_PATH),
            "-f",
            values_path,
            "--debug"  # Добавляем отладочную информацию
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

        # Удаляем временный файл
        os.remove(values_path)
        logger.debug(f"Temporary values file removed: {values_path}")

        logger.info(f"Stream processor deployed successfully: {release_name}")
        return StreamProcessorResponse(
            name=release_name,
            container_name=f"stream-processor-{config.name}-camera-{config.camera_id}",
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
    current_user: models.User = Depends(auth.get_current_active_user)
):
    logger.info(f"Starting stream processor deletion: {name}")
    try:
        cmd = [
            "helm",
            "uninstall",
            f"stream-processor-{name}",
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
    current_user: models.User = Depends(auth.get_current_active_user)
):
    logger.info(f"Getting stream processor status: {name}")
    try:
        cmd = [
            "helm",
            "status",
            f"stream-processor-{name}",
            "--timeout", HELM_TIMEOUT,
            "--debug"
        ]
        
        returncode, stdout, stderr = await run_helm_command(cmd)
        logger.debug(f"Helm command output: {stdout}")
        
        if returncode != 0:
            logger.error(f"Helm command failed: {stderr}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stream processor {name} not found"
            )

        logger.info(f"Successfully retrieved status for: {name}")
        return {
            "name": name,
            "status": "success",
            "details": stdout
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

