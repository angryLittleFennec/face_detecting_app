import pytest
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
from freezegun import freeze_time

from app.database import SessionLocal, Base
from app import models, schemas
from app.services.logging_service import LoggingService
import uuid

@pytest.fixture(scope="function")
def db():
    """Фикстура для создания тестовой базы данных"""
    db = SessionLocal()
    try:
        # Очищаем все таблицы перед каждым тестом
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.flush()
        db.expunge_all()
        db.commit()
        yield db
    finally:
        # Очищаем все таблицы после каждого теста
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.flush()
        db.expunge_all()
        db.commit()
        db.close()

@pytest.fixture(scope="function")
def test_camera(db):
    unique_id = str(uuid.uuid4())[:8]
    camera = models.Camera(
        name=f"Test Camera {unique_id}",
        url=f"rtsp://test.com/stream/{unique_id}",
        description="Test camera description",
        is_active=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@pytest.fixture(scope="function")
def test_person(db):
    """Создаем тестового человека"""
    unique_id = str(uuid.uuid4())[:8]
    person = models.Person(
        name=f"Test Person {unique_id}"
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

@pytest.fixture(scope="function")
def test_stream_processor(db, test_camera):
    """Создаем тестовый процессор"""
    unique_id = str(uuid.uuid4())[:8]
    processor = models.StreamProcessor(
        name=f"testproc_{unique_id}",
        camera_id=test_camera.id,
        input_stream="rtsp://test",
        output_stream="rtsp://out",
        release_name=f"test-release-{unique_id}"
    )
    db.add(processor)
    db.commit()
    db.refresh(processor)
    return processor

@pytest.fixture
def logging_service(db: Session):
    return LoggingService(db)

@freeze_time("2024-01-01 10:00:00+00:00")
def test_get_events_with_names(db, test_person, test_stream_processor):
    """Тест получения событий с именами людей"""
    service = LoggingService(db)
    
    # Создаем события
    base_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)
    events = []
    for i in range(3):
        event = models.Event(
            person_id=test_person.id,
            stream_processor_id=test_stream_processor.id,
            event_type=models.EventType.ENTER if i % 2 == 0 else models.EventType.EXIT,
            timestamp=base_time - timedelta(minutes=i*5)
        )
        db.add(event)
        events.append(event)
    db.commit()

    # Получаем события
    result = service.get_events(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id
    )

    assert len(result) == 3
    for event in result:
        assert event['person_id'] == test_person.id
        assert event['person_name'] == test_person.name
        assert event['stream_processor_id'] == test_stream_processor.id

def test_get_grouped_events(db, test_person, test_stream_processor):
    """Тест группировки событий по парам вход-выход"""
    service = LoggingService(db)
    
    # Создаем пару событий вход-выход
    base_time = datetime.now(UTC)
    enter_event = models.Event(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type=models.EventType.ENTER,
        timestamp=base_time
    )
    exit_event = models.Event(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type=models.EventType.EXIT,
        timestamp=base_time + timedelta(minutes=30),
        duration=1800
    )
    db.add(enter_event)
    db.add(exit_event)
    db.commit()

    # Получаем сгруппированные события
    result = service.get_grouped_events(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id
    )

    assert len(result) == 1
    grouped_event = result[0]
    assert grouped_event['person_id'] == test_person.id
    assert grouped_event['stream_processor_id'] == test_stream_processor.id
    assert grouped_event['duration'] == 1800

@freeze_time("2024-01-01 10:00:00+00:00")
def test_get_events_for_pdf(db, test_person, test_stream_processor):
    """Тест получения событий для PDF-отчета"""
    service = LoggingService(db)
    
    # Создаем события
    base_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)
    enter_event = models.Event(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type=models.EventType.ENTER,
        timestamp=base_time
    )
    exit_event = models.Event(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type=models.EventType.EXIT,
        timestamp=base_time + timedelta(minutes=30),
        duration=1800
    )
    db.add(enter_event)
    db.add(exit_event)
    db.commit()

    # Получаем события для PDF
    result = service.get_events_for_pdf(
        start_time=base_time - timedelta(minutes=1),
        end_time=base_time + timedelta(minutes=31)
    )

    assert len(result) == 1
    event = result[0]
    assert event['person_id'] == test_person.id
    assert event['duration'] == 1800

