"""
/ai/* — AI servisi için HTTP proxy

Backend, AI işlemlerini ai-service mikroservisine iletir.
Auth kontrolü burada yapılır; ai-service internal endpoint'tir.
"""
import logging

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse

from core.config import settings
from core.dependencies import get_current_user
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Pipeline"])

_AI_BASE = settings.AI_SERVICE_URL
_AI_HEADERS = {"X-API-Key": settings.AI_INTERNAL_API_KEY}


async def _proxy_get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{_AI_BASE}{path}", headers=_AI_HEADERS)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def _proxy_post_json(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(f"{_AI_BASE}{path}", json=body, headers=_AI_HEADERS)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.post("/analyze-damage", summary="Fotoğraf → YOLOv8m hasar tespiti")
async def analyze_damage(
    file: UploadFile = File(...),
    latitude: float  = Form(..., ge=-90,  le=90),
    longitude: float = Form(..., ge=-180, le=180),
    report_id: str | None = Form(None),
    current_user: User = Depends(get_current_user),
) -> dict:
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Dosya 10 MB'ı aşamaz")

    data = {"latitude": str(latitude), "longitude": str(longitude)}
    if report_id:
        data["report_id"] = report_id

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{_AI_BASE}/ai/analyze-damage",
            data=data,
            files={"file": (file.filename, image_bytes, file.content_type)},
            headers=_AI_HEADERS,
        )
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.post("/score-request", summary="Tek talebi XGBoost ile önceliklendir")
async def score_request(
    req: Request,
    current_user: User = Depends(get_current_user),
) -> dict:
    return await _proxy_post_json("/ai/score-request", await req.json())


@router.post("/score-requests", summary="Toplu talep önceliklendirme")
async def score_requests_bulk(
    req: Request,
    current_user: User = Depends(get_current_user),
) -> list:
    return await _proxy_post_json("/ai/score-requests", await req.json())


@router.post("/match", summary="Enhanced Greedy eşleştirme + OSRM")
async def match(
    req: Request,
    current_user: User = Depends(get_current_user),
) -> dict:
    return await _proxy_post_json("/ai/match", await req.json())


@router.get("/damage-map", summary="Hasar haritası grid hücreleri")
async def damage_map(
    current_user: User = Depends(get_current_user),
) -> list:
    return await _proxy_get("/ai/damage-map")


@router.get("/status", summary="AI model durumu")
async def ai_status(
    current_user: User = Depends(get_current_user),
) -> dict:
    return await _proxy_get("/ai/status")
