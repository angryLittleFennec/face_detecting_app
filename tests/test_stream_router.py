import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.routers.stream import router
from app.models import Base, Camera
from app.database import engine, SessionLocal
import cv2
import numpy as np

class TestStreamRouter(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовый клиент
        self.client = TestClient(router)
        
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

    def tearDown(self):
        # Очищаем базу данных
        Base.metadata.drop_all(bind=engine)

    def test_get_stream_url(self):
        # Тест получения URL потока
        response = self.client.get(f"/stream/{self.test_camera.id}/url")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["url"], self.test_camera.url)

    def test_get_stream_url_nonexistent(self):
        # Тест получения URL несуществующего потока
        response = self.client.get("/stream/999/url")
        self.assertEqual(response.status_code, 404)

    def test_get_stream_status(self):
        # Тест получения статуса потока
        response = self.client.get(f"/stream/{self.test_camera.id}/status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["is_active"], True)

    def test_get_stream_status_inactive(self):
        # Тест получения статуса неактивного потока
        db = self.SessionLocal()
        self.test_camera.is_active = False
        db.commit()
        db.close()
        
        response = self.client.get(f"/stream/{self.test_camera.id}/status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["is_active"], False)

    @patch('cv2.VideoCapture')
    def test_generate_frames_success(self, mock_video_capture):
        # Тест успешной генерации кадров
        mock_capture = MagicMock()
        mock_capture.read.return_value = (True, np.zeros((480, 640, 3), dtype=np.uint8))
        mock_video_capture.return_value = mock_capture
        
        response = self.client.get(f"/stream/{self.test_camera.id}/frame")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/jpeg")

    @patch('cv2.VideoCapture')
    def test_generate_frames_failure(self, mock_video_capture):
        # Тест неудачной генерации кадров
        mock_capture = MagicMock()
        mock_capture.read.return_value = (False, None)
        mock_video_capture.return_value = mock_capture
        
        response = self.client.get(f"/stream/{self.test_camera.id}/frame")
        self.assertEqual(response.status_code, 500)

    def test_generate_frames_nonexistent(self):
        # Тест генерации кадров для несуществующей камеры
        response = self.client.get("/stream/999/frame")
        self.assertEqual(response.status_code, 404)

    def test_generate_frames_inactive(self):
        # Тест генерации кадров для неактивной камеры
        db = self.SessionLocal()
        self.test_camera.is_active = False
        db.commit()
        db.close()
        
        response = self.client.get(f"/stream/{self.test_camera.id}/frame")
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main() 