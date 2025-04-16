import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app, add_test_camera
from app.models import Base, Camera
from app.database import engine, SessionLocal
import os

class TestMainApp(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовый клиент
        self.client = TestClient(app)

    def tearDown(self):
        # Очищаем базу данных
        Base.metadata.drop_all(bind=engine)

    def test_app_initialization(self):
        # Тест инициализации приложения
        self.assertIsNotNone(app)
        self.assertEqual(app.title, "Video Surveillance App")
        self.assertEqual(app.version, "1.0.0")

    def test_cors_middleware(self):
        # Тест CORS middleware
        response = self.client.options("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access-control-allow-origin", response.headers)
        self.assertIn("access-control-allow-methods", response.headers)
        self.assertIn("access-control-allow-headers", response.headers)

    def test_add_test_camera(self):
        # Тест добавления тестовой камеры
        add_test_camera()
        
        # Проверяем, что камера была добавлена
        db = self.SessionLocal()
        camera = db.query(Camera).filter(Camera.name == "Тестовая камера").first()
        db.close()
        
        self.assertIsNotNone(camera)
        self.assertEqual(camera.name, "Тестовая камера")
        self.assertTrue(camera.is_active)

    def test_add_test_camera_duplicate(self):
        # Тест добавления дубликата тестовой камеры
        add_test_camera()
        add_test_camera()
        
        # Проверяем, что камера была добавлена только один раз
        db = self.SessionLocal()
        cameras = db.query(Camera).filter(Camera.name == "Тестовая камера").all()
        db.close()
        
        self.assertEqual(len(cameras), 1)

    @patch('app.main.connected_clients')
    def test_websocket_connection(self, mock_clients):
        # Тест WebSocket подключения
        with self.client.websocket_connect("/ws") as websocket:
            data = websocket.receive_text()
            self.assertIsNotNone(data)

    @patch('app.main.connected_clients')
    def test_websocket_disconnect(self, mock_clients):
        # Тест отключения WebSocket
        with self.client.websocket_connect("/ws") as websocket:
            websocket.close()
            self.assertNotIn(websocket, mock_clients)

    def test_websocket_invalid_connection(self):
        # Тест некорректного WebSocket подключения
        with self.assertRaises(Exception):
            self.client.websocket_connect("/invalid_ws")

    def test_api_documentation(self):
        # Тест доступности документации API
        response = self.client.get("/docs")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers["content-type"])

    def test_api_redoc(self):
        # Тест доступности ReDoc документации
        response = self.client.get("/redoc")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers["content-type"])

    def test_health_check(self):
        # Тест эндпоинта проверки здоровья
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_error_handling(self):
        # Тест обработки ошибок
        response = self.client.get("/nonexistent")
        self.assertEqual(response.status_code, 404)

    def test_database_connection(self):
        # Тест подключения к базе данных
        db = self.SessionLocal()
        try:
            # Проверяем, что можем выполнить простой запрос
            result = db.execute("SELECT 1").scalar()
            self.assertEqual(result, 1)
        finally:
            db.close()

if __name__ == '__main__':
    unittest.main() 