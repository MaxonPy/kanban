from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
active_connections: List[WebSocket] = []

@router.websocket("/ws/tasks")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        active_connections.append(websocket)
        logger.info(f"New WebSocket connection established. Total connections: {len(active_connections)}")
        
        while True:
            try:
                data = await websocket.receive_text()
                logger.debug(f"Received message: {data}")
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket connection: {str(e)}")
                break
    except Exception as e:
        logger.error(f"Error accepting WebSocket connection: {str(e)}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
            logger.info(f"WebSocket connection removed. Total connections: {len(active_connections)}")

def get_ws_connections():
    return active_connections

def get_ws_router():
    return router

async def notify_students_about_task(task_data: dict):
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_json(task_data)
            logger.debug(f"Notification sent to client: {task_data}")
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            disconnected.append(connection)
    
    # Удаляем отключенные соединения
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)
            logger.info(f"Removed disconnected client. Total connections: {len(active_connections)}") 