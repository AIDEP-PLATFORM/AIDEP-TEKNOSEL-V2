import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from core.config import settings
from core.database import init_db
from core.redis import init_redis, close_redis
from core.minio import init_minio
from core.s3 import init_s3
from core.logging import setup_logging
from routers import auth, ngo

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


app.include_router(auth.router)
app.include_router(ngo.router)


# ─── Middleware: istek/yanıt süresi logu ───────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response


# ─── Global hata yakalayıcı ────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Yakalanmamis hata: {type(exc).__name__}: {exc} | "
        f"{request.method} {request.url.path}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucu hatası. Lütfen tekrar deneyin."},
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
