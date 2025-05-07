from pydantic import BaseModel, HttpUrl, field_validator, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class CameraBase(BaseModel):
    name: str
    url: HttpUrl
    description: Optional[str] = None
    is_active: bool = True

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
    faces: List['Face'] = []
    model_config = ConfigDict(from_attributes=True)

class FaceBase(BaseModel):
    person_id: int
    encoding: List[float]

    @field_validator('encoding', mode='before')
    @classmethod
    def parse_encoding(cls, value):
        """Convert comma-separated string to list of floats"""
        if isinstance(value, str):
            return [float(x) for x in value.split(',')]
        return value

class PersonSimple(PersonBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class FaceCreate(FaceBase):
    pass

class Face(FaceBase):
    id: int
    person: PersonSimple
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class StreamProcessorConfig(BaseModel):
    input_stream: str
    output_stream: str
    name: str
    camera_id: Optional[int] = None

    @field_validator('input_stream', 'output_stream')
    @classmethod
    def validate_stream_url(cls, v):
        if not v.startswith(('rtsp://', 'http://', 'https://')):
            raise ValueError("Stream URL must start with rtsp://, http:// or https://")
        return v

class StreamProcessorResponse(BaseModel):
    name: str
    container_name: str
    status: str
    message: str