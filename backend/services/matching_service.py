import logging
from collections import defaultdict
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException, status
from geoalchemy2.functions import ST_X, ST_Y
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.request import (
    Assignment,
    AssignmentStatus,
    HelpRequest,
    NeedType,
    RequestStatus,
)
from models.team import Team, TeamMember
from models.user import NgoManagerProfile, User, UserRole, VolunteerProfile

logger = logging.getLogger(__name__)


async def run_matching(db: AsyncSession, current_user: User) -> dict:
    """Bekleyen/skorlanmış tüm talepleri müsait ekiplerle eşleştirir.
    AI service'in /ai/match endpoint'ini çağırır.

    Yetki kapsamı:
    - NGO_MANAGER  → sadece kendi organizasyonunun ekiplerini eşleştirir
    - OFFICIAL_MANAGER / ADMIN → tüm ekipleri eşleştirir
    """

    # 1. Yöneticinin organizasyon kapsamını belirle
    org_id = await _resolve_org_scope(db, current_user)

    # 2. Eşleştirmeye uygun talepler: PENDING veya SCORED
    requests_result = await db.execute(
        select(HelpRequest)
        .where(HelpRequest.status.in_([RequestStatus.PENDING, RequestStatus.SCORED]))
        .order_by(
            HelpRequest.priority_score.desc().nullslast(),
            HelpRequest.created_at.asc(),
        )
    )
    pending_requests = list(requests_result.scalars().all())

    if not pending_requests:
        return {
            "matched": 0,
            "unmatched": 0,
            "total_requests": 0,
            "total_volunteers": 0,
            "message": "Eşleştirilecek bekleyen talep yok",
        }

    # 3. Müsait ekipleri ve üyelerini çek
    teams_payload = await _build_teams_payload(db, org_id)

    if not teams_payload:
        return {
            "matched": 0,
            "unmatched": len(pending_requests),
            "total_requests": len(pending_requests),
            "total_volunteers": 0,
            "message": "Konumu bilinen müsait ekip bulunamadı",
        }

    # 4. AI service payload'ını hazırla
    requests_payload = [
        {
            "request_id": str(r.id),
            "latitude": r.latitude,
            "longitude": r.longitude,
            "priority_score": r.priority_score or 50.0,
            "required_skills": _need_type_to_skills(r.need_type),
            "area_damage_score": r.area_damage_score or 0.5,
        }
        for r in pending_requests
    ]

    # 5. AI service'e gönder
    # NOT: AI service "volunteer_id" alanı bekliyor — biz oraya team_id gönderiyoruz.
    # AI service semantiği bilmez, sadece ID eşleştirir.
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_URL}/ai/match",
                json={"requests": requests_payload, "volunteers": teams_payload},
                headers={"X-API-Key": settings.AI_INTERNAL_API_KEY},
            )
            resp.raise_for_status()
            match_result = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"AI service match HTTP hatasi {e.response.status_code}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI eşleştirme servisi şu an kullanılamıyor",
        )
    except Exception as e:
        logger.error(f"AI service match hatasi: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI eşleştirme servisi şu an kullanılamıyor",
        )

    # 6. Eşleştirme sonuçlarını DB'ye kaydet
    assignments = match_result.get("assignments", [])
    matched_count = 0

    for assignment_data in assignments:
        request_id = assignment_data["request_id"]
        team_id = UUID(assignment_data["volunteer_id"])  # AI string döndürür, UUID'e çevir

        req = next((r for r in pending_requests if str(r.id) == request_id), None)
        if not req:
            continue

        assignment = Assignment(
            id=uuid4(),
            request_id=req.id,
            team_id=team_id,
            route_distance_km=assignment_data["route_distance_km"],
            route_duration_minutes=assignment_data["route_duration_minutes"],
            safety_score=assignment_data["safety_score"],
            composite_score=assignment_data["composite_score"],
            route_geometry=assignment_data.get("route_geometry"),
            status=AssignmentStatus.ASSIGNED,
        )
        db.add(assignment)

        req.status = RequestStatus.ASSIGNED

        # Atanan ekibin aktif görev sayısını artır
        await _increment_team_task_count(db, team_id)

        matched_count += 1

    await db.commit()

    unmatched = match_result.get("unmatched_request_ids", [])
    logger.info(
        f"Eslestirme tamamlandi: {matched_count} eslesti, {len(unmatched)} eslesemedi "
        f"(org_id={org_id})"
    )

    return {
        "matched": matched_count,
        "unmatched": len(unmatched),
        "total_requests": len(pending_requests),
        "total_volunteers": len(teams_payload),
        "message": f"{matched_count} talep eşleştirildi, {len(unmatched)} talep eşleşemedi",
    }


