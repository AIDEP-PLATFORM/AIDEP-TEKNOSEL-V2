import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

from core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


async def init_mongodb() -> None:
    global _client
    try:
        _client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        await _client.admin.command("ping")
        logger.info("MongoDB baglantisi kuruldu: %s", settings.MONGODB_DB)
    except Exception as exc:
        logger.error("MongoDB baglanti hatasi: %s — kayit devre disi", exc)
        _client = None


async def close_mongodb() -> None:
    if _client:
        _client.close()


def get_collection(name: str) -> AsyncIOMotorCollection | None:
    if _client is None:
        return None
    return _client[settings.MONGODB_DB][name]
