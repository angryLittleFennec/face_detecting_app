from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, Text
from sqlalchemy.orm import relationship
from .database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


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
