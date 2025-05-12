from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_serializer
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    assigned_files: Optional[int] = None
    group_id: Optional[int] = None
    board_id: Optional[int] = None
    user_ids: List[int] = []  # Исполнители задачи
    assigner_id: Optional[int] = 1  # ID пользователя, который назначил задачу (по умолчанию 1)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    board_id: Optional[int] = Field(None, gt=0)
    user_id: Optional[int] = Field(None, gt=0)
    group_id: Optional[int] = Field(None, gt=0)
    deadline: Optional[datetime] = None

class Task(TaskBase):
    task_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    
    # @field_serializer("user_id")
    # def serialize_user_id(self, obj):
    #     return obj.user_id

class TaskResponse(TaskBase):
    task_id: int
    created_at: datetime
    updated_at: datetime
    group_id: Optional[int] = None
    board_id: Optional[int] = None
    user_ids: List[int]  # ID исполнителей
    assigner_id: int  # ID назначившего

    class Config:
        from_attributes = True

class TaskStats(BaseModel):
    total_tasks: int
    tasks_by_status: Dict[str, int]
    tasks_by_priority: Dict[str, int]

class BulkTaskUpdate(BaseModel):
    task_ids: List[int]
    status: TaskStatus



