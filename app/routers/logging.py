from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..services.logging_service import LoggingService
from .. import schemas

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