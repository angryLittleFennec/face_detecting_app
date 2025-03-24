import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, database
from ..services import camera_service

router = APIRouter(
    prefix="/cameras",
    tags=["Cameras"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

@router.post("/", response_model=schemas.Camera)
def create_camera(camera: schemas.CameraCreate, db: Session = Depends(get_db)):
    db_camera = models.Camera(
        name=camera.name,
        url=str(camera.url),  # Преобразуем HttpUrl в строку
        description=camera.description,
        is_active=camera.is_active
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    # Запускаем обработку видеопотока для новой камеры
    camera_service.start_video_processing(db_camera.id)
    return db_camera


@router.get("/", response_model=List[schemas.Camera])
def read_cameras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cameras = db.query(models.Camera).offset(skip).limit(limit).all()
    return cameras

@router.get("/{camera_id}", response_model=schemas.Camera)
def read_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    return camera

@router.put("/{camera_id}", response_model=schemas.Camera)
def update_camera(camera_id: int, camera_update: schemas.CameraUpdate, db: Session = Depends(get_db)):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    for var, value in vars(camera_update).items():
        setattr(camera, var, value) if value else None
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    # Останавливаем обработку видеопотока для камеры
    camera_service.stop_video_processing(camera.id)
    db.delete(camera)
    db.commit()
    return {"detail": "Камера удалена"}

@router.get("/camera/{camera_id}/log/download")
async def download_camera_log(camera_id: int):
    camera_service.create_pdf_from_logs()

    if not os.path.exists("person_detection_report.pdf"):
        raise HTTPException(status_code=404, detail="Log file not found")

    response = FileResponse(
        "person_detection_report.pdf",
        media_type="application/pdf",
        filename=f"camera_{camera_id}_logs.pdf"
    )
    
    os.remove("person_detection_report.pdf")

    return response