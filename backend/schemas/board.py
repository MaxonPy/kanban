from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class BoardBase(BaseModel):
    title: str
    description: Optional[str] = None

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Board(BoardBase):
    board_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_id: int

    class Config:
        from_attributes = True

class BoardWithTasks(Board):
    tasks: List[dict]

    class Config:
        from_attributes = True