async def _build_teams_payload(db: AsyncSession, org_id) -> list[dict]:
    """Ekiplerin AI servisine gönderilecek payload'ını oluşturur.

    Her ekip için:
    - Konum: konumu olan üyelerin ortalama lat/lng'si
    - Beceriler: tüm üyelerin becerilerinin birleşimi
    - Aktif görev sayısı: ekibin şu anki aktif görevi

    Hiçbir üyesinin konumu olmayan ekipler atlanır.
    """
    # Ekipleri çek (org filtresi ile)
    teams_query = select(Team)
    if org_id:
        teams_query = teams_query.where(Team.organization_id == org_id)
    teams_result = await db.execute(teams_query)
    teams = teams_result.scalars().all()

    if not teams:
        return []

    team_ids = [t.id for t in teams]
    teams_map = {t.id: t for t in teams}

    # Ekip üyelerinin konumlarını çek (sadece konumu olanlar)
    members_result = await db.execute(
        select(
            TeamMember.team_id,
            TeamMember.user_id,
            ST_Y(User.current_location).label("lat"),
            ST_X(User.current_location).label("lng"),
        )
        .join(User, User.id == TeamMember.user_id)
        .where(
            TeamMember.team_id.in_(team_ids),
            User.is_active.is_(True),
            User.current_location.isnot(None),
        )
    )
    member_rows = members_result.all()

    if not member_rows:
        return []

    # Üyelerin becerilerini çek (VolunteerProfile'ı olanlar için)
    member_user_ids = [row.user_id for row in member_rows]
    skills_result = await db.execute(
        select(VolunteerProfile.user_id, VolunteerProfile.skills)
        .where(VolunteerProfile.user_id.in_(member_user_ids))
    )
    skills_map = {row.user_id: row.skills or [] for row in skills_result.all()}

    # Ekip başına konum ve beceri hesapla
    team_lats = defaultdict(list)
    team_lngs = defaultdict(list)
    team_skills = defaultdict(set)

    for row in member_rows:
        team_lats[row.team_id].append(float(row.lat))
        team_lngs[row.team_id].append(float(row.lng))
        team_skills[row.team_id].update(skills_map.get(row.user_id, []))

    # Payload'ı oluştur
    payload = []
    for team_id, lats in team_lats.items():
        lngs = team_lngs[team_id]
        team = teams_map[team_id]
        payload.append({
            "volunteer_id": str(team_id),   # AI service bu alanı kullanır
            "latitude": sum(lats) / len(lats),
            "longitude": sum(lngs) / len(lngs),
            "skills": list(team_skills[team_id]),
            "active_task_count": team.active_task_count or 0,
        })

    return payload


async def _resolve_org_scope(db: AsyncSession, current_user: User):
    """NGO_MANAGER → kendi organization_id'si, ADMIN/OFFICIAL_MANAGER → None."""
    if current_user.role == UserRole.NGO_MANAGER:
        result = await db.execute(
            select(NgoManagerProfile.organization_id)
            .where(NgoManagerProfile.user_id == current_user.id)
        )
        org_id = result.scalar_one_or_none()
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yönetici profili için organizasyon bulunamadı",
            )
        return org_id
    return None


async def _increment_team_task_count(db: AsyncSession, team_id: str) -> None:
    """Atanan ekibin aktif görev sayısını 1 artırır."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team:
        team.active_task_count = (team.active_task_count or 0) + 1


def _need_type_to_skills(need_type: NeedType) -> list[str]:
    """İhtiyaç türüne göre önerilen beceri etiketlerini döndürür."""
    mapping = {
        NeedType.RESCUE:  ["Enkaz Arama ve Kurtarma", "İlk Yardım"],
        NeedType.MEDICAL: ["Tıbbi Destek", "İlk Yardım"],
        NeedType.SHELTER: ["Lojistik", "Barınma"],
        NeedType.FOOD:    ["Lojistik"],
        NeedType.OTHER:   [],
    }
    return mapping.get(need_type, [])