def test_aggregate_events(db, test_person, test_stream_processor):
    """Тест агрегации событий"""
    service = LoggingService(db)
    
    # Очищаем все события перед тестом
    db.query(models.Event).delete()
    db.query(models.EventAggregation).delete()
    db.commit()
    
    # Создаем события для агрегации в одном и том же часу
    now = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC).replace(microsecond=0)
    events = []
    for i in range(3):
        event = models.Event(
            person_id=test_person.id,
            stream_processor_id=test_stream_processor.id,
            event_type=models.EventType.ENTER if i % 2 == 0 else models.EventType.EXIT,
            timestamp=now,  # одинаковый час, без микросекунд
            duration=1800 if i % 2 == 1 else None,
            is_aggregated=False
        )
        db.add(event)
        events.append(event)
    db.commit()

    # Агрегируем события
    service.aggregate_events()

    # Проверяем, что события помечены как агрегированные
    for event in events:
        db.refresh(event)
        assert event.is_aggregated == True

    # Проверяем агрегированные данные
    aggregations = service.get_aggregations(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id
    )
    print(f"Aggregations: {[{'date': a.date, 'hour': a.hour, 'entries': a.total_entries, 'exits': a.total_exits} for a in aggregations]}")
    assert len(aggregations) == 1
    agg = aggregations[0]
    assert agg.total_entries == 2
    assert agg.total_exits == 1
    assert agg.avg_duration == 1800

@freeze_time("2024-01-01 10:00:00+00:00")
def test_cleanup_old_events(db, test_person, test_stream_processor):
    """Тест очистки старых событий"""
    service = LoggingService(db)
    
    # Очищаем все события перед тестом
    db.query(models.Event).delete()
    db.commit()
    
    # Создаем старое событие
    old_time = datetime(2023, 12, 1, 10, 0, 0, tzinfo=UTC)
    old_event = models.Event(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type=models.EventType.ENTER,
        timestamp=old_time,
        is_aggregated=True
    )
    db.add(old_event)
    db.commit()

    # Очищаем старые события
    service.cleanup_old_events(days_to_keep=7)

    # Проверяем, что событие удалено
    events = service.get_events()
    assert len(events) == 0

def test_get_stats(db, test_person, test_stream_processor):
    """Тест получения статистики"""
    service = LoggingService(db)
    
    # Очищаем все события перед тестом
    db.query(models.Event).delete()
    db.commit()
    
    # Создаем события
    now = datetime.now(UTC)
    events = []
    for i in range(3):
        event = models.Event(
            person_id=test_person.id,
            stream_processor_id=test_stream_processor.id,
            event_type=models.EventType.ENTER if i % 2 == 0 else models.EventType.EXIT,
            timestamp=now,
            duration=1800 if i % 2 == 1 else None
        )
        db.add(event)
        events.append(event)
    db.commit()

    # Получаем статистику
    stats = service.get_stats(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id
    )

    assert stats.total_events == 3
    assert stats.total_entries == 2
    assert stats.total_exits == 1
    assert stats.unique_people == 1
    assert stats.avg_duration == 1800
    assert stats.max_duration == 1800
    assert stats.min_duration == 1800

def test_get_events_error_handling(db):
    """Тест обработки ошибок при получении событий"""
    service = LoggingService(db)
    
    # Очищаем все события перед тестом
    db.query(models.Event).delete()
    db.commit()
    
    # Создаем невалидное событие
    invalid_event = models.Event(
        person_id=999,  # Несуществующий ID
        stream_processor_id=999,  # Несуществующий ID
        event_type=models.EventType.ENTER,
        timestamp=datetime.now(UTC)
    )
    db.add(invalid_event)
    db.commit()

    # Получаем события - ожидаем 1 событие
    result = service.get_events()
    assert isinstance(result, list)
    assert len(result) == 1

def test_get_grouped_events_error_handling(db):
    """Тест обработки ошибок при группировке событий"""
    service = LoggingService(db)
    
    # Очищаем все события перед тестом
    db.query(models.Event).delete()
    db.commit()
    
    # Создаем невалидное событие
    invalid_event = models.Event(
        person_id=999,
        stream_processor_id=999,
        event_type=models.EventType.ENTER,
        timestamp=datetime.now(UTC)
    )
    db.add(invalid_event)
    db.commit()

    # Группируем события - должно вернуть пустой список без ошибок
    result = service.get_grouped_events()
    assert isinstance(result, list)
    assert len(result) == 0 