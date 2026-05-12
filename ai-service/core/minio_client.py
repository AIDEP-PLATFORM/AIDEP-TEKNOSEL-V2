import asyncio
import logging
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from core.config import settings

logger = logging.getLogger(__name__)

_client: Minio | None = None

WEIGHTS_DIR = Path("/app/weights")


def get_minio() -> Minio | None:
    return _client


async def init_minio() -> None:
    global _client
    try:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        # bucket yoksa oluştur
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _ensure_bucket)
        logger.info("MinIO bağlantısı kuruldu: %s / %s", settings.MINIO_ENDPOINT, settings.MINIO_BUCKET_MODELS)
    except Exception as exc:
        logger.error("MinIO bağlantı hatası: %s — model yüklemesi yerel fallback'e geçer", exc)
        _client = None


def _ensure_bucket() -> None:
    if _client is None:
        raise RuntimeError("MinIO client başlatılmadan bucket oluşturulamaz")
    bucket = settings.MINIO_BUCKET_MODELS
    if not _client.bucket_exists(bucket):
        _client.make_bucket(bucket)
        logger.info("MinIO bucket oluşturuldu: %s", bucket)


async def download_model(object_name: str, local_path: Path) -> bool:
    """MinIO'dan modeli indir. Başarılıysa True döner."""
    if _client is None:
        return False
    try:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            lambda: _client.fget_object(settings.MINIO_BUCKET_MODELS, object_name, str(local_path)),
        )
        size_mb = local_path.stat().st_size / (1024 * 1024)
        logger.info("MinIO'dan indirildi: %s → %s (%.1f MB)", object_name, local_path, size_mb)
        return True
    except S3Error as exc:
        if exc.code == "NoSuchKey":
            logger.warning("MinIO'da model bulunamadı: %s/%s", settings.MINIO_BUCKET_MODELS, object_name)
        else:
            logger.error("MinIO indirme hatası [%s]: %s", object_name, exc)
        return False
    except Exception as exc:
        logger.error("MinIO indirme hatası [%s]: %s", object_name, exc)
        return False


async def upload_model(local_path: Path, object_name: str) -> bool:
    """Yerel model dosyasını MinIO'ya yükle."""
    if _client is None:
        return False
    if not local_path.exists():
        logger.error("Yüklenecek dosya bulunamadı: %s", local_path)
        return False
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            lambda: _client.fput_object(settings.MINIO_BUCKET_MODELS, object_name, str(local_path)),
        )
        logger.info("MinIO'ya yüklendi: %s → %s/%s", local_path, settings.MINIO_BUCKET_MODELS, object_name)
        return True
    except Exception as exc:
        logger.error("MinIO yükleme hatası [%s]: %s", object_name, exc)
        return False
