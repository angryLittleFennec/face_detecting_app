import sqlite3
import dlib
import numpy as np
from PIL import Image
import os

# Загрузка моделей dlib
face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

def get_face_embedding(image_path):
    # Извлекает вектор лица из изображения
    image = np.array(Image.open(image_path))
    dets = face_detector(image, 1)
    if len(dets) == 0:
        return None
    shape = shape_predictor(image, dets[0])
    face_descriptor = face_rec_model.compute_face_descriptor(image, shape)
    return np.array(face_descriptor)

def save_faces_from_directory(name, directory):
    # Добавляет все лица из директории для одного человека
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    
    # Проверяет, существует ли человек в таблице persons
    cursor.execute("SELECT id FROM persons WHERE name = ?", (name,))
    person = cursor.fetchone()
    
    if person is None:
        # Если человек не существует, добавляем его
        cursor.execute("INSERT INTO persons (name) VALUES (?)", (name,))
        person_id = cursor.lastrowid
    else:
        person_id = person[0]
    
    # Обрабатывает все изображения в директории
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(directory, filename)
            embedding = get_face_embedding(image_path)
            
            if embedding is not None:
                encoding_str = ",".join(map(str, embedding))
                cursor.execute(
                    "INSERT INTO faces (person_id, encoding) VALUES (?, ?)",
                    (person_id, encoding_str)
                )
                print(encoding_str)
                print(f"Лицо из {filename} добавлено для {name}.")
            else:
                print(f"Лицо не найдено в {filename}.")
    
    conn.commit()
    conn.close()
    print(f"Все лица для {name} добавлены в базу.")

save_faces_from_directory("Kristina", "images/kristina")