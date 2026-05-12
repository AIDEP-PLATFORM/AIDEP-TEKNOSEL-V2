import logging
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.user import (
    NgoManagerProfile,
    NgoStaffProfile,
    OfficialProfile,
    Organization,
    User,
    UserRole,
    VolunteerProfile,
)

logger = logging.getLogger(__name__)


def _user_query():
    """Tüm profil ilişkileriyle user sorgusu."""
    return select(User).options(
        selectinload(User.ngo_manager_profile).selectinload(NgoManagerProfile.organization),
        selectinload(User.ngo_staff_profile).selectinload(NgoStaffProfile.organization),
        selectinload(User.official_profile).selectinload(OfficialProfile.organization),
        selectinload(User.volunteer_profile).selectinload(VolunteerProfile.organization),
    )


async def get_users(
    db: AsyncSession,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
) -> list[User]:
    """Kullanıcıları filtreli listeler. Admin paneli için."""
    q = _user_query().order_by(User.created_at.desc())

    if role is not None:
        q = q.where(User.role == role)
    if is_active is not None:
        q = q.where(User.is_active == is_active)

    result = await db.execute(q)
    return list(result.scalars().all())


async def get_pending_approvals(db: AsyncSession) -> list[User]:
    """Admin onayı bekleyen STK yöneticilerini döndürür (NGO_MANAGER, is_active=False)."""
    q = (
        _user_query()
        .where(User.role == UserRole.NGO_MANAGER, User.is_active.is_(False))
        .order_by(User.created_at.asc())
    )
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_user(db: AsyncSession, user_id: UUID) -> User:
    """Tek kullanıcı detayı. Bulunamazsa 404."""
    result = await db.execute(
        _user_query().where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı",
        )
    return user


async def approve_user(db: AsyncSession, user_id: UUID) -> User:
    """NGO_MANAGER kullanıcısını onaylar (is_active=True yapar)."""
    user = await get_user(db, user_id)

    if user.role != UserRole.NGO_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece STK yöneticileri onaylanabilir",
        )
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı zaten aktif",
        )

    user.is_active = True
    await db.commit()
    await db.refresh(user)
    logger.info(f"Admin onayladı: {user.email} ({user.role})")
    return user


async def deactivate_user(db: AsyncSession, user_id: UUID) -> User:
    """Kullanıcıyı devre dışı bırakır (is_active=False yapar)."""
    user = await get_user(db, user_id)

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin hesabı devre dışı bırakılamaz",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı zaten pasif",
        )

    user.is_active = False
    await db.commit()
    await db.refresh(user)
    logger.info(f"Admin devre disi birakti: {user.email} ({user.role})")
    return user


async def activate_user(db: AsyncSession, user_id: UUID) -> User:
    """Devre dışı bırakılmış kullanıcıyı tekrar aktif eder."""
    user = await get_user(db, user_id)

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı zaten aktif",
        )

    user.is_active = True
    await db.commit()
    await db.refresh(user)
    logger.info(f"Admin aktif etti: {user.email} ({user.role})")
    return user
