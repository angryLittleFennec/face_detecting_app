from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List
import logging
from io import BytesIO
import tempfile
import os

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME="surveillanceappreport@gmail.com",
            MAIL_PASSWORD="rcwx mrrb orbn ajpv",
            MAIL_FROM="surveillanceappreport@gmail.com",
            MAIL_PORT=587,
            MAIL_SERVER="smtp.gmail.com",
            MAIL_FROM_NAME="Video Surveillance System",
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True
        )
        self.fastmail = FastMail(self.conf)

    async def send_report_email(self, pdf_buffer: BytesIO) -> bool:
        """Отправка отчета по email"""
        try:
            logger.info("Начало отправки отчета по email")
            
            # Создаем временный файл
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                # Записываем содержимое буфера во временный файл
                temp_file.write(pdf_buffer.getvalue())
                temp_file_path = temp_file.name
            
            try:
                # Создаем сообщение с путем к временному файлу
                message = MessageSchema(
                    subject="Monthly Person Detection Report",
                    recipients=["13x.skat.x13@gmail.com"],
                    body="В приложении находится отчет по событиям видеонаблюдения за последний месяц.",
                    subtype="html",
                    attachments=[{
                        "file": temp_file_path,
                        "filename": "person_detection_report.pdf"
                    }]
                )
                
                # Отправляем письмо
                await self.fastmail.send_message(message)
                logger.info("Отчет успешно отправлен по email")
                return True
                
            finally:
                # Удаляем временный файл
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            
        except Exception as e:
            logger.error(f"Ошибка при отправке отчета по email: {str(e)}", exc_info=True)
            return False 