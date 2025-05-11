import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.schemas import StreamProcessorConfig, StreamProcessorResponse
from app import models, auth
from app.database import SessionLocal, Base
import json
import uuid

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
def test_camera(db, test_user):
    """Создаем тестовую камеру"""
    camera = models.Camera(
        name="test_camera",
        url="rtsp://test.com/stream",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Получаем токен авторизации"""
    response = client.post(
        "/api/auth/token",
        data={"username": test_user.username, "password": "testpass"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@patch("app.routers.kuber.run_helm_command")
@patch("app.routers.kuber.HELM_CHART_PATH", new_callable=MagicMock)
def test_deploy_stream_processor(mock_chart_path, mock_run_helm_command, db, test_user, test_camera, auth_headers):
    mock_chart_path.exists.return_value = True
    mock_run_helm_command.return_value = (0, "ok", "")

    unique_id = str(uuid.uuid4())[:8]
    data = {
        "name": f"testproc_{unique_id}",
        "camera_id": test_camera.id
    }

    response = client.post(
        "/api/kubernetes/stream-processor",
        json=data,
        headers=auth_headers
    )
    assert response.status_code in (200, 201)

@patch("app.routers.kuber.run_helm_command")
def test_delete_stream_processor(mock_run_helm_command, db, test_user, auth_headers):
    mock_run_helm_command.return_value = (0, "ok", "")

    # Создаем тестовый процессор
    unique_id = str(uuid.uuid4())[:8]
    processor = models.StreamProcessor(
        name=f"testproc_{unique_id}",
        camera_id=1,
        input_stream="rtsp://test",
        output_stream="rtsp://out",
        release_name=f"test-release-{unique_id}"
    )
    db.add(processor)
    db.commit()

    response = client.delete(
        f"/api/kubernetes/stream-processor/{processor.name}",
        headers=auth_headers
    )
    assert response.status_code == 200

@patch("app.routers.kuber.run_helm_command")
def test_get_stream_processor_status(mock_run_helm_command, db, test_user, auth_headers):
    mock_run_helm_command.return_value = (0, "ok", "")
    # Создаем тестовую камеру
    camera = models.Camera(
        name="test_camera_status",
        url="rtsp://test.com/stream",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    # Создаем тестовый процессор
    unique_id = str(uuid.uuid4())[:8]
    processor = models.StreamProcessor(
        name=f"testproc_{unique_id}",
        camera_id=camera.id,
        input_stream="rtsp://test",
        output_stream="rtsp://out",
        release_name=f"test-release-{unique_id}"
    )
    db.add(processor)
    db.commit()
    response = client.get(
        f"/api/kubernetes/stream-processor/{processor.name}/status",
        headers=auth_headers
    )
    assert response.status_code == 200

@patch("subprocess.run")
@patch("app.routers.kuber.run_helm_command")
@patch("app.routers.kuber.HELM_CHART_PATH", new_callable=MagicMock)
def test_install_chart(mock_chart_path, mock_run_helm_command, mock_subprocess_run, db, test_user, auth_headers):
    mock_chart_path.exists.return_value = True
    mock_run_helm_command.return_value = (0, "ok", "")
    mock_subprocess_run.return_value = MagicMock(stdout="Helm installed", returncode=0)
    response = client.post(
        "/api/kubernetes/deploy?release_name=test&chart=chart",
        headers=auth_headers
    )
    assert response.status_code in (200, 201, 422)

@patch("app.routers.kuber.run_helm_command")
def test_get_stream_processors(mock_run_helm_command, db, test_user, auth_headers):
    mock_run_helm_command.return_value = (0, "ok", "")
    # Очищаем таблицу процессоров
    db.query(models.StreamProcessor).delete()
    db.commit()
    # Создаем тестовую камеру
    camera = models.Camera(
        name="test_camera_list",
        url="rtsp://test.com/stream",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    # Создаем тестовые процессоры
    processors = []
    for i in range(3):
        unique_id = str(uuid.uuid4())[:8]
        processor = models.StreamProcessor(
            name=f"testproc_{unique_id}",
            camera_id=camera.id,
            input_stream="rtsp://test",
            output_stream="rtsp://out",
            release_name=f"test-release-{unique_id}"
        )
        processors.append(processor)
        db.add(processor)
    db.commit()
    response = client.get(
        "/api/kubernetes/stream-processors",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["processors"]) == 3 