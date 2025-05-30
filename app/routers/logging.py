from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi.responses import StreamingResponse
from io import BytesIO

from ..database import get_db
from ..services.logging_service import LoggingService
from .. import schemas
from .. import models

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
def get_events_pdf(
    person_id: Optional[int] = None,
    stream_processor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Получение PDF-отчета с событиями за последний месяц"""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    # Регистрируем шрифт с поддержкой русского языка
    pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    
    # Создаем буфер для PDF
    buffer = BytesIO()
    
    # Создаем PDF документ
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Создаем стиль с поддержкой русского языка
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName='DejaVuSans',
        fontSize=16,
        spaceAfter=30
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontName='DejaVuSans',
        fontSize=10
    )
    
    elements = []
    
    # Добавляем заголовок
    elements.append(Paragraph("Отчет по событиям за последний месяц", title_style))
    elements.append(Spacer(1, 20))
    
    # Получаем данные
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    logging_service = LoggingService(db)
    grouped_events = logging_service.get_grouped_events(
        person_id=person_id,
        stream_processor_id=stream_processor_id,
        start_time=start_date,
        end_time=end_date
    )
    
    # Создаем таблицу с данными
    data = [['ID', 'Имя', 'Камера', 'Вход', 'Выход', 'Длит.']]
    
    for event in grouped_events:
        data.append([
            str(event['person_id']) if event['person_id'] else 'N/A',
            event['person_name'] if event['person_name'] else 'Неизв.',
            str(event['stream_processor_id']),
            event['enter_time'].strftime('%Y-%m-%d %H:%M'),
            event['exit_time'].strftime('%Y-%m-%d %H:%M'),
            str(event['duration']) if event['duration'] else 'N/A'
        ])
    
    # Создаем таблицу с уменьшенными колонками
    table = Table(data, colWidths=[40, 80, 40, 100, 100, 40])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'DejaVuSans'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'DejaVuSans'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table)
    
    # Добавляем статистику
    elements.append(Spacer(1, 30))
    stats = logging_service.get_stats(
        person_id=person_id,
        stream_processor_id=stream_processor_id,
        start_time=start_date,
        end_time=end_date
    )
    
    stats_text = f"""
    Статистика за период:
    - Всего событий: {stats.total_events}
    - Уникальных людей: {stats.unique_people}
    - Средняя длительность: {stats.avg_duration:.2f} сек
    - Максимальная длительность: {stats.max_duration:.2f} сек
    """
    
    elements.append(Paragraph(stats_text, normal_style))
    
    # Строим PDF
    doc.build(elements)
    
    # Подготавливаем ответ
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type='application/pdf',
        headers={
            'Content-Disposition': 'attachment; filename=events_report.pdf'
        }
    ) 