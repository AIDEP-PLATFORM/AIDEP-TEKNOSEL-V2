import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from core.database import init_db
from core.redis import init_redis, close_redis
from core.minio import init_minio
from core.s3 import init_s3
from core.logging import setup_logging

setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AIDEP backend baslatiliyor...")
    await init_db()
    await init_redis()
    await init_minio()
    await init_s3()
    logger.info("Tum servisler hazir.")
    yield
    await close_redis()
    logger.info("AIDEP backend kapatildi.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
