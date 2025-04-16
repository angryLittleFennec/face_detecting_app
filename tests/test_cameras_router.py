import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.routers.cameras import router
from fastapi import FastAPI
from app.models import Base, Camera
from app.schemas import CameraCreate, CameraUpdate
from app.database import engine, SessionLocal
from sqlalchemy.orm import sessionmaker
import os
import json

app = FastAPI()
app.include_router(router)

class TestCamerasRouter(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовый клиент
        self.client = TestClient(app)
        
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
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        # Очищаем тестовые файлы
        if os.path.exists("person_detection_report.pdf"):
            os.remove("person_detection_report.pdf")

    def test_get_cameras(self):
        # Тест получения списка камер
        response = self.client.get("/cameras/")
        self.assertEqual(response.status_code, 200)
        cameras = response.json()
        self.assertEqual(len(cameras), 1)
        self.assertEqual(cameras[0]["name"], "Test Camera")

    def test_get_camera(self):
        # Тест получения конкретной камеры
        response = self.client.get(f"/cameras/{self.test_camera.id}")
        self.assertEqual(response.status_code, 200)
        camera = response.json()
        self.assertEqual(camera["name"], "Test Camera")

    def test_get_nonexistent_camera(self):
        # Тест получения несуществующей камеры
        response = self.client.get("/cameras/999")
        self.assertEqual(response.status_code, 404)

    def test_create_camera(self):
        # Тест создания новой камеры
        camera_data = {
            "name": "New Camera",
            "url": "rtsp://new.com/stream",
            "is_active": True
        }
        response = self.client.post("/cameras/", json=camera_data)
        self.assertEqual(response.status_code, 200)
        camera = response.json()
        self.assertEqual(camera["name"], "New Camera")

    def test_create_camera_invalid_data(self):
        # Тест создания камеры с некорректными данными
        camera_data = {
            "name": "",  # Пустое имя
            "url": "invalid_url",  # Некорректный URL
            "is_active": True
        }
        response = self.client.post("/cameras/", json=camera_data)
        self.assertEqual(response.status_code, 422)

    def test_update_camera(self):
        # Тест обновления камеры
        update_data = {
            "name": "Updated Camera",
            "url": "rtsp://updated.com/stream",
            "is_active": False
        }
        response = self.client.put(f"/cameras/{self.test_camera.id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        camera = response.json()
        self.assertEqual(camera["name"], "Updated Camera")
        self.assertEqual(camera["is_active"], False)

    def test_update_nonexistent_camera(self):
        # Тест обновления несуществующей камеры
        update_data = {
            "name": "Updated Camera",
            "url": "rtsp://updated.com/stream",
            "is_active": False
        }
        response = self.client.put("/cameras/999", json=update_data)
        self.assertEqual(response.status_code, 404)

    def test_delete_camera(self):
        # Тест удаления камеры
        response = self.client.delete(f"/cameras/{self.test_camera.id}")
        self.assertEqual(response.status_code, 200)
        
        # Проверяем, что камера действительно удалена
        db = self.SessionLocal()
        camera = db.query(Camera).filter(Camera.id == self.test_camera.id).first()
        db.close()
        self.assertIsNone(camera)

    def test_delete_nonexistent_camera(self):
        # Тест удаления несуществующей камеры
        response = self.client.delete("/cameras/999")
        self.assertEqual(response.status_code, 404)

    @patch('app.routers.cameras.get_camera_logs')
    def test_download_camera_logs(self, mock_get_logs):
        # Тест скачивания логов камеры
        mock_logs = [
            {"timestamp": "2024-01-01T00:00:00", "event": "test_event"},
            {"timestamp": "2024-01-01T00:01:00", "event": "test_event2"}
        ]
        mock_get_logs.return_value = mock_logs
        
        response = self.client.get(f"/cameras/{self.test_camera.id}/logs")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/json")
        
        logs = response.json()
        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0]["event"], "test_event")

    def test_download_nonexistent_camera_logs(self):
        # Тест скачивания логов несуществующей камеры
        response = self.client.get("/cameras/999/logs")
        self.assertEqual(response.status_code, 404)

    @patch('app.services.camera_service.create_pdf_from_logs')
    def test_download_camera_log(self, mock_create_pdf):
        # Создаем тестовый PDF файл
        with open("person_detection_report.pdf", "w") as f:
            f.write("Test log content")
        
        # Тест скачивания лога камеры
        response = self.client.get(f"/cameras/camera/{self.test_camera.id}/log/download")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        
        # Проверяем, что файл был удален
        self.assertFalse(os.path.exists("person_detection_report.pdf"))

    def test_download_nonexistent_camera_log(self):
        # Тест скачивания лога несуществующей камеры
        response = self.client.get("/cameras/camera/999/log/download")
        self.assertEqual(response.status_code, 404)

    def test_create_camera_with_description(self):
        # Тест создания камеры с описанием
        test_data = CameraCreate(
            name="Camera with Description",
            url="rtsp://test.com/stream",
            description="Test Description",
            is_active=True
        ).dict()
        response = self.client.post("/cameras", json=test_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["description"], test_data["description"])

    def test_update_camera_partial(self):
        # Тест частичного обновления камеры
        test_data = CameraUpdate(
            name="Updated Name Only"
        ).dict(exclude_unset=True)
        response = self.client.put(f"/cameras/{self.test_camera.id}", json=test_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], test_data["name"])
        self.assertEqual(response.json()["url"], self.test_camera.url)
        self.assertEqual(response.json()["is_active"], self.test_camera.is_active)

    def test_update_camera_with_none_values(self):
        # Тест обновления камеры с None значениями
        test_data = CameraUpdate(
            name=None,
            url=None,
            description=None,
            is_active=None
        ).dict(exclude_unset=True)
        response = self.client.put(f"/cameras/{self.test_camera.id}", json=test_data)
        self.assertEqual(response.status_code, 200)
        # Проверяем, что значения не изменились
        self.assertEqual(response.json()["name"], self.test_camera.name)
        self.assertEqual(response.json()["url"], self.test_camera.url)
        self.assertEqual(response.json()["is_active"], self.test_camera.is_active)

    @patch('app.services.camera_service.create_pdf_from_logs')
    def test_download_camera_log_file_not_found(self, mock_create_pdf):
        # Тест скачивания лога, когда файл не существует
        mock_create_pdf.side_effect = Exception("File not found")
        response = self.client.get(f"/cameras/camera/{self.test_camera.id}/log/download")
        self.assertEqual(response.status_code, 404)

    def test_create_camera_with_invalid_url(self):
        # Тест создания камеры с некорректным URL
        test_data = CameraCreate(
            name="Invalid URL Camera",
            url="invalid_url",
            is_active=True
        ).dict()
        response = self.client.post("/cameras", json=test_data)
        self.assertEqual(response.status_code, 422)  # Ожидаем ошибку валидации

    def test_update_camera_with_invalid_url(self):
        # Тест обновления камеры с некорректным URL
        test_data = CameraUpdate(
            url="invalid_url"
        ).dict(exclude_unset=True)
        response = self.client.put(f"/cameras/{self.test_camera.id}", json=test_data)
        self.assertEqual(response.status_code, 422)  # Ожидаем ошибку валидации

    @patch('app.services.camera_service.create_pdf_from_logs')
    def test_download_camera_log_permission_error(self, mock_create_pdf):
        # Тест скачивания лога при ошибке доступа к файлу
        mock_create_pdf.side_effect = PermissionError("Permission denied")
        response = self.client.get(f"/cameras/camera/{self.test_camera.id}/log/download")
        self.assertEqual(response.status_code, 500)

    def test_get_cameras_with_invalid_pagination(self):
        # Тест пагинации с некорректными параметрами
        response = self.client.get("/cameras?skip=-1&limit=0")
        self.assertEqual(response.status_code, 422)  # Ожидаем ошибку валидации

    def test_update_camera_with_empty_data(self):
        # Тест обновления камеры с пустыми данными
        test_data = CameraUpdate().dict(exclude_unset=True)
        response = self.client.put(f"/cameras/{self.test_camera.id}", json=test_data)
        self.assertEqual(response.status_code, 200)
        # Проверяем, что значения не изменились
        self.assertEqual(response.json()["name"], self.test_camera.name)
        self.assertEqual(response.json()["url"], self.test_camera.url)
        self.assertEqual(response.json()["is_active"], self.test_camera.is_active)

if __name__ == '__main__':
    unittest.main() 