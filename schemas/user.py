from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

class RoleEnum(str, Enum):
    teacher = "teacher"
    student = "student"
    admin = "admin"

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
    

class UserStats(BaseModel):
    user_name: str
    total_tasks: int
    tasks_by_status: dict[str, int]
    total_boards: int

class UserWithTaskCount(User):
    task_count: int

    class Config:
        from_attributes = True