import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Union

import redis.asyncio as aioredis
from config import settings
from pydantic import BaseModel, Field

logger = logging.getLogger("hiremind.events")

# 1. Base Event Schema
class BaseEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    tenant_id: Union[str, uuid.UUID]
    correlation_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: Dict[str, Any] = Field(default_factory=dict)


# 2. Abstract Event Bus Interface
class EventBus:
    async def publish(self, event: BaseEvent) -> None:
        raise NotImplementedError

    async def subscribe(self, event_type: str, handler: Callable[[BaseEvent], Any]) -> None:
        raise NotImplementedError

# 3. Redis-Based Pub/Sub Implementation
class RedisEventBus(EventBus):
    def __init__(self, redis_url: str = settings.REDIS_URL) -> None:
        self._redis_url = redis_url
        self.redis_client = None
        self.pubsub = None
        try:
            self.redis_client = aioredis.from_url(redis_url, decode_responses=True)
            self.pubsub = self.redis_client.pubsub()
        except Exception as e:
            logger.warning(f"Redis client initialization failed (Redis may be unavailable): {str(e)}")

    async def publish(self, event: BaseEvent) -> None:
        """Publishes an event packet onto the corresponding event channel.
        
        Failures are non-fatal: if Redis is unavailable (e.g. local dev without Redis),
        the error is logged as a warning and execution continues normally.
        """
        if self.redis_client is None:
            logger.warning(f"Redis unavailable — skipping event publish: {event.event_type}")
            return
        channel = f"event:{event.event_type}"
        data = event.model_dump_json()
        try:
            await self.redis_client.publish(channel, data)
            logger.info(f"Event published: {event.event_type} (ID: {event.event_id}) on channel {channel}")
        except Exception as e:
            logger.warning(f"Event bus unavailable — event not published ({event.event_type}): {str(e)}")

    async def subscribe(self, event_type: str, handler: Callable[[BaseEvent], Any]) -> None:
        """Subscribes an execution function to a target event channel."""
        if self.pubsub is None:
            logger.warning(f"Redis unavailable — skipping subscribe to: {event_type}")
            return
        channel = f"event:{event_type}"
        await self.pubsub.subscribe(**{channel: self._wrap_handler(handler)})
        logger.info(f"Registered subscriber to channel: {channel}")

    def _wrap_handler(self, handler: Callable[[BaseEvent], Any]) -> Callable[[Any], Any]:
        async def message_wrapper(message: Dict[str, Any]) -> None:
            if message["type"] != "message":
                return
            try:
                raw_data = json.loads(message["data"])
                event = BaseEvent(**raw_data)
                await handler(event)
            except Exception as e:
                logger.error(f"Event handler execution failure: {str(e)}")
        return message_wrapper

    async def start_listening_loop(self) -> None:
        """Runs the background reading loop waiting for messages.
        Exits gracefully if Redis becomes unavailable — does NOT crash the process.
        """
        if self.pubsub is None:
            logger.warning("Redis PubSub unavailable — event listener loop will not start.")
            return
        logger.info("Starting Redis event subscriber loop...")
        try:
            while True:
                await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.warning(f"Redis PubSub loop exited (Redis may be unavailable): {str(e)}")

