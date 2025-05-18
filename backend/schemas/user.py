from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from typing import Optional
from datetime import datetime

class RoleEnum(str, Enum):
    teacher = "teacher"
    student = "student"

class UserBase(BaseModel):
    telegram_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=2, max_length=100)
    role: RoleEnum
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    telegram_id: Optional[int] = Field(None, gt=0)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[RoleEnum] = None
    email: Optional[EmailStr] = None

class User(UserBase):
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True