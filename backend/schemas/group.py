from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Group(GroupBase):
    group_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GroupStats(BaseModel):
    total_groups: int
    total_users: int
    groups_with_tasks: int

class GroupWithUserCount(Group):
    user_count: int

    class Config:
        from_attributes = True