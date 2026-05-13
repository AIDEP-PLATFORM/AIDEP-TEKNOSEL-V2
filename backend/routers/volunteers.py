import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import PREDEFINED_SKILLS
from core.database import get_db
from core.dependencies import get_current_user
from models.user import (
    NgoManagerProfile,
    NgoStaffProfile,
    User,
    UserRole,
    VolunteerProfile,
)
from schemas.volunteer import OrgMemberResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


# ─── Beceri Listesi ─────────────────────────────────────────────

@router.get("/skills", response_model=list[str])
async def get_predefined_skills():
    """Gönüllü beceri popup'ı için sabit beceri listesi.
    Frontend bu listeyi checkbox olarak gösterir.
    Kullanıcı 'Diğer' seçeneğiyle serbest metin de ekleyebilir.
    """
    return PREDEFINED_SKILLS


# ─── NGO Yöneticisi: Kendi Organizasyonunun Üyeleri ─────────────

@router.get("/org-members", response_model=list[OrgMemberResponse])
async def get_org_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NGO yöneticisinin kendi organizasyonundaki gönüllü ve personeli listeler.
    Ekip oluştururken kime eklenebileceğini görmek için kullanılır.
    Erişim: NGO_MANAGER.
    - VOLUNTEER rolündeki üyeler: beceri ve görev sayısı dahil
    - NGO_STAFF rolündeki üyeler: beceri alanı boş liste olarak döner
    Başka bir STK'nın üyeleri bu listede görünmez.
    """
    if current_user.role != UserRole.NGO_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu endpoint sadece STK yöneticileri içindir",
        )

    # Yöneticinin organizasyonunu bul
    mgr_result = await db.execute(
        select(NgoManagerProfile.organization_id)
        .where(NgoManagerProfile.user_id == current_user.id)
    )
    org_id = mgr_result.scalar_one_or_none()
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yönetici profilinize ait organizasyon bulunamadı",
        )

    members: list[OrgMemberResponse] = []

    # 1. Bu org'a kayıtlı gönüllüler (VOLUNTEER rolü)
    vol_result = await db.execute(
        select(User, VolunteerProfile)
        .join(VolunteerProfile, VolunteerProfile.user_id == User.id)
        .where(
            User.role == UserRole.VOLUNTEER,
            VolunteerProfile.organization_id == org_id,
        )
        .order_by(User.full_name)
    )
    for user, profile in vol_result.all():
        members.append(
            OrgMemberResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                skills=profile.skills or [],
                active_task_count=profile.active_task_count or 0,
                has_location=user.current_location is not None,
                created_at=user.created_at,
            )
        )

    # 2. Bu org'a kayıtlı NGO personeli (NGO_STAFF rolü)
    staff_result = await db.execute(
        select(User, NgoStaffProfile)
        .join(NgoStaffProfile, NgoStaffProfile.user_id == User.id)
        .where(
            User.role == UserRole.NGO_STAFF,
            NgoStaffProfile.organization_id == org_id,
        )
        .order_by(User.full_name)
    )
    for user, _ in staff_result.all():
        members.append(
            OrgMemberResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                skills=[],           # NGO personelinin beceri profili yok
                active_task_count=0,
                has_location=user.current_location is not None,
                created_at=user.created_at,
            )
        )

    return members
