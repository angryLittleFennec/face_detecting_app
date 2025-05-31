from fastapi import FastAPI
from fastapi_utils.tasks import repeat_every
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import asyncio
from io import BytesIO
from .database import SessionLocal
from .services.email_service import EmailService
from .services.logging_service import LoggingService
from .routers.logging import get_events_pdf

logger = logging.getLogger(__name__)

def setup_scheduler(app: FastAPI) -> None:
    """Настройка планировщика задач"""
    
    @repeat_every(seconds=3600)  # Каждый час
    async def send_report_task() -> None:
        """Задача отправки отчета"""
        try:
            logger.info("Начало выполнения задачи отправки отчета")
            db = SessionLocal()
            try:
                # Создаем буфер для PDF
                pdf_buffer = BytesIO()
                
                # Генерируем PDF используя ту же логику, что и в роутере
                get_events_pdf(db, pdf_buffer)
                pdf_buffer.seek(0)
                
                # Отправляем отчет на email
                email_service = EmailService()
                await email_service.send_report_email(pdf_buffer)
                logger.info("Отчет успешно отправлен на email")
                    
            except Exception as e:
                logger.error(f"Ошибка при выполнении задачи: {str(e)}", exc_info=True)
            finally:
                db.close()
                logger.info("Соединение с базой данных закрыто")
                
        except Exception as e:
            logger.error(f"Критическая ошибка в задаче: {str(e)}", exc_info=True)
    
    # Регистрируем задачу в приложении
    app.state.send_report_task = send_report_task
    
    # Запускаем задачу сразу при старте
    asyncio.create_task(send_report_task()) 