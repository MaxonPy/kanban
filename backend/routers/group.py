from typing import List
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Groups, Users, UserGroups, Tasks
from ..db import get_db
from ..schemas.group import Group, GroupCreate, GroupUpdate, GroupWithUserCount


router = APIRouter()


#Создание новой группы
@router.post("/groups", response_model=Group, summary="Создать новую группу")
def create_group(group: GroupCreate, db: Session = Depends(get_db)):
    db_group = Groups(**group.model_dump())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group


# Получение списка всех групп
@router.get("/groups", response_model=List[Group], summary="Получить список всех групп")
def get_groups(db: Session = Depends(get_db)):
    return db.query(Groups).all()

# Получение конкретной группы по ID
@router.get("/groups/{group_id}", response_model=Group, summary="Получить группу по ID")
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.get(Groups, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

# Обновление информации о группе
@router.put("/groups/{group_id}", response_model=Group, summary="Обновить данные группы по ID")
def update_group(group_id: int, group_update: GroupUpdate, db: Session = Depends(get_db)):
    group = db.get(Groups, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    # Обновляем только переданные поля
    for key, value in group_update.model_dump(exclude_unset=True).items():
        setattr(group, key, value)
    db.commit()
    db.refresh(group)
    return group

# Удаление группы по ID
@router.delete("/groups/{group_id}", summary="Удалить группу по ID")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.get(Groups, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"detail": "Группа успешно удалена"}

# Добавление пользователя в группу
@router.post("/groups/{group_id}/users/{user_id}", summary="Добавить пользователя в группу")
def add_user_to_group(group_id: int, user_id: int, db: Session = Depends(get_db)):
    group = db.get(Groups, group_id)
    user = db.get(Users, user_id)
    
    if not group or not user:
        raise HTTPException(status_code=404, detail="Group or User not found")
    
    user_group = UserGroups(user_id=user_id, group_id=group_id)
    db.add(user_group)
    db.commit()
    return {"detail": "User added to group successfully"}

# Удаление пользователя из группы
@router.delete("/groups/{group_id}/users/{user_id}", summary="Удалить пользователя из группы")
def remove_user_from_group(group_id: int, user_id: int, db: Session = Depends(get_db)):
    user_group = db.query(UserGroups).filter(
        UserGroups.group_id == group_id,
        UserGroups.user_id == user_id
    ).first()
    
    if not user_group:
        raise HTTPException(status_code=404, detail="User not found in group")
    
    db.delete(user_group)
    db.commit()
    return {"detail": "User removed from group successfully"}

# Получение всех пользователей группы
@router.get("/groups/{group_id}/users", response_model=List[GroupWithUserCount], summary="Получить пользователей группы по ID группы")
def get_group_users(group_id: int, db: Session = Depends(get_db)):
    group = db.get(Groups, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group.users

# Получение статистики по группе
@router.get("/groups/{group_id}/stats", summary="Получить статистику по группе")
def get_group_stats(group_id: int, db: Session = Depends(get_db)):
    group = db.get(Groups, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    total_users = len(group.users)
    total_tasks = db.query(Tasks).filter(Tasks.group_id == group_id).count()
    tasks_by_status = db.query(
        Tasks.status,
        func.count(Tasks.task_id)
    ).filter(Tasks.group_id == group_id).group_by(Tasks.status).all()
    
    return {
        "group_name": group.name,
        "total_users": total_users,
        "total_tasks": total_tasks,
        "tasks_by_status": dict(tasks_by_status)
    }

# Поиск групп по названию
@router.get("/groups/search", response_model=List[Group], summary="Поиск групп по названию")
def search_groups(query: str, db: Session = Depends(get_db)):
    return db.query(Groups).filter(Groups.name.ilike(f"%{query}%")).all()

# Получение групп пользователя
@router.get("/users/{user_id}/groups", response_model=List[Group], summary="Получить группы пользователя по ID пользователя")
def get_user_groups(user_id: int, db: Session = Depends(get_db)):
    user = db.get(Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.groups
'''
{
  "group_id": 2,
  "name": "Backend Developers",
  "description": "Группа backend",
  "created_at": "2025-05-04T15:30:00"
}
'''