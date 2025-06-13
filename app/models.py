from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, Text, DateTime, Enum, Float, JSON, Index, Date
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    stream_processors = relationship("StreamProcessor", back_populates="camera")

class Person(Base):
    __tablename__ = "persons"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    faces = relationship("Face", back_populates="person", cascade="all, delete-orphan")

class Face(Base):
    __tablename__ = "faces"
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey('persons.id', ondelete="CASCADE"))
    encoding = Column(Text, nullable=False)  # Храним embedding как строку
    person = relationship("Person", back_populates="faces")

class StreamProcessor(Base):
    __tablename__ = "stream_processors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    input_stream = Column(String)
    output_stream = Column(String)
    release_name = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    camera = relationship("Camera", back_populates="stream_processors")

class EventType(enum.Enum):
    ENTER = "enter"
    EXIT = "exit"

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(Enum(EventType), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    person_id = Column(Integer, ForeignKey('persons.id', ondelete="SET NULL"), nullable=True)
    stream_processor_id = Column(Integer, ForeignKey('stream_processors.id', ondelete="CASCADE"), nullable=False)
    track_id = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    is_aggregated = Column(Boolean, default=False)
    
    # Связи
    person = relationship("Person", backref="events")
    stream_processor = relationship("StreamProcessor", backref="events")
    
    __table_args__ = (
        Index('idx_unaggregated_events', 'is_aggregated', 'timestamp'),
    )

class EventAggregation(Base):
    __tablename__ = "event_aggregations"
    
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey('persons.id', ondelete="SET NULL"), nullable=True)
    stream_processor_id = Column(Integer, ForeignKey('stream_processors.id', ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    hour = Column(Integer, nullable=False)
    
    total_entries = Column(Integer, default=0, nullable=False)
    total_exits = Column(Integer, default=0, nullable=False)
    avg_duration = Column(Integer, nullable=True)
    max_duration = Column(Integer, nullable=True)
    min_duration = Column(Integer, nullable=True)
    
    person = relationship("Person", backref="aggregations")
    stream_processor = relationship("StreamProcessor", backref="aggregations")
    
    __table_args__ = (
        Index('idx_aggregation_lookup', 'person_id', 'stream_processor_id', 'date', 'hour'),
    )

    def __repr__(self):
        return f"<Event(id={self.id}, type={self.event_type}, timestamp={self.timestamp})>"
