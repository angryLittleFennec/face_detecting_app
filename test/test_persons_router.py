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

def test_get_persons_empty(db, test_user, auth_headers):
    response = client.get("/api/persons/", headers=auth_headers)
    assert response.status_code == 200

def test_get_person_not_found(db, test_user, auth_headers):
    response = client.get("/api/persons/999", headers=auth_headers)
    assert response.status_code == 404
    assert "Person not found" in response.text

def test_create_person_success(db, test_user, auth_headers):
    unique_id = str(uuid.uuid4())[:8]
    person_data = {
        "name": f"Test Person {unique_id}"
    }
    response = client.post("/api/persons/", json=person_data, headers=auth_headers)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["name"] == person_data["name"]
    assert "id" in data

def test_create_person_invalid_data(db, test_user, auth_headers):
    person_data = {
        "name": ""  # Пустое имя недопустимо
    }
    response = client.post("/api/persons/", json=person_data, headers=auth_headers)
    assert response.status_code == 422

def test_get_person_by_id(db, test_user, auth_headers):
    unique_id = str(uuid.uuid4())[:8]
    person = models.Person(name=f"Test Person {unique_id}")
    db.add(person)
    db.commit()
    db.refresh(person)

    response = client.get(f"/api/persons/{person.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == person.id
    assert data["name"] == person.name

def test_update_person_success(db, test_user, auth_headers):
    unique_id = str(uuid.uuid4())[:8]
    person = models.Person(name=f"Test Person {unique_id}")
    db.add(person)
    db.commit()
    db.refresh(person)

    update_data = {
        "name": f"Updated Person {unique_id}"
    }
    response = client.put(f"/api/persons/{person.id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]

def test_update_person_not_found(db, test_user, auth_headers):
    update_data = {
        "name": "Updated Person"
    }
    response = client.put("/api/persons/999", json=update_data, headers=auth_headers)
    assert response.status_code == 404

def test_delete_person_success(db, test_user, auth_headers):
    unique_id = str(uuid.uuid4())[:8]
    person = models.Person(name=f"Test Person {unique_id}")
    db.add(person)
    db.commit()
    db.refresh(person)

    response = client.delete(f"/api/persons/{person.id}", headers=auth_headers)
    assert response.status_code == 200

    # Проверяем, что человек удален
    response = client.get(f"/api/persons/{person.id}", headers=auth_headers)
    assert response.status_code == 404

def test_delete_person_not_found(db, test_user, auth_headers):
    response = client.delete("/api/persons/999", headers=auth_headers)
    assert response.status_code == 404 