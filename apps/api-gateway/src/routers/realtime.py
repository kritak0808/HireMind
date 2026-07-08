import asyncio
import logging
from typing import Dict, List

import path_setup  # noqa: F401
from events import BaseEvent, RedisEventBus
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("hiremind.api.realtime")
router = APIRouter(prefix="/realtime", tags=["Enterprise Realtime Engine"])


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Maps user_id -> status ('online', 'idle')
        self.presence_status: Dict[str, str] = {}
        # Maps room_id -> list of typing usernames
        self.typing_users: Dict[str, List[str]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.presence_status[user_id] = "online"
        await self.broadcast_presence()

    async def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.presence_status[user_id] = "offline"
        await self.broadcast_presence()

    async def broadcast(self, message: dict):
        for user_id, connections in list(self.active_connections.items()):
            for connection in list(connections):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_presence(self):
        await self.broadcast({
            "type": "presence_update",
            "statuses": self.presence_status
        })

    async def set_typing(self, room_id: str, username: str, is_typing: bool):
        if room_id not in self.typing_users:
            self.typing_users[room_id] = []
        
        if is_typing:
            if username not in self.typing_users[room_id]:
                self.typing_users[room_id].append(username)
        else:
            if username in self.typing_users[room_id]:
                self.typing_users[room_id].remove(username)
                
        await self.broadcast({
            "type": "typing_update",
            "room_id": room_id,
            "typing_users": self.typing_users[room_id]
        })


manager = ConnectionManager()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Handle client-sent actions
            data = await websocket.receive_json()
            event_type = data.get("type")
            
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif event_type == "typing":
                room_id = data.get("room_id")
                username = data.get("username", f"User_{user_id[:4]}")
                is_typing = data.get("is_typing", False)
                await manager.set_typing(room_id, username, is_typing)
                
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)


async def listen_to_redis_events():
    logger.info("Initializing Redis Pub/Sub event synchronization loop...")
    event_bus = RedisEventBus()
    
    async def handler(event: BaseEvent):
        # Broadcast incoming events live to connected recruiter sockets
        await manager.broadcast({
            "type": "event_stream",
            "event_type": event.event_type,
            "payload": event.payload
        })
        
    try:
        await event_bus.subscribe("comment_added", handler)
        await event_bus.subscribe("stage_changed", handler)
        await event_bus.subscribe("candidate_applied", handler)
        await event_bus.subscribe("interview_scheduled", handler)
        
        # Spawn listening event loop in background task
        asyncio.create_task(event_bus.start_listening_loop())
    except Exception as e:
        logger.warning(f"Redis PubSub listener registration failed: {str(e)}")
