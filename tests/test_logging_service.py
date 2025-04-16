import unittest
from unittest.mock import patch, MagicMock
from app.logging_service import LoggingService
from app.models import Base, Camera, Log
from app.database import engine, SessionLocal
import os
import json
from datetime import datetime

class TestLoggingService(unittest.TestCase):
    def setUp(self):
        # Создаем тестовую базу данных в памяти
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = SessionLocal
        
        # Создаем тестовую камеру
        db = self.SessionLocal()
        self.test_camera = Camera(
            name="Test Camera",
            url="rtsp://test.com/stream",
            is_active=True
        )
        db.add(self.test_camera)
        db.commit()
        db.close()
        
        # Инициализируем сервис логирования
        self.logging_service = LoggingService()

    def tearDown(self):
        # Очищаем базу данных
        Base.metadata.drop_all(bind=engine)
        
        # Удаляем тестовые файлы логов
        if os.path.exists("test_logs"):
            for file in os.listdir("test_logs"):
                os.remove(os.path.join("test_logs", file))
            os.rmdir("test_logs")

    def test_create_log(self):
        # Тест создания лога
        log_data = {
            "camera_id": self.test_camera.id,
            "event": "test_event",
            "timestamp": datetime.now().isoformat(),
            "details": {"test": "data"}
        }
        
        log = self.logging_service.create_log(**log_data)
        
        self.assertIsNotNone(log.id)
        self.assertEqual(log.camera_id, self.test_camera.id)
        self.assertEqual(log.event, "test_event")
        self.assertEqual(json.loads(log.details), {"test": "data"})

    def test_get_camera_logs(self):
        # Тест получения логов камеры
        # Создаем тестовые логи
        db = self.SessionLocal()
        test_logs = [
            Log(
                camera_id=self.test_camera.id,
                event="event1",
                timestamp=datetime.now(),
                details=json.dumps({"test": "data1"})
            ),
            Log(
                camera_id=self.test_camera.id,
                event="event2",
                timestamp=datetime.now(),
                details=json.dumps({"test": "data2"})
            )
        ]
        for log in test_logs:
            db.add(log)
        db.commit()
        db.close()
        
        # Получаем логи
        logs = self.logging_service.get_camera_logs(self.test_camera.id)
        
        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0].event, "event1")
        self.assertEqual(logs[1].event, "event2")

    def test_get_nonexistent_camera_logs(self):
        # Тест получения логов несуществующей камеры
        logs = self.logging_service.get_camera_logs(999)
        self.assertEqual(len(logs), 0)

    @patch('app.services.logging_service.reportlab.pdfgen.canvas.Canvas')
    def test_create_pdf_from_logs(self, mock_canvas):
        # Тест создания PDF из логов
        # Создаем тестовые логи
        db = self.SessionLocal()
        test_logs = [
            Log(
                camera_id=self.test_camera.id,
                event="event1",
                timestamp=datetime.now(),
                details=json.dumps({"test": "data1"})
            ),
            Log(
                camera_id=self.test_camera.id,
                event="event2",
                timestamp=datetime.now(),
                details=json.dumps({"test": "data2"})
            )
        ]
        for log in test_logs:
            db.add(log)
        db.commit()
        db.close()
        
        # Создаем PDF
        pdf_path = self.logging_service.create_pdf_from_logs(self.test_camera.id)
        
        self.assertTrue(os.path.exists(pdf_path))
        mock_canvas.assert_called_once()

    @patch('app.services.logging_service.smtplib.SMTP')
    def test_send_email_with_pdf(self, mock_smtp):
        # Тест отправки email с PDF
        test_pdf_path = "test_logs/test.pdf"
        os.makedirs("test_logs", exist_ok=True)
        with open(test_pdf_path, "w") as f:
            f.write("test pdf content")
        
        self.logging_service.send_email_with_pdf(
            recipient_email="test@example.com",
            pdf_path=test_pdf_path,
            camera_name="Test Camera"
        )
        
        mock_smtp.return_value.sendmail.assert_called_once()

    @patch('app.services.logging_service.telegram.Bot')
    def test_send_telegram_notification(self, mock_bot):
        # Тест отправки уведомления в Telegram
        self.logging_service.send_telegram_notification(
            message="Test notification",
            camera_name="Test Camera"
        )
        
        mock_bot.return_value.send_message.assert_called_once()

    def test_cleanup_old_logs(self):
        # Тест очистки старых логов
        # Создаем старые логи
        db = self.SessionLocal()
        old_log = Log(
            camera_id=self.test_camera.id,
            event="old_event",
            timestamp=datetime(2020, 1, 1),
            details=json.dumps({"test": "old_data"})
        )
        db.add(old_log)
        db.commit()
        db.close()
        
        # Очищаем старые логи
        self.logging_service.cleanup_old_logs(days=30)
        
        # Проверяем, что старые логи удалены
        db = self.SessionLocal()
        remaining_logs = db.query(Log).filter(Log.camera_id == self.test_camera.id).all()
        db.close()
        
        self.assertEqual(len(remaining_logs), 0)

if __name__ == '__main__':
    unittest.main() 