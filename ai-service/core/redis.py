import logging
import redis.asyncio as aioredis

from core.config import settings

logger = logging.getLogger(__name__)

redis_client: aioredis.Redis | None = None


async def init_redis() -> None:
    global redis_client
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis baglantisi kuruldu.")
    except Exception as exc:
        logger.error("Redis baglanti hatasi: %s", exc)
        raise


async def close_redis() -> None:
    if redis_client:
        await redis_client.aclose()


def get_redis() -> aioredis.Redis:
    if redis_client is None:
        raise RuntimeError("Redis başlatılmamış — init_redis() çağrılmadı")
    return redis_client
