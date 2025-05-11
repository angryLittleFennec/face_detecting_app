import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, Camera, Person, Face, StreamProcessor
from app.auth import create_access_token
from datetime import datetime, timedelta

# Создаем тестовую базу данных
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def setup_database(db):
    # Очищаем все таблицы перед каждым тестом
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    yield
    # Очищаем все таблицы после каждого теста
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

@pytest.fixture(scope="module")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "testpassword"
        is_superuser=True  # Добавляем права суперпользователя
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_token(test_user):
    access_token = create_access_token(
        data={"sub": test_user.username},
        expires_delta=timedelta(minutes=15)
    )
    return access_token

@pytest.fixture
def test_camera(db, test_user):
    camera = Camera(
        name="Test Camera",
        rtsp_url="rtsp://localhost:8554/test",
        is_active=True,
        user_id=test_user.id
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@pytest.fixture
def test_person(db, test_user):
    person = Person(
        name="Test Person",
        user_id=test_user.id
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

@pytest.fixture
def test_face(db, test_person):
    face = Face(
        person_id=test_person.id,
        encoding="0.1,0.2,0.3,0.4,0.5"
    )
    db.add(face)
    db.commit()
    db.refresh(face)
    return face

@pytest.fixture
def test_stream_processor(db, test_camera):
    processor = StreamProcessor(
        name="test-processor",
        camera_id=test_camera.id,
        input_stream=test_camera.url,
        output_stream="rtsp://localhost:8554/processed/test",
        release_name="stream-processor-test-processor"
    )
    db.add(processor)
    db.commit()
    db.refresh(processor)
    return processor 