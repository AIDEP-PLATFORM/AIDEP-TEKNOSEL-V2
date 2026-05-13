import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import httpx
from fastapi import HTTPException, status
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.config import settings
from models.photo import DamagePhoto
from models.request import (
    Assignment,
    AssignmentStatus,
    HelpRequest,
    NeedType,
    RequestStatus,
)
from models.team import Team, TeamMember
from models.user import User, UserRole, VolunteerProfile
from schemas.request import HelpRequestCreate

logger = logging.getLogger(__name__)

# AI service'e gönderilecek NeedType → int eşlemesi (ai-service/schemas/priority.py ile uyumlu)
_NEED_TYPE_TO_INT = {
    NeedType.RESCUE:  0,
    NeedType.MEDICAL: 1,
    NeedType.SHELTER: 2,
    NeedType.FOOD:    3,
    NeedType.OTHER:   4,
}


# ─── Talep Oluşturma ────────────────────────────────────────────

async def create_request(
    db: AsyncSession,
    user: User,
    data: HelpRequestCreate,
) -> HelpRequest:
    """Yeni yardım talebi oluşturur ve AI service'e skor hesaplatır."""
    req = HelpRequest(
        id=uuid4(),
        user_id=user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        location=from_shape(Point(data.longitude, data.latitude), srid=4326),
        need_type=data.need_type,
        urgency_level=data.urgency_level,
        person_count=data.person_count,
        description=data.description,
        status=RequestStatus.PENDING,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    logger.info(f"Yeni talep olusturuldu: {req.id} | {req.need_type} | aciliyet={req.urgency_level}")

    # AI service'e öncelik skoru hesaplat (modeller yüklüyse)
    await _score_request(db, req)

    # İlişkileriyle birlikte yeniden çek (assignment lazy load hatasını önler)
    return await get_request(db, req.id)


async def _score_request(db: AsyncSession, req: HelpRequest) -> None:
    """AI service'e XGBoost öncelik skoru hesaplatır.
    AI service erişilemezse veya modeller yüklü değilse sessizce atlar.
    """
    now = datetime.now(timezone.utc)
    wait_minutes = int((now - req.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60)

    payload = {
        "request_id": str(req.id),
        "urgency_level": req.urgency_level,
        "wait_time_minutes": wait_minutes,
        "distance_km": 5.0,          # TODO: en yakın gönüllüye gerçek mesafe
        "need_type": _NEED_TYPE_TO_INT[req.need_type],
        "meteorology_score": 0.5,    # TODO: MGM API entegrasyonu
        "person_count": req.person_count,
        "area_damage_score": req.area_damage_score or 0.5,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_URL}/ai/score-request",
                json=payload,
            )
            resp.raise_for_status()
            result = resp.json()

        req.priority_score = result["priority_score"]
        req.status = RequestStatus.SCORED
        await db.commit()
        logger.info(f"Talep skorlandi: {req.id} → {req.priority_score:.1f} ({result['priority_class']})")

    except Exception as e:
        # AI service erişilemez → PENDING olarak bırak, ileride tekrar denenebilir
        logger.warning(f"AI service skor hatasi (talep PENDING kalacak): {e}")


# ─── Listeleme ve Sorgulama ─────────────────────────────────────

def _request_query():
    return select(HelpRequest).options(
        selectinload(HelpRequest.assignment),
        selectinload(HelpRequest.photos),
    )


async def get_requests(
    db: AsyncSession,
    status_filter: Optional[RequestStatus] = None,
    need_type: Optional[NeedType] = None,
) -> list[HelpRequest]:
    q = _request_query().order_by(
        HelpRequest.priority_score.desc().nullslast(),
        HelpRequest.created_at.asc(),
    )
    if status_filter:
        q = q.where(HelpRequest.status == status_filter)
    if need_type:
        q = q.where(HelpRequest.need_type == need_type)
    return list((await db.execute(q)).scalars().all())


async def get_request(db: AsyncSession, request_id) -> HelpRequest:
    result = await db.execute(
        _request_query().where(HelpRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Talep bulunamadı")
    return req


async def cancel_request(db: AsyncSession, request_id, user: User) -> HelpRequest:
    """Kullanıcı kendi talebini iptal eder."""
    req = await get_request(db, request_id)

    if req.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu talebi iptal etme yetkiniz yok")

    if req.status in (RequestStatus.COMPLETED, RequestStatus.CANCELLED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu talep zaten kapatılmış")

    req.status = RequestStatus.CANCELLED
    await db.commit()
    await db.refresh(req)
    return req


# ─── Görev Durumu Güncelleme ────────────────────────────────────

async def update_assignment_status(
    db: AsyncSession,
    request_id,
    new_status: AssignmentStatus,
    user: User,
) -> Assignment:
    """Gönüllü görev durumunu günceller (EN_ROUTE veya COMPLETED)."""
    req = await get_request(db, request_id)

    if not req.assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu talep için atama bulunamadı")

    assignment = req.assignment

    # Ekip üyesi mi kontrolü
    is_member = await _is_team_member(db, assignment.team_id, user.id)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu görevi güncelleme yetkiniz yok — atanan ekibin üyesi değilsiniz",
        )

    assignment.status = new_status
    if new_status == AssignmentStatus.COMPLETED:
        req.status = RequestStatus.COMPLETED
        # Görev tamamlandı → ekibin aktif görev sayısını azalt
        await _decrement_team_task_count(db, assignment.team_id)
    elif new_status == AssignmentStatus.EN_ROUTE:
        req.status = RequestStatus.EN_ROUTE

    await db.commit()
    await db.refresh(assignment)
    return assignment


async def _is_team_member(db: AsyncSession, team_id, user_id) -> bool:
    """Kullanıcının belirtilen ekibin üyesi olup olmadığını kontrol eder."""
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def _decrement_team_task_count(db: AsyncSession, team_id) -> None:
    """Ekibin aktif görev sayısını 1 azaltır. Sıfırın altına düşmez."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team and team.active_task_count and team.active_task_count > 0:
        team.active_task_count -= 1
