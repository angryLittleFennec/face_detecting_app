import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, database, auth


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
        

@router.post("/", response_model=schemas.Camera, status_code=201)
def create_camera(
    camera: schemas.CameraCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_camera = models.Camera(
        name=camera.name,
        url=camera.url,  # URL уже строка
        description=camera.description,
        is_active=camera.is_active
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    # Запускаем обработку видеопотока для новой камеры
    return db_camera


@router.get("/", response_model=List[schemas.Camera])
def read_cameras(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    cameras = db.query(models.Camera).offset(skip).limit(limit).all()
    return cameras

@router.get("/{camera_id}", response_model=schemas.Camera)
def read_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    return camera

@router.put("/{camera_id}", response_model=schemas.Camera)
def update_camera(
    camera_id: int,
    camera_update: schemas.CameraUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    for var, value in vars(camera_update).items():
        if var == 'url':
            setattr(camera, var, str(value))
            continue
        if value is not None:  # Проверяем, что значение не None
            setattr(camera, var, value)
    
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@router.delete("/{camera_id}")
def delete_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Камера не найдена")
    # Останавливаем обработку видеопотока для камеры
    db.delete(camera)
    db.commit()
    return {"detail": "Камера успешно удалена"}

# @router.get("/camera/{camera_id}/log/download")
# async def download_camera_log(
#     camera_id: int,
#     current_user: models.User = Depends(auth.get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
#     if camera is None:
#         raise HTTPException(status_code=404, detail="Камера не найдена")

#     camera_service.create_pdf_from_logs()

#     if not os.path.exists("person_detection_report.pdf"):
#         raise HTTPException(status_code=404, detail="Log file not found")

#     response = FileResponse(
#         "person_detection_report.pdf",
#         media_type="application/pdf",
#         filename=f"camera_{camera_id}_logs.pdf"
#     )
    
#     os.remove("person_detection_report.pdf")

#     return response