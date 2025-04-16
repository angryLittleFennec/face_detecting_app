from fastapi import FastAPI, File, Query, UploadFile, HTTPException
import dlib
import numpy as np
from app.models import Face, Person
from PIL import Image

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Загрузка модели dlib для извлечения фичей
face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

app = FastAPI()

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

def find_matching_face(embedding):
    # Ищет совпадение среди сохранённых лиц в базе данных
    db = SessionLocal()
    
    faces = db.query(Face).all()
    
    min_dist = float("inf")
    best_match = None
    
    for face in faces:
        # Преобразует строку encoding в массив numpy
        encoding = np.fromstring(face.encoding, sep=',')
        
        # Вычисляет евклидово расстояние
        dist = np.linalg.norm(encoding - embedding)
        
        # Если расстояние меньше порога и минимальное, обновляем лучший результат
        if dist < 0.6 and dist < min_dist:
            min_dist = dist
            best_match = face.person_id  # Сохраняем ID человека
    
    db.close()
    
    if best_match:
        # Получает имя человека по его ID
        db = SessionLocal()
        person = db.query(Person).filter(Person.id == best_match).first()
        db.close()
        return person.name if person else None
    else:
        return None     
 

@app.get("/find_face")
async def find_face(embedding_str: str = Query(..., description="Face embedding as a comma-separated string")):
    # Принимает эмбеддинг лица в виде строки и ищет совпадение в базе
    try:
        embedding = np.fromstring(embedding_str, sep=',')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid embedding format. Expected comma-separated numbers.")
    
    match = find_matching_face(embedding)
    if match:
        return {"status": "success", "person": match}
    return {"status": "not_found"}
