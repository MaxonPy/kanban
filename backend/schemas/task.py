from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_serializer, field_validator
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
    assigned_files: Optional[List[str]] = None
    group_id: Optional[int] = None
    board_id: Optional[int] = None
    assigner_id: Optional[int] = 1  # ID пользователя, который назначил задачу (по умолчанию 1)
    
    @field_validator('assigned_files', mode='before')
    @classmethod
    def parse_assigned_files(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

class TaskCreate(TaskBase):
    user_id: Optional[int] = None  # ID исполнителя задачи (студента)

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    board_id: Optional[int] = Field(None, gt=0)
    user_id: Optional[int] = Field(None, gt=0)
    group_id: Optional[int] = Field(None, gt=0)
    deadline: Optional[datetime] = None

class TaskAssignment(BaseModel):
    user_id: int = Field(gt=0, description="ID пользователя, которому назначается задача")
    task_id: int = Field(gt=0, description="ID задачи для назначения")

class Task(TaskBase):
    task_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: TaskStatus
    priority: Optional[TaskPriority] = None
    user_ids: List[int] = []  # ID исполнителей задачи

    class Config:
        from_attributes = True
    
    @field_serializer('status')
    def serialize_status(self, status: TaskStatus, _info):
        return status.value

    @field_serializer('priority')
    def serialize_priority(self, priority: Optional[TaskPriority], _info):
        return priority.value if priority else None

class TaskResponse(TaskBase):
    task_id: int
    created_at: datetime
    updated_at: datetime
    group_id: Optional[int] = None
    board_id: Optional[int] = None
    user_ids: List[int]  # ID исполнителей
    assigner_id: int  # ID назначившего
    status: TaskStatus
    priority: Optional[TaskPriority] = None

    class Config:
        from_attributes = True

    @field_serializer('status')
    def serialize_status(self, status: TaskStatus, _info):
        return status.value

    @field_serializer('priority')
    def serialize_priority(self, priority: Optional[TaskPriority], _info):
        return priority.value if priority else None

class TaskStats(BaseModel):
    total_tasks: int
    tasks_by_status: Dict[str, int]
    tasks_by_priority: Dict[str, int]

class BulkTaskUpdate(BaseModel):
    task_ids: List[int]
    status: TaskStatus



