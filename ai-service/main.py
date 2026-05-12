from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.redis import init_redis, close_redis
from core.mongodb import init_mongodb, close_mongodb
from core.minio_client import init_minio
from pipeline import startup as ai_startup
from routers.ai import router as ai_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    await init_mongodb()
    await init_minio()
    await ai_startup()
    yield
    await close_redis()
    await close_mongodb()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.PROJECT_NAME}
