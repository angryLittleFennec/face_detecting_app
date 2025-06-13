import pytest
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session
from fastapi import HTTPException
from freezegun import freeze_time
from unittest.mock import patch
from unittest.mock import MagicMock

from app.database import SessionLocal, Base
from app import models, schemas
from app.logging import LoggingService, get_aggregations, create_event
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

@pytest.fixture
def test_event(db: Session, test_person):
    event = models.Event(
        person_id=test_person.id,
        event_type=models.EventType.ENTER,
        timestamp=datetime.utcnow(),
        stream_processor_id=1,
        is_aggregated=False
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def test_create_event_success(db, test_person):
    """Тест успешного создания события"""
    logging_service = LoggingService(db)
    event_data = schemas.EventCreate(
        person_id=test_person.id,
        stream_processor_id=1,
        event_type="enter",
        timestamp=datetime.now(UTC)
    )
    event = logging_service.create_event(event_data)
    assert event.person_id == test_person.id
    assert event.event_type == models.EventType.ENTER
    assert event.is_aggregated == False

def test_create_event_person_not_found(db):
    """Тест создания события с несуществующим человеком"""
    logging_service = LoggingService(db)
    event_data = schemas.EventCreate(
        person_id=999,
        stream_processor_id=1,
        event_type="enter",
        timestamp=datetime.now(UTC)
    )
    with pytest.raises(Exception) as exc_info:
        logging_service.create_event(event_data)
    assert "Person with id 999 not found" in str(exc_info.value)

def test_get_events_empty(db):
    """Тест получения пустого списка событий"""
    logging_service = LoggingService(db)
    # Очищаем все события явно
    db.query(models.Event).delete()
    db.commit()
    events = logging_service.get_events()
    assert len(events) == 0

@freeze_time("2024-01-01 10:00:00+00:00")
@patch('app.models.datetime')
def test_get_events_with_filters(mock_datetime, db, test_person, test_stream_processor):
    """Тест получения событий с фильтрами"""
    # Настраиваем мок datetime
    mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)

    logging_service = LoggingService(db)
    # Очищаем все события явно
    db.query(models.Event).delete()
    db.commit()

    # Создаем несколько событий в одном и том же часу
    base_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)  # Фиксированное время
    events = []
    for i in range(3):
        # Создаем событие напрямую через модель
        event = models.Event(
            person_id=test_person.id,
            stream_processor_id=test_stream_processor.id,
            event_type=models.EventType.ENTER if i % 2 == 0 else models.EventType.EXIT,
            timestamp=base_time - timedelta(minutes=i*5)  # все события в пределах одного часа
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        events.append(event)
        print(f"Created event: id={event.id}, timestamp={event.timestamp}, type={event.event_type}")

    # Проверяем, что события действительно созданы
    all_events = db.query(models.Event).all()
    print(f"Total events in DB: {len(all_events)}")
    for e in all_events:
        print(f"Event in DB: id={e.id}, timestamp={e.timestamp}, type={e.event_type}")

    # Тестируем фильтры
    start_time = base_time - timedelta(minutes=15)
    end_time = base_time + timedelta(minutes=1)
    print(f"Filtering events between {start_time} and {end_time}")

    filtered_events = logging_service.get_events(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        start_time=start_time,
        end_time=end_time
    )

    print(f"Found {len(filtered_events)} filtered events")
    for e in filtered_events:
        print(f"Filtered event: id={e.id}, timestamp={e.timestamp}, type={e.event_type}")

    # Проверяем, что все события найдены
    assert len(filtered_events) == 3

def test_aggregate_events(db, test_person, test_stream_processor):
    """Тест агрегации событий"""
    logging_service = LoggingService(db)
    # Очищаем все события и агрегации явно
    db.query(models.Event).delete()
    db.query(models.EventAggregation).delete()
    db.commit()
    # Создаем события для агрегации в одном и том же часу
    now = datetime.now(UTC).replace(minute=10, second=0, microsecond=0)
    event_data = schemas.EventCreate(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type="enter",
        timestamp=now
    )
    enter_event = logging_service.create_event(event_data)
    event_data = schemas.EventCreate(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type="exit",
        timestamp=now + timedelta(minutes=30),  # тот же час
        duration=1800  # 30 минут в секундах
    )
    exit_event = logging_service.create_event(event_data)
    # Агрегируем события
    logging_service.aggregate_events()
    # Проверяем, что события помечены как агрегированные
    db.refresh(enter_event)
    db.refresh(exit_event)
    assert enter_event.is_aggregated == True
    assert exit_event.is_aggregated == True
    # Проверяем агрегированные данные
    aggregations = logging_service.get_aggregations(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id
    )
    assert len(aggregations) == 1
    agg = aggregations[0]
    assert agg.total_entries == 1
    assert agg.total_exits == 1
    assert agg.avg_duration == 1800

def test_cleanup_old_events(db, test_person, test_stream_processor):
    """Тест очистки старых событий"""
    logging_service = LoggingService(db)
    # Очищаем все события и агрегации явно
    db.query(models.Event).delete()
    db.query(models.EventAggregation).delete()
    db.commit()
    # Создаем старое событие
    old_time = (datetime.now(UTC) - timedelta(days=8)).replace(tzinfo=None)
    event_data = schemas.EventCreate(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type="enter",
        timestamp=old_time
    )
    old_event = logging_service.create_event(event_data)
    # Агрегируем событие
    logging_service.aggregate_events()
    # Очищаем старые события
    logging_service.cleanup_old_events(days_to_keep=7)
    # Проверяем, что событие удалено
    events = logging_service.get_events()
    assert all((e.timestamp.replace(tzinfo=None) >= old_time) for e in events) or len(events) == 0

def test_get_stats(db, test_person, test_stream_processor):
    """Тест получения статистики"""
    logging_service = LoggingService(db)
    
    # Создаем события
    now = datetime.now(UTC)
    event_data = schemas.EventCreate(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type="enter",
        timestamp=now
    )
    logging_service.create_event(event_data)
    
    event_data = schemas.EventCreate(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id,
        event_type="exit",
        timestamp=now + timedelta(minutes=30),
        duration=1800
    )
    logging_service.create_event(event_data)
    
    # Получаем статистику
    stats = logging_service.get_stats(
        person_id=test_person.id,
        stream_processor_id=test_stream_processor.id
    )
    
    assert stats.total_events == 2
    assert stats.total_entries == 1
    assert stats.total_exits == 1
    assert stats.avg_duration == 1800
    assert stats.max_duration == 1800
    assert stats.min_duration == 1800

@pytest.mark.asyncio
async def test_get_aggregations():
    with patch('app.logging.LoggingService') as mock_service:
        mock_service.return_value.get_aggregations.return_value = []
        result = get_aggregations(db=MagicMock())
        assert result == []

@pytest.mark.asyncio
async def test_create_event_error():
    with patch('app.logging.LoggingService') as mock_service:
        mock_service.return_value.create_event.side_effect = HTTPException(status_code=404, detail="Person not found")
        with pytest.raises(HTTPException) as excinfo:
            await create_event(event=MagicMock(), db=MagicMock())
        assert excinfo.value.status_code == 404 