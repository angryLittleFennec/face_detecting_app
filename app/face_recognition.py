import os
from fastapi import FastAPI, Query, HTTPException, Depends
import dlib
import numpy as np
from app.models import Face, Person, Base
from PIL import Image

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Инициализация моделей dlib
try:
    face_detector = dlib.get_frontal_face_detector()
    shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
    face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")
except (AttributeError, FileNotFoundError):
    # Для тестового окружения
    face_detector = None
    shape_predictor = None
    face_rec_model = None

app = FastAPI()

# Для простоты используем SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

def get_engine():
    return create_engine(DATABASE_URL)

def get_session_local():
    return sessionmaker(bind=get_engine(), autocommit=False, autoflush=False)

def get_db():
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()

def find_matching_face(embedding, db: Session):
    # Ищет совпадение среди сохранённых лиц в базе данных
    try:
        if not isinstance(embedding, np.ndarray):
            print("Error: embedding is not a numpy array")
            return None
            
        if embedding.shape != (128,):
            print(f"Error: invalid embedding shape: {embedding.shape}")
            return None
            
        faces = db.query(Face).all()
        print(f"Found {len(faces)} faces in database")
        
        min_dist = float("inf")
        best_match = None
        
        for face in faces:
            try:
                # Преобразует строку encoding в массив numpy
                encoding = np.fromstring(face.encoding, sep=',')
                
                if encoding.shape != (128,):
                    print(f"Warning: skipping face {face.id} due to invalid shape: {encoding.shape}")
                    continue
                
                # Вычисляет евклидово расстояние
                dist = np.linalg.norm(encoding - embedding)
                print(f"Face {face.id}: distance = {dist}")
                
                # Если расстояние меньше порога и минимальное, обновляем лучший результат
                if dist < 0.6 and dist < min_dist:
                    min_dist = dist
                    best_match = face.person_id
                    print(f"New best match: face {face.id} with distance {dist}")
            except Exception as e:
                print(f"Error processing face {face.id}: {e}")
                continue
        
        if best_match:
            # Получает имя человека по его ID
            person = db.query(Person).filter(Person.id == best_match).first()
            if person:
                print(f"Found matching person: {person.name}")
                return person.name
            else:
                print(f"Error: person with ID {best_match} not found")
                return None
        else:
            print("No matching face found")
            return None
            
    except Exception as e:
        print(f"Error in find_matching_face: {e}")
        return None

@app.get("/find_face")
async def find_face(
    embedding_str: str = Query(..., description="Face embedding as a comma-separated string"),
    db: Session = Depends(get_db)
):
    # Принимает эмбеддинг лица в виде строки и ищет совпадение в базе
    try:
        # Проверяем, что строка не пустая и содержит числа, разделенные запятыми
        if not embedding_str or not all(part.replace('.', '', 1).replace('-', '', 1).isdigit() 
                  for part in embedding_str.split(',') if part.strip()):
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "message": "Invalid number format"
                }
            )
            
        embedding = np.fromstring(embedding_str, sep=',')
        print(f"Parsed embedding shape: {embedding.shape}")
        
        # Проверяем размерность эмбеддинга
        if embedding.size != 128:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "message": "Invalid embedding dimension"
                }
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": f"Invalid embedding format. Expected 128 comma-separated numbers. Error: {str(e)}"
            }
        )
    
    match = find_matching_face(embedding, db)
    if match:
        return {"status": "success", "person": match}
    return {"status": "not_found"}
