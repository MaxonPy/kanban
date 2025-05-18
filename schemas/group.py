from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

# Схема для чтения данных группы (response)
class Groups(BaseModel):
    group_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True  


# Схема для создания новой группы (request)
class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None


# Схема для обновления группы (partial update)
class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class GroupStats(BaseModel):
    group_name: str
    total_users: int
    total_tasks: int
    tasks_by_status: Dict[str, int]

class GroupWithUserCount(Groups):
    user_count: int

    class Config:
        from_attributes = True