from pydantic import BaseModel, HttpUrl, validator, EmailStr
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

    class Config:
        orm_mode = True

class PersonBase(BaseModel):
    name: str

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    id: int
    faces: List['Face'] = []

    class Config:
        orm_mode = True

class FaceBase(BaseModel):
    person_id: int
    encoding: List[float]  # Change from str to List[float]

    @validator('encoding', pre=True)
    def parse_encoding(cls, value):
        """Convert comma-separated string to list of floats"""
        if isinstance(value, str):
            return [float(x) for x in value.split(',')]
        return value


class PersonSimple(PersonBase):
    id: int

    class Config:
        orm_mode = True

class FaceCreate(FaceBase):
    pass

class Face(FaceBase):
    id: int
    person: PersonSimple  # Use simple version here

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None