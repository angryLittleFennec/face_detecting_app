from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base
from datetime import datetime

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
