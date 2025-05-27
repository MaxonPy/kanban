from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from fastapi.responses import FileResponse
import os
import json

from ..models import Tasks, Users, users_tasks_table
from ..db import get_db
from ..schemas.task import Task, TaskCreate, TaskUpdate, TaskResponse, TaskStatus, BulkTaskUpdate, TaskAssignment
from sqlalchemy import Table, Column, Integer, String, DateTime, ForeignKey
from .ws_notify import notify_students_about_task

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/tasks", response_model=TaskResponse, summary="Создать новую задачу")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    task_data = task.model_dump()
    # Устанавливаем дефолтные значения
    task_data["status"] = TaskStatus.TODO
    
    # Если group_id не указан, используем группу по умолчанию
    if not task_data.get("group_id"):
        task_data["group_id"] = 1
    
    # Если board_id не указан, используем доску по умолчанию
    if not task_data.get("board_id"):
        task_data["board_id"] = 1
    
    # Получаем ID исполнителя и назначившего
    user_id = task_data.pop("user_id")  # ID исполнителя (студента)
    assigner_id = task_data.pop("assigner_id", 1)  # ID назначившего (преподавателя)

    # сериализация assigned_files
    if "assigned_files" in task_data and task_data["assigned_files"] is not None:
        task_data["assigned_files"] = json.dumps(task_data["assigned_files"])

    # Создаем задачу
    db_task = Tasks(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Если указан исполнитель, добавляем запись в таблицу users_tasks
    if user_id is not None:
        stmt = users_tasks_table.insert().values(
            user_id=user_id,
            task_id=db_task.task_id,
            assigned_at=datetime.now()
        )
        db.execute(stmt)

    # Добавляем назначившего
    assigner = db.get(Users, assigner_id)
    if assigner:
        db_task.assigners.append(assigner)

    db.commit()
    db.refresh(db_task)

    # десериализация assigned_files для ответа
    assigned_files = json.loads(db_task.assigned_files) if db_task.assigned_files else []
    response = TaskResponse(
        **{**db_task.__dict__, "assigned_files": assigned_files},
        user_ids=[user_id] if user_id is not None else [],  # Добавляем ID исполнителя в ответ, если он есть
        assigner_id=assigner_id
    )
    return response

@router.get("/tasks", response_model=List[Task], summary="Получить список всех задач")
def get_tasks(group_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Tasks)
    if group_id:
        query = query.filter(Tasks.group_id == group_id)
    tasks = query.all()
    # десериализация assigned_files для каждого задания
    result = []
    for t in tasks:
        assigned_files = json.loads(t.assigned_files) if t.assigned_files else []
        result.append(Task(**{**t.__dict__, "assigned_files": assigned_files}))
    return result

@router.get("/tasks/{task_id}", response_model=Task, summary="Получить задачу по ID")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Tasks, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    assigned_files = json.loads(task.assigned_files) if task.assigned_files else []
    return Task(**{**task.__dict__, "assigned_files": assigned_files})

@router.patch("/tasks/{task_id}", response_model=Task, summary="Обновить задачу")
async def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Tasks).filter(Tasks.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task with ID {task_id} not found"
        )
    
    update_data = task_update.model_dump(exclude_unset=True)
    old_status = task.status
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    
    # Получаем всех пользователей, которым назначена задача
    user_ids = [user.user_id for user in task.users]
    # Оповещаем студентов и преподавателей (assigners)
    assigner_ids = [assigner.user_id for assigner in getattr(task, 'assigners', [])]
    notify_ids = set(user_ids + assigner_ids)
    
    # Отправляем уведомления всем заинтересованным пользователям
    for user_id in notify_ids:
        await notify_students_about_task({
            "event": "update_status",
            "user_id": user_id,
            "task_id": task_id,
            "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
            "old_status": old_status.value if hasattr(old_status, 'value') else str(old_status),
            "timestamp": int(datetime.now().timestamp() * 1000)
        })
    
    return task

@router.delete("/tasks/{task_id}", summary="Удалить задачу по ID")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    # Используем query вместо get для единообразия с другими методами
    task = db.query(Tasks).filter(Tasks.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task with ID {task_id} not found"
        )
    
    try:
        # Получаем всех пользователей, которым назначена задача
        user_ids = [user.user_id for user in task.users]
        
        # Удаляем задачу
        db.delete(task)
        db.commit()
        
        # Оповещаем студентов
        for user_id in user_ids:
            await notify_students_about_task({
                "event": "delete_task",
                "user_id": user_id,
                "task_id": task_id,
                "timestamp": int(datetime.now().timestamp() * 1000)
            })
        
        return {"detail": f"Task {task_id} deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting task: {str(e)}"
        )

@router.get("/tasks/status/{status}", response_model=List[Task], summary="Получить задачи по статусу")
def get_tasks_by_status(status: TaskStatus, db: Session = Depends(get_db)):
    return db.query(Tasks).filter(Tasks.status == status).all()

@router.get("/tasks/search", response_model=List[Task], summary="Поиск задач по названию")
def search_tasks(query: str, db: Session = Depends(get_db)):
    return db.query(Tasks).filter(Tasks.title.ilike(f"%{query}%")).all()

