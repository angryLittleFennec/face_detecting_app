from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi.responses import StreamingResponse
from io import BytesIO
import uuid
import io
import logging
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from ..database import get_db
from ..services.logging_service import LoggingService
from .. import schemas
from .. import models

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/logging",
    tags=["logging"],
    responses={404: {"description": "Not found"}},
)

@router.post("/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    """Создание нового события"""
    logging_service = LoggingService(db)
    return logging_service.create_event(event)

@router.get("/events/", response_model=List[schemas.Event])
def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    person_id: Optional[int] = None,
    stream_processor_id: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Получение списка событий с фильтрацией"""
    logging_service = LoggingService(db)
    return logging_service.get_events(
        skip=skip,
        limit=limit,
        person_id=person_id,
        stream_processor_id=stream_processor_id,
        start_time=start_time,
        end_time=end_time
    )

@router.get("/stats/", response_model=schemas.EventStats)
def get_stats(
    person_id: Optional[int] = None,
    stream_processor_id: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Получение статистики по событиям"""
    logging_service = LoggingService(db)
    return logging_service.get_stats(
        person_id=person_id,
        stream_processor_id=stream_processor_id,
        start_time=start_time,
        end_time=end_time
    )

@router.get("/aggregations/", response_model=List[schemas.EventAggregation])
def get_aggregations(
    person_id: Optional[int] = None,
    stream_processor_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Получение агрегированных данных"""
    logging_service = LoggingService(db)
    return logging_service.get_aggregations(
        person_id=person_id,
        stream_processor_id=stream_processor_id,
        start_date=start_date,
        end_date=end_date
    )

@router.post("/aggregate/")
def aggregate_events(db: Session = Depends(get_db)):
    """Запуск агрегации событий"""
    logging_service = LoggingService(db)
    logging_service.aggregate_events()
    return {"status": "success", "message": "Агрегация завершена"}

@router.post("/cleanup/")
def cleanup_events(days_to_keep: int = Query(7, ge=1, le=365), db: Session = Depends(get_db)):
    """Очистка старых событий"""
    logging_service = LoggingService(db)
    logging_service.cleanup_old_events(days_to_keep)
    return {"status": "success", "message": f"Очистка завершена. Сохранены данные за последние {days_to_keep} дней"}

@router.post("/cleanup/all/")
def cleanup_all_events(db: Session = Depends(get_db)):
    """Полная очистка всех событий и агрегаций"""
    logging_service = LoggingService(db)
    # Удаляем все события
    db.query(models.Event).delete()
    # Удаляем все агрегации
    db.query(models.EventAggregation).delete()
    db.commit()
    return {"status": "success", "message": "Все события и агрегации успешно удалены"}

@router.get("/events/pdf/")
def download_events_pdf(
    person_id: Optional[int] = None,
    stream_processor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Получение PDF-отчета с событиями за последний месяц"""
    pdf_buffer = BytesIO()
    get_events_pdf(db, pdf_buffer)
    pdf_buffer.seek(0)
    return StreamingResponse(
        pdf_buffer,
        media_type='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename=events_report_{uuid.uuid4()}.pdf'
        }
    )

def get_events_pdf(db: Session, pdf_buffer: io.BytesIO):
    """Генерация PDF отчета"""
    try:
        # Регистрируем шрифт
        pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        
        # Создаем документ
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        # Создаем стили
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='CustomTitle',
            fontName='DejaVuSans',
            fontSize=16,
            spaceAfter=30
        ))
        styles.add(ParagraphStyle(
            name='CustomBody',
            fontName='DejaVuSans',
            fontSize=10
        ))
        
        # Создаем элементы документа
        elements = []
        
        # Добавляем заголовок
        elements.append(Paragraph("Отчет по событиям", styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        # Получаем данные
        logging_service = LoggingService(db)
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        grouped_events = logging_service.get_events_for_pdf(start_time, end_time)
        
        if not grouped_events:
            elements.append(Paragraph("Событий не найдено", styles['CustomBody']))
        else:
            # Создаем таблицу
            data = [['ID', 'Имя', 'Камера', 'Вход', 'Выход', 'Длит.']]
            for event in grouped_events:
                data.append([
                    str(event['person_id']),
                    event['person_name'] or "Неизв.",
                    str(event['stream_processor_id']),
                    event['enter_time'].strftime('%H:%M:%S'),
                    event['exit_time'].strftime('%H:%M:%S'),
                    f"{event['duration']:.1f}"
                ])
            
            # Создаем таблицу с фиксированными размерами колонок
            table = Table(data, colWidths=[40, 80, 40, 60, 60, 40])
            table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),  # Размер шрифта для заголовка
                ('FONTSIZE', (0, 1), (-1, -1), 9),   # Размер шрифта для данных
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
            ]))
            
            elements.append(table)
        
        # Собираем документ
        doc.build(elements)
        logger.info("PDF отчет успешно сформирован")
        
    except Exception as e:
        logger.error(f"Ошибка при формировании PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 