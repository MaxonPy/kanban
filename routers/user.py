from typing import Annotated, List
from fastapi import APIRouter, HTTPException, Query
import models
from db import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from schemas.board import BoardBase
from schemas.task import Task
from schemas.user import User, UserUpdate

router = APIRouter()

# Создание пользователя в БД 
@router.post("/users", response_model=User, summary="Создать нового пользователя")
def create_user(user: Annotated[User, Depends()], db: Session = Depends(get_db)):
    db_user = models.Users(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Получение задач по ID пользователя
@router.get("/users/{user_id}/tasks", response_model=List[Task], summary="Получить задачи пользователя по ID")
def get_tasks_for_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.tasks

# Получить всех пользователей
@router.get("/users", response_model=List[User], summary="Получить всех пользователей")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.Users).all()

# Получить всех пользователей
@router.get("/users/{user_id}", response_model=User, summary="Получить пользователя по ID")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Получение досок пользователя
@router.get("/users/{user_id}/boards", response_model=List[BoardBase], summary="Получить доски пользователя по ID")
def get_user_boards(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.KanbanBoards).filter(models.KanbanBoards.user_id == user_id).all()

# Обновление пользователя
@router.put("/users/{user_id}", response_model=User, summary="Обновить данные пользователя")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(models.Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

# Удаление пользователя
@router.delete("/users/{user_id}", summary="Удалить пользователя по ID")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.Mo)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}

# Получение статистики пользователя
@router.get("/users/{user_id}/stats", summary="Получить статистику пользователя")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_tasks = len(user.tasks)
    tasks_by_status = db.query(
        models.Tasks.status,
        func.count(models.Tasks.task_id)
    ).join(models.users_tasks_table).filter(
        models.users_tasks_table.c.user_id == user_id
    ).group_by(models.Tasks.status).all()
    
    total_boards = db.query(models.KanbanBoards).filter(
        models.KanbanBoards.user_id == user_id
    ).count()
    
    return {
        "user_name": user.name,
        "total_tasks": total_tasks,
        "tasks_by_status": dict(tasks_by_status),
        "total_boards": total_boards
    }

# Поиск пользователей по имени
@router.get("/users/search", response_model=List[User], summary="Поиск пользователей по имени")
def search_users(query: str, db: Session = Depends(get_db)):
    return db.query(models.Users).filter(models.Users.name.ilike(f"%{query}%")).all()

# Получение пользователей по роли
@router.get("/users/role/{role}", response_model=List[User], summary="Получить пользователей по роли")
def get_users_by_role(role: str, db: Session = Depends(get_db)):
    return db.query(models.Users).filter(models.Users.role == role).all()

# Получение активных пользователей
@router.get("/users/active", response_model=List[User], summary="Получить активных пользователей за последние дни")
def get_active_users(days: int = 30, db: Session = Depends(get_db)):
    cutoff_date = datetime.now() - timedelta(days=30)
    return db.query(models.Users).join(
        models.users_tasks_table
    ).join(
        models.Tasks
    ).filter(
        models.Tasks.updated_at >= cutoff_date
    ).distinct().all()

# Получение пользователей с наибольшим количеством задач
@router.get("/users/most-tasks", response_model=List[User], summary="Получить пользователей с наибольшим количеством задач")
def get_users_with_most_tasks(limit: int = 5, db: Session = Depends(get_db)):
    return db.query(
        models.Users,
        func.count(models.users_tasks_table.c.task_id).label('task_count')
    ).join(
        models.users_tasks_table
    ).group_by(
        models.Users.user_id
    ).order_by(
        func.count(models.users_tasks_table.c.task_id).desc()
    ).limit(limit).all()

'''
{
    "user_id": 2,
    "telegram_id": 1234234,
    "name": "Maxim Kiyaev",
    "role": "student",
    "email": "ivan.petrova@example.com",
    "created_at": "2025-05-03T12:34:56"
}
'''