@router.get("/tasks/upcoming", response_model=List[Task], summary="Получить задачи с истекающим дедлайном")
def get_upcoming_tasks(days: int = 7, group_id: Optional[int] = None, db: Session = Depends(get_db)):
    today = datetime.now()
    deadline = today + timedelta(days=days)
    query = db.query(Tasks).filter(
        Tasks.deadline <= deadline,
        Tasks.status != TaskStatus.DONE
    )
    if group_id:
        query = query.filter(Tasks.group_id == group_id)
    return query.all()

@router.put("/tasks/bulk/status", summary="Массовое обновление статуса задач")
def bulk_update_task_status(update: BulkTaskUpdate, db: Session = Depends(get_db)):
    tasks = db.query(Tasks).filter(Tasks.task_id.in_(update.task_ids)).all()
    for task in tasks:
        task.status = update.status
    db.commit()
    return {"detail": f"Updated {len(tasks)} tasks to status {update.status}"}

@router.get("/tasks/priority/{priority}", response_model=List[Task], summary="Получить задачи по приоритету")
def get_tasks_by_priority(priority: str, group_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Tasks).filter(Tasks.priority == priority)
    if group_id:
        query = query.filter(Tasks.group_id == group_id)
    return query.all()

@router.get("/tasks/group/{group_id}", response_model=List[Task], summary="Получить задачи по группе")
def get_tasks_by_group(group_id: int, db: Session = Depends(get_db)):
    return db.query(Tasks).filter(Tasks.group_id == group_id).all()

@router.get("/tasks/stats", summary="Получить статистику по задачам")
def get_task_stats(db: Session = Depends(get_db)):
    total_tasks = db.query(Tasks).count()
    tasks_by_status = db.query(
        Tasks.status,
        func.count(Tasks.task_id)
    ).group_by(Tasks.status).all()
    
    return {
        "total_tasks": total_tasks,
        "tasks_by_status": dict(tasks_by_status)
    }

@router.post("/users_tasks", summary="Назначить задачу пользователю")
async def assign_task_to_user(assignment: TaskAssignment, db: Session = Depends(get_db)):
    # Проверяем существование пользователя
    user = db.get(Users, assignment.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверяем существование задачи
    task = db.get(Tasks, assignment.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем, не назначена ли уже задача этому пользователю
    existing_assignment = db.query(users_tasks_table).filter(
        users_tasks_table.c.user_id == assignment.user_id,
        users_tasks_table.c.task_id == assignment.task_id
    ).first()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Task already assigned to this user")
    
    # Добавляем запись в таблицу users_tasks
    stmt = users_tasks_table.insert().values(
        user_id=assignment.user_id,
        task_id=assignment.task_id,
        assigned_at=datetime.now()
    )
    db.execute(stmt)
    db.commit()
    
    await notify_students_about_task({
        "event": "new_task",
        "user_id": assignment.user_id,
        "task_id": assignment.task_id,
        "timestamp": int(datetime.now().timestamp() * 1000)  # ms
    })
    
    return {"detail": "Task assigned successfully"}

@router.delete("/users_tasks", summary="Отменить назначение задачи пользователю")
def remove_task_assignment(assignment: TaskAssignment, db: Session = Depends(get_db)):
    # Проверяем существование назначения
    existing_assignment = db.query(users_tasks_table).filter(
        users_tasks_table.c.user_id == assignment.user_id,
        users_tasks_table.c.task_id == assignment.task_id
    ).first()
    
    if not existing_assignment:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    # Удаляем запись из таблицы users_tasks
    stmt = users_tasks_table.delete().where(
        users_tasks_table.c.user_id == assignment.user_id,
        users_tasks_table.c.task_id == assignment.task_id
    )
    db.execute(stmt)
    db.commit()
    
    return {"detail": "Task assignment removed successfully"}

@router.get("/users_tasks/{user_id}", response_model=List[Task], summary="Получить все задачи пользователя")
def get_user_tasks(user_id: int, db: Session = Depends(get_db)):
    user = db.get(Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    tasks = db.query(Tasks).join(Tasks.users).filter(Users.user_id == user_id).all()
    result = []
    for t in tasks:
        assigned_files = json.loads(t.assigned_files) if t.assigned_files else []
        result.append(Task(**{**t.__dict__, "assigned_files": assigned_files}))
    return result

@router.get("/tasks/check/{task_id}", summary="Проверить существование задачи")
def check_task_exists(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Tasks).filter(Tasks.task_id == task_id).first()
    if not task:
        return {"exists": False, "detail": f"Task with ID {task_id} not found"}
    return {
        "exists": True,
        "task_id": task.task_id,
        "title": task.title,
        "status": task.status.value if hasattr(task.status, 'value') else str(task.status)
    }

@router.post("/upload-file", summary="Загрузить файл для задачи")
def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    # Возвращаем путь, который будет сохраняться в assigned_files
    return {"file_path": f"/uploads/{file.filename}"}

@router.get("/uploads/{filename}", summary="Скачать файл задачи")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename)

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