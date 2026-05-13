"""
photo_service.py

Hasar fotoğrafı yükleme ve YOLOv8 analizi servisi.

Akış:
  1. Fotoğraf AWS S3'e yüklenir  (damage-photos/<request_id>/<photo_id>.<ext>)
  2. AI service /ai/analyze-damage endpoint'i çağrılır (YOLOv8)
  3. Sonuç DB'ye kaydedilir (DamagePhoto)
  4. HelpRequest.area_damage_score güncellenir
     (birden fazla fotoğraf varsa ortalaması alınır)
"""
import logging
from uuid import uuid4

import httpx
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.s3 import get_s3_session
from models.photo import DamagePhoto
from models.request import HelpRequest
from models.user import User

logger = logging.getLogger(__name__)

# İzin verilen MIME türleri
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_FILE_SIZE = 10 * 1024 * 1024   # 10 MB
_S3_PREFIX = "damage-photos"


async def upload_damage_photo(
    db: AsyncSession,
    request_id,
    file: UploadFile,
    user: User,
    latitude: float | None = None,
    longitude: float | None = None,
) -> DamagePhoto:
    """
    Hasar fotoğrafını S3'e yükler, YOLOv8 ile analiz ettirir ve kaydeder.

    AI service erişilemezse fotoğraf yine de kaydedilir; damage_score None kalır.
    """
    # ── 1. Dosya doğrulama ──────────────────────────────────────
    content_type = file.content_type or ""
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Desteklenmeyen dosya türü: {content_type}. Kabul edilenler: JPEG, PNG, WEBP",
        )

    image_bytes = await file.read()
    if len(image_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Dosya boyutu 10 MB sınırını aşıyor",
        )

    # ── 2. HelpRequest varlık kontrolü ─────────────────────────
    result = await db.execute(
        select(HelpRequest).where(HelpRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Yardım talebi bulunamadı",
        )

    # ── 3. AWS S3'e yükle ──────────────────────────────────────
    photo_id = uuid4()
    ext = _ext_from_content_type(content_type)
    s3_key = f"{_S3_PREFIX}/{request_id}/{photo_id}{ext}"

    try:
        async with get_s3_session().client("s3") as s3:
            await s3.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=s3_key,
                Body=image_bytes,
                ContentType=content_type,
            )
        logger.info(f"Fotograf S3'e yuklendi: {s3_key}")
    except Exception as e:
        logger.error(f"S3 yukleme hatasi: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fotoğraf depolama servisi şu anda kullanılamıyor",
        )

    # ── 4. YOLOv8 analizi (AI service) ─────────────────────────
    damage_score: float | None = None
    damage_labels: dict | None = None

    try:
        form_data: dict[str, str] = {"report_id": str(request_id)}
        if latitude is not None:
            form_data["latitude"] = str(latitude)
        if longitude is not None:
            form_data["longitude"] = str(longitude)

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_URL}/ai/analyze-damage",
                data=form_data,
                files={"file": (file.filename or f"photo{ext}", image_bytes, content_type)},
            )
            resp.raise_for_status()
            ai_result = resp.json()

        damage_score = float(ai_result.get("damage_score", 0.0))
        # AI service detections listesi veya labels sözlüğü dönebilir
        damage_labels = ai_result.get("detections") or ai_result.get("labels")
        logger.info(f"YOLOv8 analiz tamamlandi: request={request_id} score={damage_score:.3f}")

    except Exception as e:
        logger.warning(f"AI service analiz hatasi (fotograf kaydedildi, skor bos): {e}")

    # ── 5. DamagePhoto kaydı ───────────────────────────────────
    photo = DamagePhoto(
        id=photo_id,
        request_id=request_id,
        uploaded_by=user.id,
        minio_key=s3_key,          # alan adı minio_key ama S3 key tutuyor
        original_filename=file.filename,
        damage_score=damage_score,
        damage_labels=damage_labels,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(photo)

    # ── 6. HelpRequest.area_damage_score güncelle ──────────────
    if damage_score is not None:
        await _update_request_damage_score(db, req)

    await db.commit()
    await db.refresh(photo)
    return photo


async def _update_request_damage_score(db: AsyncSession, req: HelpRequest) -> None:
    """
    Talebin tüm onaylı fotoğraflarının damage_score ortalamasını hesaplar.
    Yeni fotoğraf henüz commit edilmediği için önce flush yapılır.
    """
    await db.flush()

    result = await db.execute(
        select(DamagePhoto.damage_score).where(
            DamagePhoto.request_id == req.id,
            DamagePhoto.damage_score.is_not(None),
        )
    )
    scores = [row[0] for row in result.all()]
    if scores:
        req.area_damage_score = sum(scores) / len(scores)
        logger.info(
            f"area_damage_score guncellendi: request={req.id} "
            f"avg={req.area_damage_score:.3f} ({len(scores)} fotograf)"
        )


def _ext_from_content_type(content_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(content_type, ".jpg")
