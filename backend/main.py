from fastapi import FastAPI
from routers import user, task, board, group
from db import engine
import models
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="Custom order of endpoints",
        routes=app.routes,
    )

    paths = dict(sorted(openapi_schema["paths"].items()))  # Сортировка по пути
    openapi_schema["paths"] = paths

    app.openapi_schema = openapi_schema
    return app.openapi_schema
app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешить запросы с любых источников (можно указать конкретные домены)
    allow_credentials=True,
    allow_methods=["*"],  # Разрешить все методы (GET, POST, PUT, DELETE и т.д.)
    allow_headers=["*"],  # Разрешить все заголовки
)

app.include_router(user.router)
app.include_router(task.router)
app.include_router(board.router)
app.include_router(group.router)

# Создание таблиц при запуске приложения
@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=engine)
