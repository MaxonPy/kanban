from typing import Annotated, List
from fastapi import APIRouter, HTTPException, Query
import models
from db import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from schemas.board import BoardBase, BoardUpdate, KanbanBoards
from schemas.task import Task


router = APIRouter()


@router.get("/boards/{board_id}/tasks", response_model=List[Task], summary="Получить задачи по ID доски")
def get_tasks(board_id: int, db: Session = Depends(get_db)):
    tasks = db.query(models.Tasks).filter(models.Tasks.board_id == board_id).all()
    return tasks

#Создание канбан доски в БД 
@router.post("/boards", response_model=BoardBase, summary="Создать новую доску")
def create_board(board: Annotated[BoardBase, Depends()], db: Session = Depends(get_db)):
    db_board = models.KanbanBoards(**board.model_dump())
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board

# Получение списка всех досок
@router.get("/boards", response_model=List[KanbanBoards], summary="Получить список всех досок")
def get_boards(db: Session = Depends(get_db)):
    return db.query(models.KanbanBoards).all()

# Получение доски по ID
@router.get("/boards/{board_id}", response_model=KanbanBoards, summary="Получить доску по ID")
def get_board(board_id: int, db: Session = Depends(get_db)):
    board = db.get(models.KanbanBoards, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

# Обновление информации о доске
@router.put("/boards/{board_id}", response_model=KanbanBoards, summary="Обновить данные доски по ID")
def update_board(board_id: int, board_update: BoardUpdate, db: Session = Depends(get_db)):
    board = db.get(models.KanbanBoards, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    # Обновляем только переданные поля
    for key, value in board_update.model_dump(exclude_unset=True).items():
        setattr(board, key, value)
    db.commit()
    db.refresh(board)
    return board

# Удаление доски по ID
@router.delete("/boards/{board_id}", summary="Удалить доску по ID")
def delete_board(board_id: int, db: Session = Depends(get_db)):
    board = db.get(models.KanbanBoards, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(board)
    db.commit()
    return {"detail": "Доска успешно удалена"}



# Поиск досок по названию
@router.get("/boards/search/by-name", response_model=List[BoardBase], summary="Поиск досок по названию")
def search_boards(query: Annotated[str, Query(..., description="Search query")], db: Session = Depends(get_db)):
    """Поиск досок по названию"""
    return db.query(models.KanbanBoards).filter(models.KanbanBoards.name.ilike(f"%{query}%")).all()

# Получение статистики по доске
@router.get("/boards/{board_id}/stats", summary="Получить статистику по доске")
def get_board_stats(board_id: int, db: Session = Depends(get_db)):
    board = db.get(models.KanbanBoards, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    total_tasks = db.query(models.Tasks).filter(models.Tasks.board_id == board_id).count()
    tasks_by_status = db.query(
        models.Tasks.status,
        func.count(models.Tasks.task_id)
    ).filter(models.Tasks.board_id == board_id).group_by(models.Tasks.status).all()
    
    return {
        "board_name": board.name,
        "total_tasks": total_tasks,
        "tasks_by_status": dict(tasks_by_status)
    }

# Получение недавно созданных досок
# @router.get("/boards/recent", response_model=List[BoardBase])
# def get_recent_boards(days: int = 7, db: Session = Depends(get_db)):
#     cutoff_date = datetime.now() - timedelta(days=days)
#     return db.query(models.KanbanBoards).filter(
#         models.KanbanBoards.created_at >= cutoff_date
#     ).order_by(models.KanbanBoards.created_at.desc()).all()

# # Получение досок с наибольшим количеством задач
# @router.get("/boards/most-active", response_model=List[BoardBase])
# def get_most_active_boards(limit: int = 5, db: Session = Depends(get_db)):
#     return db.query(
#         models.KanbanBoards,
#         func.count(models.Tasks.task_id).label('task_count')
#     ).join(models.Tasks).group_by(models.KanbanBoards.board_id).order_by(
#         func.count(models.Tasks.task_id).desc()
#     ).limit(limit).all()

'''
{
  "board_id": 1,
  "user_id": 2,
  "name": "Учебная доска",
  "created_at": "2025-05-03T14:30:00"
}
'''
