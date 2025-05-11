from pydantic import BaseModel, HttpUrl, field_validator, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

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
    name: str

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
    email: str
    username: str

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
    camera_id: int
    input_stream: str
    output_stream: str
    release_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StreamProcessorList(BaseModel):
    processors: List[StreamProcessor]