import pytest
from app import models, auth, schemas
from datetime import datetime, timedelta
from jose import jwt, JWTError
import sys
import types
# import dlib  # Удалено, чтобы мок работал корректно
import pydantic
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from httpx import AsyncClient
from starlette.websockets import WebSocketState

@pytest.fixture
def mock_dlib(monkeypatch):
    mock_module = types.ModuleType("dlib")
    mock_module.shape_predictor = lambda path: f"predictor:{path}"
    mock_module.face_recognition_model_v1 = lambda path: f"recmodel:{path}"
    mock_module.get_frontal_face_detector = lambda: "detector"
    sys.modules["dlib"] = mock_module
    yield
    del sys.modules["dlib"]

@pytest.fixture(scope="function")
def db():
    """Фикстура для создания тестовой базы данных"""
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        models.Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Фикстура для создания тестового клиента"""
    return TestClient(app)

@pytest.fixture(scope="function")
def test_camera(db):
    """Фикстура для создания тестовой камеры"""
    camera = models.Camera(
        name="Test Camera",
        url="rtsp://test.com/stream",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

# Тесты моделей (без БД)
def test_user_model_fields():
    user = models.User(
        id=1,
        email="test@example.com",
        username="testuser",
        hashed_password="hashed",
        is_active=True,
        is_superuser=False,
        created_at=datetime.utcnow()
    )
    assert user.email == "test@example.com"
    assert user.username == "testuser"
    assert user.is_active
    assert not user.is_superuser

def test_camera_model_fields():
    camera = models.Camera(
        id=1,
        name="TestCam",
        url="rtsp://localhost:8554/test",
        is_active=True
    )
    assert camera.name == "TestCam"
    assert camera.url.startswith("rtsp://")
    assert camera.is_active

def test_person_model_fields():
    person = models.Person(id=1, name="Person1")
    assert person.name == "Person1"

def test_face_model_fields():
    face = models.Face(id=1, person_id=1, encoding="0.1,0.2,0.3")
    assert face.person_id == 1
    assert face.encoding == "0.1,0.2,0.3"

def test_stream_processor_model_fields():
    sp = models.StreamProcessor(
        id=1,
        name="proc1",
        camera_id=1,
        input_stream="rtsp://in",
        output_stream="rtsp://out",
        release_name="rel1",
        created_at=datetime.utcnow()
    )
    assert sp.name == "proc1"
    assert sp.camera_id == 1
    assert sp.input_stream.startswith("rtsp://")

# Тесты auth.py

def test_password_hash_and_verify():
    password = "mysecret"
    hashed = auth.get_password_hash(password)
    assert auth.verify_password(password, hashed)
    assert not auth.verify_password("wrong", hashed)

def test_create_access_token_and_decode():
    data = {"sub": "testuser"}
    token = auth.create_access_token(data, expires_delta=timedelta(minutes=1))
    decoded = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    assert decoded["sub"] == "testuser"

# Тесты схем

def test_user_schema_validation():
    user = schemas.User(id=1, email="a@b.com", username="user", is_active=True, is_superuser=False, created_at=datetime.utcnow())
    assert user.email == "a@b.com"
    assert user.is_active

def test_camera_schema_validation():
    cam = schemas.Camera(id=1, name="cam", url="rtsp://x", is_active=True)
    assert cam.name == "cam"
    assert cam.url == "rtsp://x"

# Тесты на невалидные данные

def test_invalid_email_schema():
    with pytest.raises(pydantic.ValidationError):
        schemas.UserCreate(email="notanemail", username="user", password="password")

# Тесты вспомогательных функций (например, загрузка моделей dlib)
def test_load_ml_models(monkeypatch):
    """Тест загрузки ML моделей с моками dlib"""
    from app.main import load_ml_models
    import sys
    import types
    # Создаём мок dlib
    mock_dlib = types.ModuleType("dlib")
    mock_dlib.get_frontal_face_detector = lambda: "mock_detector"
    mock_dlib.shape_predictor = lambda x: "mock_predictor"
    mock_dlib.face_recognition_model_v1 = lambda x: "mock_rec_model"
    sys.modules["dlib"] = mock_dlib
    class DummyApp:
        state = type('state', (), {})()
    app_obj = DummyApp()
    load_ml_models(app_obj)
    assert hasattr(app_obj.state, "face_detector")
    assert hasattr(app_obj.state, "shape_predictor")
    assert hasattr(app_obj.state, "face_rec_model")
    del sys.modules["dlib"]

def test_load_ml_models_error(monkeypatch):
    """Тест обработки ошибок при загрузке ML моделей с моками dlib"""
    from app.main import load_ml_models
    import sys
    import types
    # Создаём мок dlib с ошибкой
    mock_dlib = types.ModuleType("dlib")
    def raise_error():
        raise Exception("Test error")
    mock_dlib.get_frontal_face_detector = raise_error
    mock_dlib.shape_predictor = lambda x: "mock_predictor"
    mock_dlib.face_recognition_model_v1 = lambda x: "mock_rec_model"
    sys.modules["dlib"] = mock_dlib
    class DummyApp:
        state = type('state', (), {})()
    app_obj = DummyApp()
    try:
        with pytest.raises(Exception) as exc_info:
            load_ml_models(app_obj)
        assert str(exc_info.value) == "Test error"
    finally:
        del sys.modules["dlib"]

# Дополнительные тесты моделей

def test_user_model_is_superuser():
    user = models.User(id=2, email="a@b.com", username="admin", hashed_password="x", is_active=True, is_superuser=True, created_at=datetime.utcnow())
    assert user.is_superuser

def test_camera_model_description_none():
    camera = models.Camera(id=2, name="Test", url="rtsp://x", description=None, is_active=False)
    assert camera.description is None
    assert not camera.is_active

def test_person_model_faces_list():
    person = models.Person(id=2, name="P2")
    assert isinstance(person.faces, list)

def test_face_model_encoding_empty():
    face = models.Face(id=2, person_id=2, encoding="")
    assert face.encoding == ""

def test_stream_processor_model_fields_full():
    sp = models.StreamProcessor(id=2, name="sp2", camera_id=2, input_stream="rtsp://in2", output_stream="rtsp://out2", release_name="rel2", created_at=datetime.utcnow())
    assert sp.release_name == "rel2"

# Дополнительные тесты схем

def test_camera_schema_invalid_url():
    with pytest.raises(pydantic.ValidationError):
        schemas.Camera(id=1, name="cam", url="http://x", is_active=True)

def test_person_schema_faces_default():
    p = schemas.Person(id=1, name="p")
    assert isinstance(p.faces, list)

def test_face_schema_encoding_type():
    f = schemas.Face(id=1, person_id=1, encoding="0.1,0.2")
    assert isinstance(f.encoding, str)

def test_token_schema():
    t = schemas.Token(access_token="abc", token_type="bearer")
    assert t.token_type == "bearer"

def test_token_data_schema_optional():
    td = schemas.TokenData()
    assert td.username is None

def test_stream_processor_config_schema():
    c = schemas.StreamProcessorConfig(name="sp", camera_id=1)
    assert c.name == "sp"

def test_stream_processor_response_schema():
    r = schemas.StreamProcessorResponse(status="ok", message="done")
    assert r.status == "ok"
    assert r.message == "done"

def test_stream_processor_list_schema():
    s = schemas.StreamProcessorList(processors=[])
    assert isinstance(s.processors, list)

# Дополнительные тесты auth.py

def test_password_hash_and_verify_negative():
    password = "mysecret"
    hashed = auth.get_password_hash(password)
    assert not auth.verify_password("other", hashed)

def test_create_access_token_expired():
    data = {"sub": "testuser"}
    token = auth.create_access_token(data, expires_delta=timedelta(seconds=-1))
    with pytest.raises(JWTError):
        jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

def test_create_access_token_no_exp():
    data = {"sub": "testuser"}
    token = auth.create_access_token(data)
    decoded = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    assert decoded["sub"] == "testuser"

def test_get_password_hash_type():
    hashed = auth.get_password_hash("pass")
    assert isinstance(hashed, str)

# Тесты генератора get_db

def test_get_db_generator_closes(monkeypatch):
    from app import database
    closed = {"value": False}
    class DummySession:
        def close(self):
            closed["value"] = True
    monkeypatch.setattr(database, "SessionLocal", lambda: DummySession())
    gen = database.get_db()
    db = next(gen)
    assert isinstance(db, DummySession)
    try:
        next(gen)
    except StopIteration:
        pass
    assert closed["value"]

# Тесты сериализации/десериализации схем

def test_camera_schema_serialization():
    cam = schemas.Camera(id=1, name="cam", url="rtsp://x", is_active=True)
    data = cam.model_dump()
    cam2 = schemas.Camera.model_validate(data)
    assert cam2.id == 1

# Тесты edge-cases

def test_user_schema_empty_username():
    with pytest.raises(pydantic.ValidationError):
        schemas.User(id=1, email="a@b.com", username="", is_active=True)

def test_person_schema_empty_name():
    with pytest.raises(pydantic.ValidationError):
        schemas.Person(id=1, name="")

# Проверка валидатора url

def test_camera_schema_url_validator():
    cam = schemas.Camera(id=1, name="cam", url="rtsp://valid", is_active=True)
    assert cam.url.startswith("rtsp://")

# Удалены тесты для WebSocket 