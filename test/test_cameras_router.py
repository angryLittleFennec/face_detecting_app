import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models, auth
from app.database import SessionLocal, Base
import uuid
from unittest.mock import patch, MagicMock

client = TestClient(app)

@pytest.fixture(scope="function")
def db():
    """Фикстура для создания тестовой базы данных"""
    db = SessionLocal()
    try:
        # Очищаем все таблицы перед каждым тестом
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        yield db
    finally:
        # Очищаем все таблицы после каждого теста
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        db.close()

@pytest.fixture(scope="function")
def test_user(db):
    """Создаем тестового пользователя"""
    unique_id = str(uuid.uuid4())[:8]
    user = models.User(
        email=f"test_{unique_id}@example.com",
        username=f"testuser_{unique_id}",
        hashed_password=auth.get_password_hash("testpass"),
        is_active=True,
        is_superuser=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Получаем токен авторизации"""
    response = client.post(
        "/api/auth/token",
        data={"username": test_user.username, "password": "testpass"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_camera_success(db, test_user, auth_headers):
    """Тест успешного создания камеры"""
    camera_data = {
        "name": "Test Camera",
        "url": "rtsp://test.com/stream",
        "description": "Test camera description",
        "is_active": True
    }
    response = client.post("/api/cameras/", json=camera_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == camera_data["name"]
    assert data["url"] == camera_data["url"]
    assert data["description"] == camera_data["description"]
    assert data["is_active"] == camera_data["is_active"]
    
def test_create_camera_invalid_url(db, test_user, auth_headers):
    """Тест создания камеры с неверным URL"""
    camera_data = {
        "name": "Test Camera",
        "url": "http://test.com/stream",  # Не RTSP URL
        "description": "Test camera description",
        "is_active": True
    }
    response = client.post("/api/cameras/", json=camera_data, headers=auth_headers)
    assert response.status_code == 422
    assert "URL должен начинаться с rtsp://" in response.text

def test_get_cameras_empty(db, test_user, auth_headers):
    """Тест получения пустого списка камер"""
    # Очищаем таблицу камер
    db.query(models.Camera).delete()
    db.commit()
    
    response = client.get("/api/cameras/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_get_cameras_list(db, test_user, auth_headers):
    """Тест получения списка камер"""
    # Очищаем таблицу камер
    db.query(models.Camera).delete()
    db.commit()
    
    # Создаем несколько камер
    cameras = []
    for i in range(3):
        camera = models.Camera(
            name=f"Test Camera {i}",
            url=f"rtsp://test.com/stream{i}",
            description=f"Test camera {i} description",
            is_active=True
        )
        cameras.append(camera)
        db.add(camera)
    db.commit()
    
    response = client.get("/api/cameras/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    for i, camera in enumerate(data):
        assert camera["name"] == f"Test Camera {i}"
        assert camera["url"] == f"rtsp://test.com/stream{i}"

def test_get_camera_by_id(db, test_user, auth_headers):
    """Тест получения камеры по ID"""
    # Создаем камеру
    camera = models.Camera(
        name="Test Camera",
        url="rtsp://test.com/stream",
        description="Test camera description",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    
    response = client.get(f"/api/cameras/{camera.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == camera.name
    assert data["url"] == camera.url
    assert data["description"] == camera.description

def test_get_camera_not_found(db, test_user, auth_headers):
    """Тест получения несуществующей камеры"""
    response = client.get("/api/cameras/999", headers=auth_headers)
    assert response.status_code == 404
    assert "Камера не найдена" in response.text

def test_update_camera_success(db, test_user, auth_headers):
    """Тест успешного обновления камеры"""
    # Создаем камеру
    camera = models.Camera(
        name="Test Camera",
        url="rtsp://test.com/stream",
        description="Test camera description",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    
    # Обновляем камеру
    update_data = {
        "name": "Updated Camera",
        "url": "rtsp://test.com/updated",
        "description": "Updated description",
        "is_active": False
    }
    response = client.put(f"/api/cameras/{camera.id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["url"] == update_data["url"]
    assert data["description"] == update_data["description"]
    assert data["is_active"] == update_data["is_active"]
    
    # Проверяем, что изменения сохранились в базе
    db.refresh(camera)
    assert camera.name == update_data["name"]
    assert camera.url == update_data["url"]
    assert camera.description == update_data["description"]
    assert camera.is_active == update_data["is_active"]

def test_update_camera_not_found(db, test_user, auth_headers):
    """Тест обновления несуществующей камеры"""
    update_data = {
        "name": "Updated Camera",
        "url": "rtsp://test.com/updated",
        "description": "Updated description",
        "is_active": False
    }
    response = client.put("/api/cameras/999", json=update_data, headers=auth_headers)
    assert response.status_code == 404
    assert "Камера не найдена" in response.text

def test_update_camera_invalid_url(db, test_user, auth_headers):
    """Тест обновления камеры с неверным URL"""
    # Создаем камеру
    camera = models.Camera(
        name="Test Camera",
        url="rtsp://test.com/stream",
        description="Test camera description",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    
    # Пытаемся обновить с неверным URL
    update_data = {
        "name": "Updated Camera",
        "url": "http://test.com/updated",  # Не RTSP URL
        "description": "Updated description",
        "is_active": False
    }
    response = client.put(f"/api/cameras/{camera.id}", json=update_data, headers=auth_headers)
    assert response.status_code == 422
    assert "URL должен начинаться с rtsp://" in response.text

def test_delete_camera_success(db, test_user, auth_headers):
    """Тест успешного удаления камеры"""
    # Создаем камеру
    camera = models.Camera(
        name="Test Camera",
        url="rtsp://test.com/stream",
        description="Test camera description",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    
    response = client.delete(f"/api/cameras/{camera.id}", headers=auth_headers)
    assert response.status_code == 200
    assert "Камера успешно удалена" in response.text
    
    # Проверяем, что камера действительно удалена
    response = client.get(f"/api/cameras/{camera.id}", headers=auth_headers)
    assert response.status_code == 404

def test_delete_camera_not_found(db, test_user, auth_headers):
    """Тест удаления несуществующей камеры"""
    response = client.delete("/api/cameras/999", headers=auth_headers)
    assert response.status_code == 404
    assert "Камера не найдена" in response.text 