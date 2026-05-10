"""
/ai/* — AI Pipeline Endpoint'leri (internal, auth yok)

POST /ai/analyze-damage    Adım 1: Fotoğraf → hasar tespiti
POST /ai/score-request     Adım 2: Talep → öncelik skoru
POST /ai/score-requests    Adım 2: Toplu önceliklendirme
POST /ai/match             Adım 3: Enhanced Greedy eşleştirme
GET  /ai/damage-map        Hasar haritası (grid hücreleri)
GET  /ai/status            Model durum kontrolü
"""
import logging
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

import pipeline as ai_pipeline
from pipeline import (
    run_damage_detection,
    run_priority_scoring,
    run_bulk_priority_scoring,
    run_matching,
    get_live_damage_map,
)
from schemas.damage import DamageDetectionResponse, DamageMapCell
from schemas.priority import (
    PriorityRequest,
    PriorityResponse,
    MatchPayload,
    MatchResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Pipeline"])


@router.post(
    "/analyze-damage",
    response_model=DamageDetectionResponse,
    summary="Fotoğraf yükle → YOLOv8m hasar tespiti",
)
async def analyze_damage(
    file: UploadFile = File(..., description="Hasar fotoğrafı (JPEG/PNG)"),
    latitude: float  = Form(..., ge=-90,  le=90),
    longitude: float = Form(..., ge=-180, le=180),
    report_id: UUID | None = Form(None),
) -> DamageDetectionResponse:
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Sadece JPEG, PNG veya WebP dosyası kabul edilir",
        )

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Dosya boyutu 10 MB'ı aşamaz",
        )

    return await run_damage_detection(image_bytes, latitude, longitude, report_id)


@router.post(
    "/score-request",
    response_model=PriorityResponse,
    summary="Tek talebi XGBoost ile önceliklendir",
)
async def score_request(req: PriorityRequest) -> PriorityResponse:
    return await run_priority_scoring(req)


@router.post(
    "/score-requests",
    response_model=list[PriorityResponse],
    summary="Toplu talep önceliklendirme (öncelik sırasına göre sıralı)",
)
async def score_requests_bulk(requests: list[PriorityRequest]) -> list[PriorityResponse]:
    if len(requests) > 500:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tek seferde en fazla 500 talep gönderilebilir",
        )
    return await run_bulk_priority_scoring(requests)


@router.post(
    "/match",
    response_model=MatchResponse,
    summary="Enhanced Greedy: gönüllü–talep eşleştirme + OSRM güvenli rota",
)
async def match(payload: MatchPayload) -> MatchResponse:
    if not payload.requests:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="En az bir talep gönderilmeli",
        )
    if not payload.volunteers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="En az bir gönüllü gönderilmeli",
        )

    return await run_matching(payload.requests, payload.volunteers)


@router.get(
    "/damage-map",
    response_model=list[DamageMapCell],
    summary="Tüm grid hücrelerini döndür (harita katmanı)",
)
async def damage_map() -> list[DamageMapCell]:
    cells_raw = await get_live_damage_map()
    return [DamageMapCell(**c) for c in cells_raw]


@router.get(
    "/status",
    summary="YOLOv8m ve XGBoost model durumu",
)
async def ai_status() -> dict:
    return ai_pipeline.status()
