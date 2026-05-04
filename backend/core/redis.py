import logging
import redis.asyncio as aioredis

from core.config import settings

logger = logging.getLogger(__name__)

redis_client: aioredis.Redis | None = None


async def init_redis():
    global redis_client
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis baglantisi kuruldu.")
    except Exception as e:
        logger.error(f"Redis baglanti hatasi: {e}")
        raise


async def close_redis():
    if redis_client:
        await redis_client.aclose()


def get_redis() -> aioredis.Redis:
    return redis_client
