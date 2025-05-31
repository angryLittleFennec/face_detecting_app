from pydantic import BaseModel, HttpUrl, field_validator, EmailStr, ConfigDict, constr
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class CameraBase(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    is_active: bool = True

    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v.startswith('rtsp://'):
            raise ValueError("URL должен начинаться с rtsp://")
        return v

class CameraCreate(CameraBase):
    pass

class CameraUpdate(CameraBase):
    pass

class Camera(CameraBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class PersonBase(BaseModel):
    name: constr(min_length=1)

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    id: int
    faces: List["Face"] = []

    model_config = ConfigDict(from_attributes=True)

class FaceBase(BaseModel):
    person_id: int
    encoding: str

class FaceCreate(FaceBase):
    pass

class Face(FaceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: EmailStr
    username: constr(min_length=1)

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class StreamProcessorConfig(BaseModel):
    name: str
    camera_id: int

class StreamProcessorResponse(BaseModel):
    status: str
    message: str
    name: Optional[str] = None
    release_name: Optional[str] = None
    camera_id: Optional[int] = None
    input_stream: Optional[str] = None
    output_stream: Optional[str] = None

class StreamProcessor(BaseModel):
    id: int
    name: str
    camera_id: Optional[int] = None
    input_stream: str
    output_stream: str
    release_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StreamProcessorList(BaseModel):
    processors: List[StreamProcessor]

class EventType(str, Enum):
    ENTER = "enter"
    EXIT = "exit"

class EventBase(BaseModel):
    event_type: EventType
    person_id: Optional[int] = None
    stream_processor_id: int
    track_id: Optional[int] = None
    duration: Optional[int] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    timestamp: datetime
    is_aggregated: bool

    class Config:
        from_attributes = True

class EventAggregationBase(BaseModel):
    person_id: Optional[int] = None
    stream_processor_id: int
    date: date
    hour: int
    total_entries: int = 0
    total_exits: int = 0
    avg_duration: Optional[int] = None
    max_duration: Optional[int] = None
    min_duration: Optional[int] = None

class EventAggregationCreate(EventAggregationBase):
    pass

class EventAggregation(EventAggregationBase):
    id: int

    class Config:
        from_attributes = True

class EventStats(BaseModel):
    total_events: int
    total_entries: int
    total_exits: int
    unique_people: int
    avg_duration: Optional[float] = None
    max_duration: Optional[int] = None
    min_duration: Optional[int] = None