from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from .routers import user, task, board, group
from .db import engine
from .models import Base
from .routers.ws_notify import get_ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создание таблиц при запуске приложения
    Base.metadata.create_all(bind=engine)
    yield
    # Очистка ресурсов при завершении работы приложения
    engine.dispose()

app = FastAPI(lifespan=lifespan)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Kanban API",
        version="1.0.0",
        description="API для управления канбан-досками",
        routes=app.routes,
    )

    paths = dict(sorted(openapi_schema["paths"].items()))
    openapi_schema["paths"] = paths

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Настройка CORS для поддержки WebSocket
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Добавляем конкретные origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры с тегами
app.include_router(user.router, tags=["users"])
app.include_router(task.router, tags=["tasks"])
app.include_router(board.router, tags=["boards"])
app.include_router(group.router, tags=["groups"])
app.include_router(get_ws_router(), tags=["websocket"])
