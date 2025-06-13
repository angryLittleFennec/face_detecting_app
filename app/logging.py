from sqlalchemy.orm import Session
from datetime import datetime, timedelta, UTC
from typing import List, Optional
from . import models, schemas
from fastapi import FastAPI, Depends, HTTPException
from .database import get_db, engine
import uvicorn

# Создаем FastAPI приложение
app = FastAPI(
    title="Logging Service",
    description="Сервис для логирования событий",
    version="1.0.0"
)

class LoggingService:
    def __init__(self, db: Session):
        self.db = db

    def create_event(self, event: schemas.EventCreate) -> models.Event:
        """Создание нового события"""
        # Проверяем существование человека
        if not self.db.query(models.Person).filter(models.Person.id == event.person_id).first():
            raise HTTPException(
                status_code=404,
                detail=f"Person with id {event.person_id} not found"
            )
            
        event_dict = event.dict()
        # Преобразуем строковое значение в Enum
        event_dict['event_type'] = models.EventType(event_dict['event_type'])
        db_event = models.Event(**event_dict)
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        return db_event

    def get_events(
        self,
        skip: int = 0,
        limit: int = 100,
        person_id: Optional[int] = None,
        stream_processor_id: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[models.Event]:
        """Получение списка событий с фильтрацией"""
        query = self.db.query(models.Event)
        
        if person_id:
            query = query.filter(models.Event.person_id == person_id)
        if stream_processor_id:
            query = query.filter(models.Event.stream_processor_id == stream_processor_id)
        if start_time:
            # Преобразуем start_time в UTC, если он не в UTC
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=UTC)
            query = query.filter(models.Event.timestamp >= start_time)
        if end_time:
            # Преобразуем end_time в UTC, если он не в UTC
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=UTC)
            query = query.filter(models.Event.timestamp <= end_time)
            
        return query.offset(skip).limit(limit).all()

    def aggregate_events(self):
        """Агрегирует необработанные события"""
        # Получаем все необработанные события
        events = self.db.query(models.Event).filter(
            models.Event.is_aggregated == False
        ).all()
        
        for event in events:
            date = event.timestamp.date()
            hour = event.timestamp.hour
            
            # Находим или создаем запись агрегации
            aggregation = self.db.query(models.EventAggregation).filter(
                models.EventAggregation.person_id == event.person_id,
                models.EventAggregation.stream_processor_id == event.stream_processor_id,
                models.EventAggregation.date == date,
                models.EventAggregation.hour == hour
            ).first()
            
            if not aggregation:
                aggregation = models.EventAggregation(
                    person_id=event.person_id,
                    stream_processor_id=event.stream_processor_id,
                    date=date,
                    hour=hour,
                    total_entries=0,
                    total_exits=0,
                    avg_duration=None,
                    max_duration=None,
                    min_duration=None
                )
                self.db.add(aggregation)
                self.db.flush()
            
            # Обновляем статистику
            if event.event_type == models.EventType.ENTER:
                aggregation.total_entries = (aggregation.total_entries or 0) + 1
            else:  # EXIT
                aggregation.total_exits = (aggregation.total_exits or 0) + 1
                if event.duration:
                    if aggregation.avg_duration is None:
                        aggregation.avg_duration = event.duration
                    else:
                        aggregation.avg_duration = (aggregation.avg_duration + event.duration) // 2
                    aggregation.max_duration = max(aggregation.max_duration or event.duration, event.duration)
                    if aggregation.min_duration is None:
                        aggregation.min_duration = event.duration
                    else:
                        aggregation.min_duration = min(aggregation.min_duration, event.duration)
            
            event.is_aggregated = True
        
        self.db.commit()

    def cleanup_old_events(self, days_to_keep: int = 7):
        """Удаляет старые обработанные события"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        self.db.query(models.Event).filter(
            models.Event.timestamp < cutoff_date,
            models.Event.is_aggregated == True
        ).delete()
        self.db.commit()

    def get_stats(
        self,
        person_id: Optional[int] = None,
        stream_processor_id: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> schemas.EventStats:
        """Получает статистику по событиям"""
        query = self.db.query(models.Event)
        
        if person_id:
            query = query.filter(models.Event.person_id == person_id)
        if stream_processor_id:
            query = query.filter(models.Event.stream_processor_id == stream_processor_id)
        if start_time:
            query = query.filter(models.Event.timestamp >= start_time)
        if end_time:
            query = query.filter(models.Event.timestamp <= end_time)
        
        events = query.all()
        
        total_entries = sum(1 for e in events if e.event_type == models.EventType.ENTER)
        total_exits = sum(1 for e in events if e.event_type == models.EventType.EXIT)
        durations = [e.duration for e in events if e.duration is not None]
        unique_people = len(set(e.person_id for e in events if e.person_id is not None))
        return schemas.EventStats(
            total_events=len(events),
            total_entries=total_entries,
            total_exits=total_exits,
            unique_people=unique_people,
            avg_duration=sum(durations) / len(durations) if durations else None,
            max_duration=max(durations) if durations else None,
            min_duration=min(durations) if durations else None
        )

    def get_aggregations(
        self,
        person_id: Optional[int] = None,
        stream_processor_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[models.EventAggregation]:
        """Получение агрегированных данных"""
        query = self.db.query(models.EventAggregation)
        
        if person_id:
            query = query.filter(models.EventAggregation.person_id == person_id)
        if stream_processor_id:
            query = query.filter(models.EventAggregation.stream_processor_id == stream_processor_id)
        if start_date:
            query = query.filter(models.EventAggregation.date >= start_date)
        if end_date:
            query = query.filter(models.EventAggregation.date <= end_date)
            
        return query.order_by(models.EventAggregation.date, models.EventAggregation.hour).all()

@app.post("/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    """Создание нового события"""
    logging_service = LoggingService(db)
    return logging_service.create_event(event)

@app.get("/aggregations/", response_model=List[schemas.EventAggregation])
def get_aggregations(
    person_id: Optional[int] = None,
    stream_processor_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Получение агрегированных данных"""
    logging_service = LoggingService(db)
    return logging_service.get_aggregations(person_id, stream_processor_id, start_date, end_date)

if __name__ == "__main__":
    uvicorn.run(
        "app.logging:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    ) 