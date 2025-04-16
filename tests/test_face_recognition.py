import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.face_recognition import app
import numpy as np
from app.models import Base, Person, Face, Camera
from app.database import engine, SessionLocal
import cv2
import os
from app.services.face_recognition import FaceRecognitionService

class TestFaceRecognition(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовые данные
        self.db = self.SessionLocal()
        self.test_person = Person(name="Test Person")
        self.db.add(self.test_person)
        self.db.commit()
        
        # Создаем тестовое лицо
        test_embedding = np.random.rand(128)  # Тестовый эмбеддинг
        self.test_face = Face(
            person_id=self.test_person.id,
            encoding=",".join(map(str, test_embedding))
        )
        self.db.add(self.test_face)
        self.db.commit()
        
        # Создаем тестовый клиент
        self.client = TestClient(app)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_find_face_success(self):
        # Тест успешного поиска лица
        test_embedding = np.random.rand(128)
        test_embedding_str = ",".join(map(str, test_embedding))
        response = self.client.get(f"/find_face?embedding_str={test_embedding_str}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")

    def test_find_face_invalid_embedding(self):
        # Тест с некорректным эмбеддингом
        response = self.client.get("/find_face?embedding_str=invalid")
        self.assertEqual(response.status_code, 400)

    def test_find_face_no_match(self):
        # Тест поиска лица без совпадений
        test_embedding = np.random.rand(128) * 1000  # Очень далекий эмбеддинг
        test_embedding_str = ",".join(map(str, test_embedding))
        response = self.client.get(f"/find_face?embedding_str={test_embedding_str}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "not_found")

    @patch('dlib.get_frontal_face_detector')
    def test_face_detector_initialization(self, mock_detector):
        # Тест инициализации детектора лиц
        from app.face_recognition import face_detector
        mock_detector.assert_called_once()

    @patch('dlib.shape_predictor')
    def test_shape_predictor_initialization(self, mock_predictor):
        # Тест инициализации предиктора ключевых точек
        from app.face_recognition import shape_predictor
        mock_predictor.assert_called_once()

    @patch('dlib.face_recognition_model_v1')
    def test_face_rec_model_initialization(self, mock_model):
        # Тест инициализации модели распознавания лиц
        from app.face_recognition import face_rec_model
        mock_model.assert_called_once()

    def test_find_matching_face_with_multiple_faces(self):
        # Тест поиска совпадения среди нескольких лиц
        # Создаем еще одно лицо
        test_embedding2 = np.random.rand(128)
        test_face2 = Face(
            person_id=self.test_person.id,
            encoding=",".join(map(str, test_embedding2))
        )
        self.db.add(test_face2)
        self.db.commit()

        # Тестируем поиск
        test_embedding = np.random.rand(128)
        test_embedding_str = ",".join(map(str, test_embedding))
        response = self.client.get(f"/find_face?embedding_str={test_embedding_str}")
        self.assertEqual(response.status_code, 200)

    def test_find_matching_face_with_deleted_person(self):
        # Тест поиска лица для удаленного человека
        self.db.delete(self.test_person)
        self.db.commit()

        test_embedding = np.random.rand(128)
        test_embedding_str = ",".join(map(str, test_embedding))
        response = self.client.get(f"/find_face?embedding_str={test_embedding_str}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "not_found")

    def test_find_face_with_empty_database(self):
        # Тест поиска лица в пустой базе данных
        self.db.delete(self.test_face)
        self.db.delete(self.test_person)
        self.db.commit()

        test_embedding = np.random.rand(128)
        test_embedding_str = ",".join(map(str, test_embedding))
        response = self.client.get(f"/find_face?embedding_str={test_embedding_str}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "not_found")

    def test_find_face_with_missing_embedding(self):
        # Тест поиска лица с отсутствующим параметром
        response = self.client.get("/find_face")
        self.assertEqual(response.status_code, 422)

class TestFaceRecognitionService(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовую камеру
        db = self.SessionLocal()
        self.test_camera = Camera(
            name="Test Camera",
            url="rtsp://test.com/stream",
            is_active=True
        )
        db.add(self.test_camera)
        db.commit()
        db.close()
        
        # Инициализируем сервис распознавания лиц
        self.face_service = FaceRecognitionService()

    def tearDown(self):
        # Очищаем базу данных
        Base.metadata.drop_all(bind=engine)
        
        # Удаляем тестовые файлы
        if os.path.exists("test_images"):
            for file in os.listdir("test_images"):
                os.remove(os.path.join("test_images", file))
            os.rmdir("test_images")

    @patch('app.services.face_recognition.dlib.face_detector')
    @patch('app.services.face_recognition.dlib.shape_predictor')
    @patch('app.services.face_recognition.dlib.face_recognition_model_v1')
    def test_initialize_models(self, mock_recognition_model, mock_shape_predictor, mock_face_detector):
        # Тест инициализации моделей
        self.face_service.initialize_models()
        
        mock_face_detector.assert_called_once()
        mock_shape_predictor.assert_called_once()
        mock_recognition_model.assert_called_once()

    def test_find_face_success(self):
        # Тест успешного поиска лица
        # Создаем тестовое лицо в базе данных
        db = self.SessionLocal()
        test_person = Person(
            name="Test Person",
            face_embedding=np.random.rand(128).tolist(),  # Тестовый эмбеддинг
            camera_id=self.test_camera.id
        )
        db.add(test_person)
        db.commit()
        db.close()
        
        # Создаем тестовое изображение
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Мокаем функции dlib
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector, \
             patch('app.services.face_recognition.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.face_recognition.dlib.face_recognition_model_v1') as mock_recognition:
            
            # Настраиваем моки
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]  # Тестовый прямоугольник лица
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            # Ищем лицо
            result = self.face_service.find_face(test_image)
            
            self.assertIsNotNone(result)
            self.assertEqual(result["person_id"], test_person.id)
            self.assertEqual(result["confidence"], 1.0)

    def test_find_face_no_face(self):
        # Тест поиска лица при отсутствии лиц на изображении
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector:
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = []  # Нет лиц на изображении
            
            result = self.face_service.find_face(test_image)
            
            self.assertIsNone(result)

    def test_find_face_invalid_embedding(self):
        # Тест поиска лица с некорректным эмбеддингом
        # Создаем тестовое лицо с некорректным эмбеддингом
        db = self.SessionLocal()
        test_person = Person(
            name="Test Person",
            face_embedding=[1.0] * 127,  # Неполный эмбеддинг
            camera_id=self.test_camera.id
        )
        db.add(test_person)
        db.commit()
        db.close()
        
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector, \
             patch('app.services.face_recognition.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.face_recognition.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            result = self.face_service.find_face(test_image)
            
            self.assertIsNone(result)

    def test_find_face_no_match(self):
        # Тест поиска лица при отсутствии совпадений
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector, \
             patch('app.services.face_recognition.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.face_recognition.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            result = self.face_service.find_face(test_image)
            
            self.assertIsNone(result)

    def test_find_face_multiple_faces(self):
        # Тест поиска лица при наличии нескольких лиц
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector, \
             patch('app.services.face_recognition.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.face_recognition.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100), (200, 200, 300, 300)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            result = self.face_service.find_face(test_image)
            
            self.assertIsNotNone(result)
            self.assertEqual(len(result["faces"]), 2)

    def test_find_face_deleted_person(self):
        # Тест поиска лица для удаленного человека
        db = self.SessionLocal()
        test_person = Person(
            name="Test Person",
            face_embedding=np.random.rand(128).tolist(),
            camera_id=self.test_camera.id,
            is_deleted=True
        )
        db.add(test_person)
        db.commit()
        db.close()
        
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector, \
             patch('app.services.face_recognition.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.face_recognition.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            result = self.face_service.find_face(test_image)
            
            self.assertIsNone(result)

    def test_find_face_empty_database(self):
        # Тест поиска лица при пустой базе данных
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with patch('app.services.face_recognition.dlib.face_detector') as mock_detector, \
             patch('app.services.face_recognition.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.face_recognition.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            result = self.face_service.find_face(test_image)
            
            self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main() 