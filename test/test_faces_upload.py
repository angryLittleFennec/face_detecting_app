import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models, auth
from app.database import SessionLocal, Base
import uuid
from unittest.mock import patch

client = TestClient(app)

@pytest.fixture(scope="function")
def db():
    db = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        yield db
    finally:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        db.close()

@pytest.fixture(scope="function")
def test_user(db):
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
    response = client.post(
        "/api/auth/token",
        data={"username": test_user.username, "password": "testpass"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def test_person(db):
    unique_id = str(uuid.uuid4())[:8]
    person = models.Person(name=f"Test Person {unique_id}")
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

def test_upload_faces_success(db, test_user, auth_headers, test_person):
    # Мокаем get_face_embedding, чтобы всегда возвращал вектор
    with patch("app.routers.faces.get_face_embedding", return_value=[0.1]*128):
        files = {"files": ("face.jpg", b"fakeimagebytes", "image/jpeg")}
        response = client.post(f"/api/faces/upload/{test_person.id}", files=files, headers=auth_headers)
        assert response.status_code == 201
        assert "Processed" in response.json()["message"]

def test_upload_faces_person_not_found(db, test_user, auth_headers):
    with patch("app.routers.faces.get_face_embedding", return_value=[0.1]*128):
        files = {"files": ("face.jpg", b"fakeimagebytes", "image/jpeg")}
        response = client.post(f"/api/faces/upload/99999", files=files, headers=auth_headers)
        assert response.status_code == 404
        assert "Person not found" in response.text

def test_upload_faces_no_face(db, test_user, auth_headers, test_person):
    # Мокаем get_face_embedding, чтобы возвращал None (лицо не найдено)
    with patch("app.routers.faces.get_face_embedding", side_effect=Exception("No face detected")):
        files = {"files": ("face.jpg", b"fakeimagebytes", "image/jpeg")}
        response = client.post(f"/api/faces/upload/{test_person.id}", files=files, headers=auth_headers)
        assert response.status_code == 201 or response.status_code == 200  # processed 0 из 1
        assert "Processed" in response.json()["message"]

def test_upload_faces_db_error(db, test_user, auth_headers, test_person):
    # Мокаем commit, чтобы вызвать ошибку
    with patch("app.routers.faces.get_face_embedding", return_value=[0.1]*128):
        with patch("sqlalchemy.orm.session.Session.commit", side_effect=Exception("DB error")):
            files = {"files": ("face.jpg", b"fakeimagebytes", "image/jpeg")}
            response = client.post(f"/api/faces/upload/{test_person.id}", files=files, headers=auth_headers)
            assert response.status_code == 400 or response.status_code == 500
            assert "Database error" in response.text or "detail" in response.json() 