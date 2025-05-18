from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class BoardBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    user_id: int = Field(..., gt=0)
    
    
class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    user_id: Optional[int] = Field(None, gt=0)

class KanbanBoards(BoardBase):
    board_id: int
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class BoardStats(BaseModel):
    board_name: str
    total_tasks: int
    tasks_by_status: Dict[str, int]

class BoardWithTaskCount(KanbanBoards):
    task_count: int

    class Config:
        from_attributes = True     