import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models, auth
from app.database import SessionLocal, Base
import uuid

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

def test_register_user_success(db):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "testpass123"
    }
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["username"] == user_data["username"]
    assert "id" in data
    assert "is_active" in data

def test_register_user_duplicate_email(db):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "testpass123"
    }
    client.post("/api/auth/register", json=user_data)
    # Пытаемся создать второго с тем же email
    user_data["username"] = f"testuser_{str(uuid.uuid4())[:8]}"
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400
    assert "Email already registered" in response.text

def test_register_user_duplicate_username(db):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "testpass123"
    }
    client.post("/api/auth/register", json=user_data)
    # Пытаемся создать второго с тем же username
    user_data["email"] = f"test_{str(uuid.uuid4())[:8]}@example.com"
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400
    assert "Username already taken" in response.text

def test_register_user_invalid_data(db):
    user_data = {
        "email": "not-an-email",
        "username": "",
        "password": ""
    }
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 422

def test_login_success(db):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "testpass123"
    }
    client.post("/api/auth/register", json=user_data)
    response = client.post(
        "/api/auth/token",
        data={"username": user_data["username"], "password": user_data["password"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(db):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "testpass123"
    }
    client.post("/api/auth/register", json=user_data)
    response = client.post(
        "/api/auth/token",
        data={"username": user_data["username"], "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.text

def test_get_me_success(db):
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "testpass123"
    }
    client.post("/api/auth/register", json=user_data)
    response = client.post(
        "/api/auth/token",
        data={"username": user_data["username"], "password": user_data["password"]}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["username"] == user_data["username"]
    assert "id" in data
    assert "is_active" in data

def test_get_me_unauthorized(db):
    response = client.get("/api/auth/me")
    assert response.status_code == 401 