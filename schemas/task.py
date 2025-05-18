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
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: TaskStatus = Field(default=TaskStatus.TODO)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    board_id: int = Field(..., gt=0)
    user_id: int = Field(..., gt=0)
    group_id: Optional[int] = Field(None, gt=0)
    deadline: Optional[datetime] = None

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

    @field_serializer("user_id")
    def serialize_user_id(self, obj):
        return obj.user_id

class TaskResponse(TaskBase):
    task_id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class TaskStats(BaseModel):
    total_tasks: int
    tasks_by_status: Dict[str, int]
    tasks_by_priority: Dict[str, int]

class BulkTaskUpdate(BaseModel):
    task_ids: List[int]
    status: TaskStatus



