import unittest
from unittest.mock import patch
from app.services.camera_service import start_video_processing, stop_video_processing

class TestCameraService(unittest.TestCase):
    @patch('builtins.print')
    def test_start_video_processing(self, mock_print):
        # Тест запуска обработки видеопотока
        camera_id = 1
        start_video_processing(camera_id)
        mock_print.assert_called_once_with(f"Запуск обработки видеопотока для камеры {camera_id}")

    @patch('builtins.print')
    def test_stop_video_processing(self, mock_print):
        # Тест остановки обработки видеопотока
        camera_id = 1
        stop_video_processing(camera_id)
        mock_print.assert_called_once_with(f"Остановка обработки видеопотока для камеры {camera_id}")

    def test_start_video_processing_with_invalid_id(self):
        # Тест с некорректным ID камеры
        with self.assertRaises(TypeError):
            start_video_processing("invalid_id")

    def test_stop_video_processing_with_invalid_id(self):
        # Тест с некорректным ID камеры
        with self.assertRaises(TypeError):
            stop_video_processing("invalid_id")

if __name__ == '__main__':
    unittest.main() 