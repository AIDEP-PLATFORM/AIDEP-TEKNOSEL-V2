import logging
import aioboto3
from botocore.exceptions import ClientError

from core.config import settings

logger = logging.getLogger(__name__)

session = aioboto3.Session(
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_S3_REGION,
)


async def init_s3():
    try:
        async with session.client("s3") as s3:
            await s3.head_bucket(Bucket=settings.AWS_S3_BUCKET)
        logger.info("AWS S3 baglantisi kuruldu.")
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "404":
            logger.error(f"S3 bucket bulunamadi: {settings.AWS_S3_BUCKET}")
        elif code == "403":
            logger.error("S3 bucket erisim izni reddedildi.")
        else:
            logger.error(f"S3 baglanti hatasi: {e}")
        raise


def get_s3_session() -> aioboto3.Session:
    return session
