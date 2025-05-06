import unittest
from unittest.mock import patch, MagicMock
import numpy as np
import cv2
import os
from test_camera_streamer.read_frames import (
    get_face_embedding,
    find_matching_face,
    send_log_to_service,
    process_frames,
    RTSP_INPUT_URL,
    RTSP_OUTPUT_URL,
    FACE_MODEL,
    OBJECT_MODEL,
    HELMET_MODEL
)
from app.face_recognition import (
    app as face_recognition_app,
    find_matching_face as face_recognition_find,
    face_detector,
    shape_predictor,
    face_rec_model
)
from app.logging_service import (
    app as logging_app,
    create_pdf_from_logs,
    send_email_with_pdf,
    bot,
    schedule
)

class TestMainServices(unittest.TestCase):
    def setUp(self):
        # Создаем тестовое изображение
        self.test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        
        # Создаем тестовый лог-файл
        with open("person_detection.log", "w") as f:
            f.write("2024-03-25 10:00:00 - Test log message\n")

    def tearDown(self):
        # Очищаем тестовые файлы
        if os.path.exists("person_detection.log"):
            os.remove("person_detection.log")
        if os.path.exists("person_detection_report.pdf"):
            os.remove("person_detection_report.pdf")
        if os.path.exists("person_detection_report_test.pdf"):
            os.remove("person_detection_report_test.pdf")

    # Тесты для read_frames.py
    @patch('dlib.get_frontal_face_detector')
    @patch('dlib.shape_predictor')
    @patch('dlib.face_recognition_model_v1')
    def test_get_face_embedding_success(self, mock_rec_model, mock_predictor, mock_detector):
        mock_detector.return_value.return_value = [MagicMock()]
        mock_predictor.return_value.return_value = MagicMock()
        mock_rec_model.return_value.compute_face_descriptor.return_value = np.random.rand(128)
        
        embedding = get_face_embedding(self.test_image)
        self.assertIsNotNone(embedding)
        self.assertEqual(embedding.shape, (128,))

    @patch('requests.get')
    def test_find_matching_face_success(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "status": "success",
            "person": "Test Person"
        }
        
        test_embedding = np.random.rand(128)
        result = find_matching_face(test_embedding)
        self.assertEqual(result, "Test Person")

    @patch('cv2.VideoCapture')
    @patch('cv2.VideoWriter')
    def test_process_frames_with_models(self, mock_writer, mock_capture):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        mock_cap.read.return_value = (True, self.test_image)
        mock_capture.return_value = mock_cap

        mock_writer_instance = MagicMock()
        mock_writer.return_value = mock_writer_instance

        # Тестируем обработку с разными моделями
        process_frames(["person", "car", "helmet"])
        mock_writer_instance.write.assert_called()

    # Тесты для face_recognition.py
    @patch('dlib.get_frontal_face_detector')
    def test_face_detector_initialization(self, mock_detector):
        self.assertIsNotNone(face_detector)
        mock_detector.assert_called_once()

    @patch('dlib.shape_predictor')
    def test_shape_predictor_initialization(self, mock_predictor):
        self.assertIsNotNone(shape_predictor)
        mock_predictor.assert_called_once()

    @patch('dlib.face_recognition_model_v1')
    def test_face_rec_model_initialization(self, mock_model):
        self.assertIsNotNone(face_rec_model)
        mock_model.assert_called_once()

    # Тесты для logging_service.py
    def test_create_pdf_from_logs(self):
        test_uid = "test"
        create_pdf_from_logs(test_uid)
        self.assertTrue(os.path.exists(f"person_detection_report_{test_uid}.pdf"))

    @patch('smtplib.SMTP')
    def test_send_email_with_pdf(self, mock_smtp):
        test_uid = "test"
        with open(f"person_detection_report_{test_uid}.pdf", "w") as f:
            f.write("Test PDF content")
        
        send_email_with_pdf(test_uid)
        mock_smtp.assert_called_once_with("smtp.gmail.com", 587)

    @patch('telebot.TeleBot')
    def test_telegram_bot_commands(self, mock_bot):
        test_message = MagicMock()
        test_message.text = "Привет"
        bot.get_text_messages(test_message)
        mock_bot.send_message.assert_called_once()

    def test_schedule_tasks(self):
        self.assertTrue(schedule.get_jobs())

    # Тесты для моделей YOLO
    def test_yolo_models_initialization(self):
        self.assertIsNotNone(FACE_MODEL)
        self.assertIsNotNone(OBJECT_MODEL)
        self.assertIsNotNone(HELMET_MODEL)

    @patch('cv2.VideoCapture')
    def test_process_frames_with_yolo_models(self, mock_capture):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        mock_cap.read.return_value = (True, self.test_image)
        mock_capture.return_value = mock_cap

        # Тестируем обработку с разными моделями YOLO
        process_frames(["person", "car", "helmet"])
        mock_cap.read.assert_called()

    def test_rtsp_urls(self):
        self.assertIsInstance(RTSP_INPUT_URL, str)
        self.assertIsInstance(RTSP_OUTPUT_URL, str)
        self.assertTrue(RTSP_INPUT_URL.startswith("rtsp://"))
        self.assertTrue(RTSP_OUTPUT_URL.startswith("rtsp://"))

    @patch('requests.post')
    def test_send_log_to_service(self, mock_post):
        mock_post.return_value.status_code = 200
        send_log_to_service("Test log message")
        mock_post.assert_called_once()

    def test_log_file_format(self):
        with open("person_detection.log", "r") as f:
            log_content = f.read()
            self.assertRegex(log_content, r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}")

if __name__ == '__main__':
    unittest.main() 