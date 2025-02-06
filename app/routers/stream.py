# app/routers/stream.py

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import cv2

from .. import models, database

router = APIRouter(
    prefix="/stream",
    tags=["Stream"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def gen_frames(camera_url: str):
    cap = cv2.VideoCapture(camera_url)
    if not cap.isOpened():
        raise HTTPException(status_code=404, detail="Не удалось открыть видеопоток")
    while True:
        success, frame = cap.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()

@router.get("/{camera_id}")
def video_stream(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if camera is None or not camera.is_active:
        raise HTTPException(status_code=404, detail="Камера не найдена или неактивна")
    return StreamingResponse(gen_frames(camera.url), media_type="multipart/x-mixed-replace; boundary=frame")
