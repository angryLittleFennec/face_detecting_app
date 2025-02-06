from sqlalchemy import Column, Integer, String, Boolean
from .database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
