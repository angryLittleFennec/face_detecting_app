import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from datetime import datetime
import numpy as np
from PIL import Image
from io import BytesIO
from unittest.mock import MagicMock, patch
import logging
import subprocess

from app.main import app
from app.database import get_db, SessionLocal
from app.models import User, Camera, Person, Face, Base
from app.auth import create_access_token

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Создаем тестовую базу данных
TEST_DATABASE_URL = "sqlite:///:memory:"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def do_connect(dbapi_connection, connection_record):
        # Включаем проверку внешних ключей для SQLite
        dbapi_connection.execute('pragma foreign_keys=ON')

    # Создаем все таблицы один раз для всей сессии тестов
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture(scope="function")
def test_session(test_engine):
    logger.info("Creating test session")
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(bind=connection)
    session = TestingSessionLocal()

    # Переопределяем функцию get_db для использования тестовой сессии
    def override_get_db():
        logger.info("Using test session in get_db")
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    yield session

    logger.info("Cleaning up test session")
    app.dependency_overrides.clear()
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(test_session):
    logger.info("Creating test client")
    # Создаем моки для функций dlib
    app.state.face_detector = MagicMock()
    app.state.face_detector.return_value = [MagicMock()]  # Возвращаем список с одним "лицом"
    
    app.state.shape_predictor = MagicMock()
    app.state.shape_predictor.return_value = MagicMock()
    
    app.state.face_rec_model = MagicMock()
    app.state.face_rec_model.compute_face_descriptor.return_value = [0.1] * 128  # Возвращаем фиктивный вектор признаков
    
    return TestClient(app)

@pytest.fixture(scope="function")
def client_no_face(test_session):
    logger.info("Creating test client with no face detection")
    # Создаем моки для функций dlib
    app.state.face_detector = MagicMock()
    app.state.face_detector.return_value = []  # Возвращаем пустой список (лицо не найдено)
    
    app.state.shape_predictor = MagicMock()
    app.state.shape_predictor.return_value = MagicMock()
    
    app.state.face_rec_model = MagicMock()
    app.state.face_rec_model.compute_face_descriptor.return_value = [0.1] * 128
    
    return TestClient(app)

# Тестовые данные
test_user_data = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123"
}

test_camera_data = {
    "name": "Test Camera",
    "url": "rtsp://example.com/stream",
    "is_active": True
}

test_person_data = {
    "name": "Test Person"
}

@pytest.fixture
def test_user(test_session):
    logger.info("Creating test user")
    # Создаем тестового пользователя
    hashed_password = pwd_context.hash(test_user_data["password"])
    user = User(
        email=test_user_data["email"],
        username=test_user_data["username"],
        hashed_password=hashed_password
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)
    logger.info(f"Created test user with id {user.id}")
    return user

@pytest.fixture
def test_token(test_user):
    logger.info("Creating test token")
    return create_access_token(data={"sub": test_user.username})

@pytest.fixture
def test_person(test_session):
    logger.info("Creating test person")
    person = Person(
        name=test_person_data["name"]
    )
    test_session.add(person)
    test_session.commit()
    test_session.refresh(person)
    logger.info(f"Created test person with id {person.id}")
    return person

@pytest.fixture
def test_camera(test_session):
    logger.info("Creating test camera")
    camera = Camera(
        name=test_camera_data["name"],
        url=test_camera_data["url"],
        is_active=test_camera_data["is_active"]
    )
    test_session.add(camera)
    test_session.commit()
    test_session.refresh(camera)
    logger.info(f"Created test camera with id {camera.id}")
    return camera

