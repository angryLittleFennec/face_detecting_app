from pydantic import BaseModel, HttpUrl
from typing import Optional

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
