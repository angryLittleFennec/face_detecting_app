import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from io import BytesIO
import os
from app.services.email_service import EmailService

@pytest.fixture
def email_service():
    return EmailService()

@pytest.fixture
def mock_fastmail():
    with patch('app.services.email_service.FastMail') as mock:
        mock_instance = AsyncMock()
        mock.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def pdf_buffer():
    buffer = BytesIO()
    buffer.write(b"Test PDF content")
    buffer.seek(0)
    return buffer

@pytest.mark.asyncio
async def test_send_report_email_success(email_service, mock_fastmail, pdf_buffer):
    """Тест успешной отправки отчета по email"""
    recipients = ["test@example.com"]
    
    # Подменяем fastmail на мок
    email_service.fastmail = mock_fastmail
    with patch("os.unlink") as mock_unlink:
        # Отправляем отчет
        result = await email_service.send_report_email(pdf_buffer, recipients)
        
        # Проверяем результат
        assert result is True
        mock_fastmail.send_message.assert_called_once()
        mock_unlink.assert_called_once()  # Проверяем, что файл удалён

@pytest.mark.asyncio
async def test_send_report_email_failure(email_service, mock_fastmail, pdf_buffer):
    """Тест обработки ошибки при отправке отчета"""
    recipients = ["test@example.com"]
    
    # Подменяем fastmail на мок
    email_service.fastmail = mock_fastmail
    # Симулируем ошибку при отправке
    mock_fastmail.send_message.side_effect = Exception("SMTP error")
    with patch("os.unlink") as mock_unlink:
        # Отправляем отчет
        result = await email_service.send_report_email(pdf_buffer, recipients)
        
        # Проверяем результат
        assert result is False
        mock_fastmail.send_message.assert_called_once()
        mock_unlink.assert_called_once()  # Проверяем, что файл удалён даже при ошибке

@pytest.mark.asyncio
async def test_send_report_email_multiple_recipients(email_service, mock_fastmail, pdf_buffer):
    """Тест отправки отчета нескольким получателям"""
    recipients = ["test1@example.com", "test2@example.com"]
    
    # Подменяем fastmail на мок
    email_service.fastmail = mock_fastmail
    with patch("os.unlink") as mock_unlink:
        # Отправляем отчет
        result = await email_service.send_report_email(pdf_buffer, recipients)
        
        # Проверяем результат
        assert result is True
        mock_fastmail.send_message.assert_called_once()
        mock_unlink.assert_called_once()
        message = mock_fastmail.send_message.call_args[0][0]
        assert message.recipients == recipients

@pytest.mark.asyncio
async def test_send_report_email_empty_buffer(email_service, mock_fastmail):
    """Тест отправки отчета с пустым буфером"""
    empty_buffer = BytesIO()
    recipients = ["test@example.com"]
    
    # Подменяем fastmail на мок
    email_service.fastmail = mock_fastmail
    with patch("os.unlink") as mock_unlink:
        # Отправляем отчет
        result = await email_service.send_report_email(empty_buffer, recipients)
        
        # Проверяем результат
        assert result is True
        mock_fastmail.send_message.assert_called_once()
        mock_unlink.assert_called_once() 