from typing import Annotated, List, Optional
from fastapi import APIRouter, HTTPException, Query
import models
from db import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func

from schemas.task import Task, TaskBase, TaskResponse

router = APIRouter()



#Создание новой задачи
@router.post("/tasks", response_model=TaskResponse, summary="Создать новую задачу")
def create_task(task: TaskBase, db: Session = Depends(get_db)):
    task_data = task.model_dump()
    user_ids = task_data.pop("user_ids")
    db_task = models.Tasks(**task_data)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    for user_id in user_ids:
        user = db.get(models.Users, user_id)
        if user:
            db_task.users.append(user)

    db.commit()
    db.refresh(db_task)

    # вручную добавляем user_ids в ответ
    response = TaskResponse(
        **db_task.__dict__,
        user_ids=[user.user_id for user in db_task.users]
    )
    return response

@router.get("/tasks", response_model=List[Task], summary="Получить список всех задач")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Tasks).all()

# Чтение 1 задачи по ID
@router.get("/tasks/{task_id}", response_model=Task, summary="Получить задачу по ID")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(models.Tasks, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# Обновление задачи в БД
@router.put("/tasks/{task_id}", response_model=Task, summary="Обновить задачу по ID")
def update_task(task_id: int, task: Annotated[TaskBase, Depends()], db: Session = Depends(get_db)):
    db_task = db.query(models.Tasks).filter(models.Tasks.task_id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task.model_dump():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task


# Удаление задачи
@router.delete("/tasks/{task_id}", summary="Удалить задачу по ID")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(models.Tasks, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted successfully"}

# Фильтрация задач по статусу
@router.get("/tasks/status/{status}", response_model=List[Task], summary="Получить задачи по статусу")
def get_tasks_by_status(status: str, db: Session = Depends(get_db)):
    return db.query(models.Tasks).filter(models.Tasks.status == status).all()

# Поиск задач по названию
@router.get("/tasks/search", response_model=List[Task], summary="Поиск задач по названию")
def search_tasks(query: str, db: Session = Depends(get_db)):
    return db.query(models.Tasks).filter(models.Tasks.title.ilike(f"%{query}%")).all()

# Получение задач с истекающим дедлайном
@router.get("/tasks/upcoming", response_model=List[Task], summary="Получить задачи с истекающим дедлайном")
def get_upcoming_tasks(days: int = 7, db: Session = Depends(get_db)):
    today = datetime.now()
    deadline = today + timedelta(days=days)
    return db.query(models.Tasks).filter(
        models.Tasks.deadline <= deadline,
        models.Tasks.status != "done"
    ).all()

# Массовое обновление статуса задач
@router.put("/tasks/bulk/status", summary="Массовое обновление статуса задач")
def bulk_update_task_status(task_ids: List[int], new_status: str, db: Session = Depends(get_db)):
    tasks = db.query(models.Tasks).filter(models.Tasks.task_id.in_(task_ids)).all()
    for task in tasks:
        task.status = new_status
    db.commit()
    return {"detail": f"Updated {len(tasks)} tasks to status {new_status}"}

# Получение задач по приоритету
@router.get("/tasks/priority/{priority}", response_model=List[Task], summary="Получить задачи по приоритету")
def get_tasks_by_priority(priority: int, db: Session = Depends(get_db)):
    return db.query(models.Tasks).filter(models.Tasks.priority == priority).all()

# Получение задач по группе
@router.get("/tasks/group/{group_id}", response_model=List[Task], summary="Получить задачи по группе")
def get_tasks_by_group(group_id: int, db: Session = Depends(get_db)):
    return db.query(models.Tasks).filter(models.Tasks.group_id == group_id).all()

# Получение статистики по задачам
@router.get("/tasks/stats", summary="Получить статистику по задачам")
def get_task_stats(db: Session = Depends(get_db)):
    total_tasks = db.query(models.Tasks).count()
    tasks_by_status = db.query(
        models.Tasks.status,
        func.count(models.Tasks.task_id)
    ).group_by(models.Tasks.status).all()
    
    return {
        "total_tasks": total_tasks,
        "tasks_by_status": dict(tasks_by_status)
    }

'''
{
   "title": "Updated task title",
    "description": "Updated description",
    "deadline": "2025-05-10T15:00:00",
    "status": "in_progress",
    "assigned_files": 3,
    "priority": 2,
    "group_id": 5,
    "board_id": 2
}
'''