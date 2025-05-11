import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models, auth
from app.database import SessionLocal, Base
import uuid
import numpy as np

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

def test_get_faces_empty(db, test_user, auth_headers):
    response = client.get("/api/faces/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_get_face_not_found(db, test_user, auth_headers):
    response = client.get("/api/faces/999", headers=auth_headers)
    assert response.status_code == 404
    assert "Not Found" in response.text

def test_delete_face_not_found(db, test_user, auth_headers):
    response = client.delete("/api/faces/999", headers=auth_headers)
    assert response.status_code == 404 