# Тесты аутентификации
def test_register_user(client):
    response = client.post("/api/auth/register", json=test_user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert data["username"] == test_user_data["username"]
    assert "id" in data

def test_login_user(client, test_user):
    response = client.post(
        "/api/auth/token",
        data={"username": test_user_data["username"], "password": test_user_data["password"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_get_current_user(client, test_token, test_user):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email

# Тесты камер
def test_create_camera(client, test_token):
    response = client.post(
        "/api/cameras/",
        json=test_camera_data,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == test_camera_data["name"]
    assert data["url"] == test_camera_data["url"]
    assert "id" in data

def test_get_cameras(client, test_token):
    response = client.get(
        "/api/cameras/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == test_camera_data["name"]

def test_get_camera(client, test_token, test_camera):
    response = client.get(
        f"/api/cameras/{test_camera.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_camera_data["name"]

def test_update_camera(client, test_token, test_camera):
    update_data = {
        "name": "Updated Camera",
        "url": "rtsp://example.com/new-stream",
        "is_active": False
    }
    response = client.put(
        f"/api/cameras/{test_camera.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["url"] == update_data["url"]
    assert data["is_active"] == update_data["is_active"]

def test_delete_camera(client, test_token, test_camera):
    response = client.delete(
        f"/api/cameras/{test_camera.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    assert response.json()["detail"] == "Камера удалена"

# Тесты персон
def test_create_person(client, test_token):
    response = client.post(
        "/api/persons/",
        json=test_person_data,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == test_person_data["name"]
    assert "id" in data

def test_get_persons(client, test_token, test_person):
    response = client.get(
        "/api/persons/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["name"] == test_person.name

def test_get_person(client, test_token, test_person):
    response = client.get(
        f"/api/persons/{test_person.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_person.id
    assert data["name"] == test_person.name

def test_update_person(client, test_token, test_person):
    update_data = {
        "name": "Updated Person"
    }
    response = client.put(
        f"/api/persons/{test_person.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]

def test_delete_person(client, test_token, test_person):
    response = client.delete(
        f"/api/persons/{test_person.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200

# Тесты лиц
def test_add_face(client, test_token, test_person):
    # Создаем тестовый файл с изображением
    image = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    files = {'files': ('test_image.png', img_byte_arr, 'image/png')}
    response = client.post(
        f"/api/faces/upload/{test_person.id}",
        files=files,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "message" in data

def test_get_faces(client, test_token, test_person):
    response = client.get(
        f"/api/faces/{test_person.id}/faces",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_delete_face(client, test_token, test_person):
    # Сначала добавляем лицо
    image = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    files = {'files': ('test_image.png', img_byte_arr, 'image/png')}
    response = client.post(
        f"/api/faces/upload/{test_person.id}",
        files=files,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 201
    
    # Получаем список лиц
    response = client.get(
        f"/api/faces/{test_person.id}/faces",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    faces = response.json()
    assert len(faces) > 0

    # Удаляем первое лицо
    face_id = faces[0]["id"]
    response = client.delete(
        f"/api/faces/{face_id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200

# Тесты распознавания лиц
def test_find_face_success(client, test_token, test_person):
    # Сначала добавляем лицо
    image = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    files = {'files': ('test_image.png', img_byte_arr, 'image/png')}
    response = client.post(
        f"/api/faces/upload/{test_person.id}",
        files=files,
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 201
    
    # Теперь ищем лицо
    response = client.post(
        "/api/faces/find",
        json={"embedding": [0.1] * 128},
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data

def test_find_face_not_found(client, test_token):
    response = client.post(
        "/api/faces/find",
        json={"embedding": [0.9] * 128},
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" not in data

# Тесты Kubernetes
@pytest.fixture
def mock_subprocess_run(monkeypatch):
    def mock_run(*args, **kwargs):
        class MockCompletedProcess:
            def __init__(self):
                self.returncode = 0
                self.stdout = "Success"
                self.stderr = ""
        return MockCompletedProcess()
    monkeypatch.setattr(subprocess, 'run', mock_run)

@pytest.fixture
def mock_subprocess_run_error(monkeypatch):
    def mock_run(*args, **kwargs):
        class MockCompletedProcess:
            def __init__(self):
                self.returncode = 1
                self.stdout = ""
                self.stderr = "Error"
        return MockCompletedProcess()
    monkeypatch.setattr(subprocess, 'run', mock_run)

def test_deploy_stream_processor_success(client, test_token, test_camera, mock_subprocess_run):
    response = client.post(
        "/api/kubernetes/stream-processor",
        json={
            "name": "test-processor",
            "camera_id": test_camera.id
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "release_name" in data
    assert "camera_id" in data
    assert "input_stream" in data
    assert "output_stream" in data

def test_delete_stream_processor_success(client, test_token, test_camera, mock_subprocess_run):
    # Сначала создаем процессор
    response = client.post(
        "/api/kubernetes/stream-processor",
        json={
            "name": "test-processor",
            "camera_id": test_camera.id
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200

    # Затем удаляем его
    response = client.delete(
        "/api/kubernetes/stream-processor/test-processor",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "message" in data

def test_get_stream_processor_status_success(client, test_token, test_camera, mock_subprocess_run):
    # Сначала создаем процессор
    response = client.post(
        "/api/kubernetes/stream-processor",
        json={
            "name": "test-processor",
            "camera_id": test_camera.id
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200

    # Затем проверяем его статус
    response = client.get(
        "/api/kubernetes/stream-processor/test-processor/status",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "details" in data

def test_deploy_stream_processor_helm_error(client, test_token, test_camera, mock_subprocess_run_error):
    response = client.post(
        "/api/kubernetes/stream-processor",
        json={
            "name": "test-processor",
            "camera_id": test_camera.id
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data

def test_deploy_stream_processor_invalid_camera(client, test_token):
    response = client.post(
        "/api/kubernetes/stream-processor",
        json={
            "name": "test-processor",
            "camera_id": 999
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 404

def test_create_duplicate_stream_processor(client, test_user, test_camera, test_user_token_headers):
    """Тест создания дубликата стрим-процессора"""
    # Создаем первый процессор
    response = client.post(
        "/api/kubernetes/stream-processor",
        headers=test_user_token_headers,
        json={"name": "test-processor", "camera_id": test_camera.id}
    )
    assert response.status_code == 200

    # Пытаемся создать второй процессор с тем же именем
    response = client.post(
        "/api/kubernetes/stream-processor",
        headers=test_user_token_headers,
        json={"name": "test-processor", "camera_id": test_camera.id}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

# Тесты ошибок
def test_unauthorized_access(client):
    response = client.get("/api/cameras/")
    assert response.status_code == 401

def test_invalid_token(client):
    response = client.get(
        "/api/cameras/",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401

def test_reset_database_success(client, test_token, test_user):
    # Делаем пользователя суперпользователем
    test_user.is_superuser = True
    db = next(get_db())
    db.commit()

    response = client.post(
        "/api/db/reset",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "message" in data

def test_reset_database_unauthorized(client):
    response = client.post("/api/db/reset")
    assert response.status_code == 401

def test_reset_database_forbidden(client, test_token):
    response = client.post(
        "/api/db/reset",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data

def test_deploy_stream_processor_with_cpu_limit(client, test_token, test_camera, mock_subprocess_run):
    response = client.post(
        "/api/kubernetes/stream-processor",
        json={
            "name": "test-processor",
            "camera_id": test_camera.id,
            "cpu_limit": "2"
        },
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "release_name" in data
    assert "camera_id" in data
    assert "input_stream" in data
    assert "output_stream" in data 