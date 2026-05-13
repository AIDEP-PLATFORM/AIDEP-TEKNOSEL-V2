from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.redis import init_redis, close_redis, get_redis
from core.mongodb import init_mongodb, close_mongodb, get_collection
from core.minio_client import init_minio
from pipeline import startup as ai_startup
import pipeline as ai_pipeline
from routers.ai import router as ai_router
from services.matching import close_http_client

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
    await close_http_client()


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
    redis_ok = False
    mongo_ok = False

    try:
        await get_redis().ping()
        redis_ok = True
    except Exception:
        pass

    try:
        col = get_collection("_health")
        if col is not None:
            await col.database.client.admin.command("ping")
            mongo_ok = True
    except Exception:
        pass

    model_status = ai_pipeline.status()

    return {
        "status": "ok" if (redis_ok and mongo_ok) else "degraded",
        "service": settings.PROJECT_NAME,
        "redis": redis_ok,
        "mongodb": mongo_ok,
        "models": model_status,
    }
