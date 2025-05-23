from http.client import HTTPException
from fastapi import APIRouter, Depends, File, UploadFile, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Face as FaceDB, Person, User
from .. import auth
from ..schemas import Face as FaceSchema, FaceCreate
from typing import List
import numpy as np
from PIL import Image
from io import BytesIO
from fastapi import HTTPException

router = APIRouter(prefix="/faces", tags=["faces"])

@router.get("/", response_model=List[FaceSchema])
def get_all_faces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    return db.query(FaceDB).offset(skip).limit(limit).all()

@router.post("/upload/{person_id}", status_code=status.HTTP_201_CREATED)
async def upload_faces(
    person_id: int,
    request: Request,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    # Проверяем существование человека
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    processed = 0
    for file in files:
        try:
            contents = await file.read()
            embedding = get_face_embedding(contents, request.app)
            if embedding is not None:
                face = FaceDB(
                    person_id=person_id,
                    encoding=",".join(map(str, embedding))
                )
                db.add(face)
                processed += 1
        except Exception as e:
            continue
    
    try:
        if processed > 0:
            db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )
    
    return {"message": f"Processed {processed} of {len(files)} files"}

def get_face_embedding(image_data: bytes, app) -> np.ndarray:
    try:
        image = Image.open(BytesIO(image_data))
        img_array = np.array(image)
        
        # Detect faces
        dets = app.state.face_detector(img_array, 1)
        if not dets:
            raise HTTPException(
                status_code=400,
                detail="No face detected in the image"
            )
            
        # Get face descriptor
        shape = app.state.shape_predictor(img_array, dets[0])
        descriptor = app.state.face_rec_model.compute_face_descriptor(img_array, shape)
        return np.array(descriptor)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Image processing error: {str(e)}"
        )