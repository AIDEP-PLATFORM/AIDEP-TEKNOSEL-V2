import logging

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL_ASYNC, echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL baglantisi kuruldu.")
    except Exception as e:
        logger.error(f"PostgreSQL baglanti hatasi: {e}")
        raise


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
