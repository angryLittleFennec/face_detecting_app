from sqlalchemy.orm import Session
from .. import models
from datetime import datetime, timedelta
import logging
from typing import List, Optional
from .. import schemas

logger = logging.getLogger(__name__)

class LoggingService:
    def __init__(self, db: Session):
        self.db = db

    def get_events(
        self,
        skip: int = 0,
        limit: int = 100,
        person_id: Optional[int] = None,
        stream_processor_id: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[models.Event]:
        try:
            query = self.db.query(models.Event, models.Person.name).outerjoin(
                models.Person,
                models.Event.person_id == models.Person.id
            )

            if person_id:
                query = query.filter(models.Event.person_id == person_id)
            if stream_processor_id:
                query = query.filter(models.Event.stream_processor_id == stream_processor_id)
            if start_time:
                query = query.filter(models.Event.timestamp >= start_time)
            if end_time:
                query = query.filter(models.Event.timestamp <= end_time)

            results = query.offset(skip).limit(limit).all()
            
            # Преобразуем результаты в список событий с именами
            events_with_names = []
            for event, person_name in results:
                event_dict = {
                    "id": event.id,
                    "event_type": event.event_type,
                    "person_id": event.person_id,
                    "person_name": person_name,
                    "stream_processor_id": event.stream_processor_id,
                    "track_id": event.track_id,
                    "duration": event.duration,
                    "timestamp": event.timestamp,
                    "is_aggregated": event.is_aggregated
                }
                events_with_names.append(event_dict)
                
            return events_with_names
        except Exception as e:
            logger.error(f"Ошибка при получении событий: {str(e)}", exc_info=True)
            return []

    def get_grouped_events(
        self,
        person_id: Optional[int] = None,
        stream_processor_id: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[dict]:
        """Получение сгруппированных событий по парам вход-выход"""
        try:
            events = self.get_events(
                person_id=person_id,
                stream_processor_id=stream_processor_id,
                start_time=start_time,
                end_time=end_time
            )
            
            # Сортируем события по времени
            events.sort(key=lambda x: x['timestamp'])
            
            # Словарь для хранения последних событий входа для каждой пары (person_id, processor_id)
            last_enter = {}
            result = []
            
            for event in events:
                key = (event['person_id'], event['stream_processor_id'])
                
                if event['event_type'] == models.EventType.ENTER:
                    last_enter[key] = event
                elif event['event_type'] == models.EventType.EXIT:
                    if key in last_enter:
                        enter_event = last_enter[key]
                        result.append({
                            'person_id': event['person_id'],
                            'person_name': event['person_name'],
                            'stream_processor_id': event['stream_processor_id'],
                            'enter_time': enter_event['timestamp'],
                            'exit_time': event['timestamp'],
                            'duration': event['duration']
                        })
                        # Удаляем использованное событие входа
                        del last_enter[key]
            
            # Сортируем по времени входа
            result.sort(key=lambda x: x['enter_time'])
            return result
        except Exception as e:
            logger.error(f"Ошибка при группировке событий: {str(e)}", exc_info=True)
            return []

    def get_events_for_pdf(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[dict]:
        """Получение событий для PDF-отчета"""
        try:
            # Если время не указано, берем последний месяц
            if not end_time:
                end_time = datetime.now()
            if not start_time:
                start_time = end_time - timedelta(days=30)
            
            return self.get_grouped_events(
                start_time=start_time,
                end_time=end_time
            )
        except Exception as e:
            logger.error(f"Ошибка при получении событий для PDF: {str(e)}", exc_info=True)
            return []

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
                    hour=hour
                )
                self.db.add(aggregation)
            
            # Обновляем статистику
            if event.event_type == models.EventType.ENTER:
                aggregation.total_entries += 1
            else:  # EXIT
                aggregation.total_exits += 1
                if event.duration:
                    if aggregation.avg_duration is None:
                        aggregation.avg_duration = event.duration
                    else:
                        aggregation.avg_duration = (aggregation.avg_duration + event.duration) // 2
                    
                    aggregation.max_duration = max(aggregation.max_duration or 0, event.duration)
                    aggregation.min_duration = min(aggregation.min_duration or float('inf'), event.duration)
            
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
        
        # Подсчет уникальных людей
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