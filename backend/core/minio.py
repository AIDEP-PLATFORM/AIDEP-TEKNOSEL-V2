import logging
from miniopy_async import Minio

from core.config import settings

logger = logging.getLogger(__name__)

minio_client: Minio | None = None


async def init_minio():
    global minio_client
    try:
        minio_client = Minio(
            settings.MINIO_URL.replace("http://", ""),
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=False,
        )
        exists = await minio_client.bucket_exists(settings.MINIO_BUCKET_DATASETS)
        if not exists:
            await minio_client.make_bucket(settings.MINIO_BUCKET_DATASETS)
            logger.info(f"MinIO bucket olusturuldu: {settings.MINIO_BUCKET_DATASETS}")
        logger.info("MinIO baglantisi kuruldu.")
    except Exception as e:
        logger.error(f"MinIO baglanti hatasi: {e}")
        raise


def get_minio() -> Minio:
    return minio_client
