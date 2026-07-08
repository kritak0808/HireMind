import json
import logging
from typing import Any, Callable, Optional

import redis.asyncio as aioredis
from config import settings

logger = logging.getLogger("hiremind.caching")

class RedisCachingPlatform:
    """
    Enterprise Redis caching platform supporting read-through/write-through caching,
    TTL policies, hit/miss metrics, and graceful fail-silent fallback.
    """
    _redis_client: Optional[aioredis.Redis] = None
    _hits = 0
    _misses = 0

    @classmethod
    def get_client(cls) -> Optional[aioredis.Redis]:
        if cls._redis_client is None:
            try:
                cls._redis_client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2.0,
                    socket_timeout=2.0
                )
                logger.info("Successfully initialized Redis caching client.")
            except Exception as e:
                logger.error(f"Failed to initialize Redis: {str(e)}. Caching disabled.")
                cls._redis_client = None
        return cls._redis_client

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        client = cls.get_client()
        if not client:
            cls._misses += 1
            return None
        try:
            val = await client.get(key)
            if val is not None:
                cls._hits += 1
                return json.loads(val)
            cls._misses += 1
            return None
        except Exception as e:
            logger.warning(f"Redis cache GET error for {key}: {str(e)}")
            cls._misses += 1
            return None

    @classmethod
    async def set(cls, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        client = cls.get_client()
        if not client:
            return False
        try:
            val_str = json.dumps(value)
            await client.set(key, val_str, ex=ttl_seconds)
            return True
        except Exception as e:
            logger.warning(f"Redis cache SET error for {key}: {str(e)}")
            return False

    @classmethod
    async def delete(cls, key: str) -> bool:
        client = cls.get_client()
        if not client:
            return False
        try:
            await client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis cache DELETE error for {key}: {str(e)}")
            return False

    @classmethod
    async def invalidate_pattern(cls, pattern: str) -> int:
        client = cls.get_client()
        if not client:
            return 0
        try:
            keys = await client.keys(pattern)
            if keys:
                await client.delete(*keys)
                return len(keys)
            return 0
        except Exception as e:
            logger.warning(f"Redis cache invalidate pattern {pattern} error: {str(e)}")
            return 0

    @classmethod
    async def read_through(cls, key: str, loader_fn: Callable[[], Any], ttl_seconds: int = 3600) -> Any:
        cached = await cls.get(key)
        if cached is not None:
            return cached
        val = await loader_fn()
        await cls.set(key, val, ttl_seconds)
        return val

    @classmethod
    async def write_through(cls, key: str, value: Any, writer_fn: Callable[[], Any], ttl_seconds: int = 3600) -> Any:
        await cls.set(key, value, ttl_seconds)
        return await writer_fn()

    @classmethod
    def get_metrics(cls) -> dict:
        total = cls._hits + cls._misses
        hit_rate = cls._hits / total if total > 0 else 0.0
        return {
            "hits": cls._hits,
            "misses": cls._misses,
            "total_calls": total,
            "hit_rate": hit_rate
        }

    @classmethod
    def reset_metrics(cls) -> None:
        cls._hits = 0
        cls._misses = 0
