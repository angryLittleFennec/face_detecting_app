import unittest
from fastapi.testclient import TestClient
from app.main import app, add_test_camera
from app.models import Base, Person, Face, Camera
from app.schemas import PersonCreate, FaceCreate
from app.database import engine, SessionLocal
from sqlalchemy.orm import sessionmaker

class TestMainApp(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовые данные
        self.db = self.SessionLocal()
        self.test_person = Person(name="Test Person")
        self.db.add(self.test_person)
        self.db.commit()
        
        # Создаем тестовый клиент
        self.client = TestClient(app)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_get_persons(self):
        # Тест получения списка лиц
        response = self.client.get("/persons")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_create_person(self):
        # Тест создания нового лица
        test_data = PersonCreate(name="New Person").dict()
        response = self.client.post("/persons", json=test_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], test_data["name"])

    def test_get_person(self):
        # Тест получения конкретного лица
        response = self.client.get(f"/persons/{self.test_person.id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], self.test_person.name)

    def test_get_nonexistent_person(self):
        # Тест получения несуществующего лица
        response = self.client.get("/persons/999")
        self.assertEqual(response.status_code, 404)

    def test_create_face(self):
        # Тест создания нового лица
        test_embedding = [0.1] * 128  # Тестовый эмбеддинг
        test_data = FaceCreate(
            person_id=self.test_person.id,
            encoding=test_embedding
        ).dict()
        response = self.client.post("/faces", json=test_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["person_id"], self.test_person.id)

    def test_add_test_camera(self):
        # Тест добавления тестовой камеры
        add_test_camera()
        
        # Проверяем, что камера была добавлена
        db = SessionLocal()
        test_camera = db.query(Camera).filter(Camera.name == "Тестовая камера").first()
        db.close()
        
        self.assertIsNotNone(test_camera)
        self.assertEqual(test_camera.name, "Тестовая камера")
        self.assertTrue(test_camera.is_active)

    def test_websocket_connection(self):
        # Тест WebSocket соединения
        with self.client.websocket_connect("/ws") as websocket:
            # Отправляем тестовое сообщение
            websocket.send_text("test message")
            
            # Проверяем, что соединение установлено
            self.assertTrue(websocket.client_state.connected)

if __name__ == '__main__':
    unittest.main() 