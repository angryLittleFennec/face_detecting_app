import unittest
from unittest.mock import patch, MagicMock
from test_camera_streamer.read_frames import FrameReader
from app.models import Base, Camera
from app.database import engine, SessionLocal
import cv2
import numpy as np
import os
from queue import Queue

class TestFrameReader(unittest.TestCase):
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
        
        # Инициализируем сервис чтения кадров
        self.frame_reader = FrameReader()

    def tearDown(self):
        # Очищаем базу данных
        Base.metadata.drop_all(bind=engine)
        
        # Удаляем тестовые файлы
        if os.path.exists("test_frames"):
            for file in os.listdir("test_frames"):
                os.remove(os.path.join("test_frames", file))
            os.rmdir("test_frames")

    @patch('cv2.VideoCapture')
    def test_get_face_embedding_success(self, mock_video_capture):
        # Тест успешного получения эмбеддинга лица
        # Создаем тестовое изображение
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Настраиваем мок VideoCapture
        mock_capture = MagicMock()
        mock_capture.read.return_value = (True, test_image)
        mock_video_capture.return_value = mock_capture
        
        # Мокаем функции dlib
        with patch('app.services.read_frames.dlib.face_detector') as mock_detector, \
             patch('app.services.read_frames.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.read_frames.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            # Получаем эмбеддинг
            embedding = self.frame_reader.get_face_embedding("test_url")
            
            self.assertIsNotNone(embedding)
            self.assertEqual(len(embedding), 128)

    @patch('cv2.VideoCapture')
    def test_get_face_embedding_no_face(self, mock_video_capture):
        # Тест получения эмбеддинга при отсутствии лица
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        mock_capture = MagicMock()
        mock_capture.read.return_value = (True, test_image)
        mock_video_capture.return_value = mock_capture
        
        with patch('app.services.read_frames.dlib.face_detector') as mock_detector:
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = []
            
            embedding = self.frame_reader.get_face_embedding("test_url")
            
            self.assertIsNone(embedding)

    @patch('cv2.VideoCapture')
    def test_get_face_embedding_empty_image(self, mock_video_capture):
        # Тест получения эмбеддинга из пустого изображения
        mock_capture = MagicMock()
        mock_capture.read.return_value = (False, None)
        mock_video_capture.return_value = mock_capture
        
        embedding = self.frame_reader.get_face_embedding("test_url")
        
        self.assertIsNone(embedding)

    @patch('app.services.read_frames.face_recognition_service')
    def test_find_matching_face_success(self, mock_face_service):
        # Тест успешного поиска совпадающего лица
        test_embedding = np.random.rand(128)
        mock_face_service.find_face.return_value = {
            "person_id": 1,
            "confidence": 0.95
        }
        
        result = self.frame_reader.find_matching_face(test_embedding)
        
        self.assertIsNotNone(result)
        self.assertEqual(result["person_id"], 1)
        self.assertEqual(result["confidence"], 0.95)

    @patch('app.services.read_frames.face_recognition_service')
    def test_find_matching_face_no_match(self, mock_face_service):
        # Тест поиска совпадающего лица при отсутствии совпадений
        test_embedding = np.random.rand(128)
        mock_face_service.find_face.return_value = None
        
        result = self.frame_reader.find_matching_face(test_embedding)
        
        self.assertIsNone(result)

    @patch('app.services.read_frames.logging_service')
    def test_send_log_to_service_success(self, mock_logging_service):
        # Тест успешной отправки лога в сервис логирования
        test_log = {
            "camera_id": self.test_camera.id,
            "event": "test_event",
            "timestamp": "2024-01-01T00:00:00",
            "details": {"test": "data"}
        }
        
        self.frame_reader.send_log_to_service(test_log)
        
        mock_logging_service.create_log.assert_called_once_with(**test_log)

    @patch('app.services.read_frames.logging_service')
    def test_send_log_to_service_failure(self, mock_logging_service):
        # Тест неудачной отправки лога в сервис логирования
        test_log = {
            "camera_id": self.test_camera.id,
            "event": "test_event",
            "timestamp": "2024-01-01T00:00:00",
            "details": {"test": "data"}
        }
        
        mock_logging_service.create_log.side_effect = Exception("Logging failed")
        
        # Проверяем, что исключение обрабатывается
        self.frame_reader.send_log_to_service(test_log)
        mock_logging_service.create_log.assert_called_once_with(**test_log)

    @patch('cv2.VideoCapture')
    def test_process_frames_person_detection(self, mock_video_capture):
        # Тест обработки кадров с детекцией людей
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        mock_capture = MagicMock()
        mock_capture.read.return_value = (True, test_image)
        mock_video_capture.return_value = mock_capture
        
        # Создаем тестовую очередь
        frame_queue = Queue()
        frame_queue.put(test_image)
        
        # Мокаем функции детекции
        with patch('app.services.read_frames.dlib.face_detector') as mock_detector, \
             patch('app.services.read_frames.dlib.shape_predictor') as mock_predictor, \
             patch('app.services.read_frames.dlib.face_recognition_model_v1') as mock_recognition:
            
            mock_detector.return_value = MagicMock()
            mock_detector.return_value.return_value = [(0, 0, 100, 100)]
            mock_predictor.return_value = MagicMock()
            mock_recognition.return_value = MagicMock()
            mock_recognition.return_value.compute_face_descriptor.return_value = np.random.rand(128)
            
            # Обрабатываем кадры
            self.frame_reader.process_frames(frame_queue, "person")
            
            # Проверяем, что кадр был обработан
            self.assertTrue(frame_queue.empty())

    @patch('cv2.VideoCapture')
    def test_process_frames_object_detection(self, mock_video_capture):
        # Тест обработки кадров с детекцией объектов
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        mock_capture = MagicMock()
        mock_capture.read.return_value = (True, test_image)
        mock_video_capture.return_value = mock_capture
        
        frame_queue = Queue()
        frame_queue.put(test_image)
        
        # Мокаем функции детекции объектов
        with patch('app.services.read_frames.yolo_model') as mock_yolo:
            mock_yolo.return_value = MagicMock()
            mock_yolo.return_value.predict.return_value = [(0, 0, 100, 100, 0.95, 0)]
            
            self.frame_reader.process_frames(frame_queue, "object")
            
            self.assertTrue(frame_queue.empty())

    @patch('cv2.VideoCapture')
    def test_process_frames_helmet_detection(self, mock_video_capture):
        # Тест обработки кадров с детекцией касок
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        mock_capture = MagicMock()
        mock_capture.read.return_value = (True, test_image)
        mock_video_capture.return_value = mock_capture
        
        frame_queue = Queue()
        frame_queue.put(test_image)
        
        # Мокаем функции детекции касок
        with patch('app.services.read_frames.yolo_model') as mock_yolo:
            mock_yolo.return_value = MagicMock()
            mock_yolo.return_value.predict.return_value = [(0, 0, 100, 100, 0.95, 0)]
            
            self.frame_reader.process_frames(frame_queue, "helmet")
            
            self.assertTrue(frame_queue.empty())

    @patch('cv2.VideoCapture')
    def test_process_frames_capture_failure(self, mock_video_capture):
        # Тест обработки кадров при ошибке захвата
        mock_capture = MagicMock()
        mock_capture.read.return_value = (False, None)
        mock_video_capture.return_value = mock_capture
        
        frame_queue = Queue()
        frame_queue.put(None)
        
        self.frame_reader.process_frames(frame_queue, "person")
        
        self.assertTrue(frame_queue.empty())

    def test_rtsp_urls(self):
        # Тест валидности RTSP URL
        valid_url = "rtsp://test.com/stream"
        invalid_url = "http://test.com/stream"
        
        self.assertTrue(self.frame_reader.is_valid_rtsp_url(valid_url))
        self.assertFalse(self.frame_reader.is_valid_rtsp_url(invalid_url))

    def test_process_frames_empty_queue(self):
        # Тест обработки пустой очереди кадров
        frame_queue = Queue()
        
        self.frame_reader.process_frames(frame_queue, "person")
        
        self.assertTrue(frame_queue.empty())

if __name__ == '__main__':
    unittest.main() 