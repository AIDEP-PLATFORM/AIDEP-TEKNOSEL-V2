import logging
from uuid import UUID
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

from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


class VolunteerActionResponse(BaseModel):
    message: str
    user_id: str
    is_active: bool


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


# ─── Yardımcı: Yöneticinin org_id'sini al ───────────────────────

async def _get_manager_org_id(db: AsyncSession, manager_user_id) -> str:
    result = await db.execute(
        select(NgoManagerProfile.organization_id)
        .where(NgoManagerProfile.user_id == manager_user_id)
    )
    org_id = result.scalar_one_or_none()
    if not org_id:
        raise HTTPException(status_code=400, detail="Yönetici profilinize ait organizasyon bulunamadı")
    return org_id


# ─── NGO Yöneticisi: Onay Bekleyenler (Gönüllü + Saha Personeli) ─

@router.get("/pending", response_model=list[OrgMemberResponse])
async def get_pending_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """NGO yöneticisinin organizasyonuna kayıtlı, henüz onaylanmamış gönüllü ve saha personelini listeler."""
    if current_user.role != UserRole.NGO_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Bu endpoint sadece STK yöneticileri içindir")

    org_id = await _get_manager_org_id(db, current_user.id)
    members: list[OrgMemberResponse] = []

    # Bekleyen gönüllüler (VOLUNTEER)
    vol_result = await db.execute(
        select(User, VolunteerProfile)
        .join(VolunteerProfile, VolunteerProfile.user_id == User.id)
        .where(User.role == UserRole.VOLUNTEER, User.is_active == False,
               VolunteerProfile.organization_id == org_id)
        .order_by(User.created_at.desc())
    )
    for u, p in vol_result.all():
        members.append(OrgMemberResponse(
            id=u.id, full_name=u.full_name, email=u.email, phone=u.phone,
            role=u.role, is_active=u.is_active,
            skills=p.skills or [], active_task_count=p.active_task_count or 0,
            has_location=u.current_location is not None, created_at=u.created_at,
        ))

    # Bekleyen saha personeli (NGO_STAFF)
    staff_result = await db.execute(
        select(User, NgoStaffProfile)
        .join(NgoStaffProfile, NgoStaffProfile.user_id == User.id)
        .where(User.role == UserRole.NGO_STAFF, User.is_active == False,
               NgoStaffProfile.organization_id == org_id)
        .order_by(User.created_at.desc())
    )
    for u, _ in staff_result.all():
        members.append(OrgMemberResponse(
            id=u.id, full_name=u.full_name, email=u.email, phone=u.phone,
            role=u.role, is_active=u.is_active,
            skills=[], active_task_count=0,
            has_location=u.current_location is not None, created_at=u.created_at,
        ))

    return sorted(members, key=lambda m: m.created_at, reverse=True)


# ─── NGO Yöneticisi: Üye Onayla ────────────────────────────────

@router.put("/{user_id}/approve", response_model=VolunteerActionResponse)
async def approve_member(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bekleyen gönüllü veya saha personelini onaylar."""
    if current_user.role != UserRole.NGO_MANAGER:
        raise HTTPException(status_code=403, detail="Sadece STK yöneticileri onaylayabilir")

    org_id = await _get_manager_org_id(db, current_user.id)
    user = await _find_pending_member(db, user_id, org_id)

    user.is_active = True
    await db.commit()
    logger.info(f"Üye onaylandı: {user.email} ({user.role}) by {current_user.email}")
    return VolunteerActionResponse(
        message=f"{user.full_name} onaylandı, sisteme erişim açıldı.",
        user_id=str(user.id), is_active=True,
    )


# ─── NGO Yöneticisi: Üye Reddet ────────────────────────────────

@router.put("/{user_id}/reject", response_model=VolunteerActionResponse)
async def reject_member(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bekleyen gönüllü veya saha personelini reddeder."""
    if current_user.role != UserRole.NGO_MANAGER:
        raise HTTPException(status_code=403, detail="Sadece STK yöneticileri reddedebilir")

    org_id = await _get_manager_org_id(db, current_user.id)
    user = await _find_pending_member(db, user_id, org_id)

    user.is_active = False
    await db.commit()
    logger.info(f"Üye reddedildi: {user.email} ({user.role}) by {current_user.email}")
    return VolunteerActionResponse(
        message=f"{user.full_name} reddedildi.",
        user_id=str(user.id), is_active=False,
    )


async def _find_pending_member(db: AsyncSession, user_id: UUID, org_id) -> User:
    """VOLUNTEER veya NGO_STAFF rolündeki üyeyi org kontrolüyle bulur."""
    # Önce gönüllü olarak ara
    vol = await db.execute(
        select(User).join(VolunteerProfile, VolunteerProfile.user_id == User.id)
        .where(User.id == user_id, User.role == UserRole.VOLUNTEER,
               VolunteerProfile.organization_id == org_id)
    )
    row = vol.scalar_one_or_none()
    if row:
        return row

    # Sonra saha personeli olarak ara
    staff = await db.execute(
        select(User).join(NgoStaffProfile, NgoStaffProfile.user_id == User.id)
        .where(User.id == user_id, User.role == UserRole.NGO_STAFF,
               NgoStaffProfile.organization_id == org_id)
    )
    row = staff.scalar_one_or_none()
    if row:
        return row

    raise HTTPException(status_code=404, detail="Üye bulunamadı veya erişim yetkiniz yok")
