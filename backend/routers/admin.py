import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from schemas.admin import AdminUserResponse, ApproveResponse
from services import admin_service, request_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Admin yetki kontrolü ───────────────────────────────────────

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Sadece ADMIN rolü erişebilir."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu endpoint sadece adminler içindir",
        )
    return current_user


# ─── Kullanıcı Yönetimi ─────────────────────────────────────────

@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    role: Optional[UserRole] = Query(None, description="Rol filtresi"),
    is_active: Optional[bool] = Query(None, description="Aktiflik filtresi"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Tüm kullanıcıları listeler. role ve is_active ile filtrelenebilir.
    Örnek: /admin/users?role=NGO_MANAGER&is_active=false → onay bekleyenler
    """
    users = await admin_service.get_users(db, role=role, is_active=is_active)
    return [AdminUserResponse.model_validate(u) for u in users]


@router.get("/users/pending", response_model=list[AdminUserResponse])
async def list_pending_approvals(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Admin onayı bekleyen STK yöneticilerini listeler (NGO_MANAGER + is_active=False).
    Admin panelinde 'Onay Bekleyenler' sekmesi için.
    """
    users = await admin_service.get_pending_approvals(db)
    return [AdminUserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Tek kullanıcı detayını döndürür."""
    user = await admin_service.get_user(db, user_id)
    return AdminUserResponse.model_validate(user)


@router.put("/users/{user_id}/approve", response_model=ApproveResponse)
async def approve_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """STK yöneticisini onaylar. Onaylanan kullanıcı web paneline giriş yapabilir.
    Sadece NGO_MANAGER rolündeki kullanıcılar için geçerlidir.
    """
    user = await admin_service.approve_user(db, user_id)
    return ApproveResponse(
        message=f"{user.full_name} onaylandı, sisteme erişim açıldı.",
        user_id=user.id,
        is_active=user.is_active,
    )


@router.put("/users/{user_id}/deactivate", response_model=ApproveResponse)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Kullanıcıyı devre dışı bırakır. Admin hariç tüm roller için geçerlidir."""
    user = await admin_service.deactivate_user(db, user_id)
    return ApproveResponse(
        message=f"{user.full_name} devre dışı bırakıldı.",
        user_id=user.id,
        is_active=user.is_active,
    )


@router.put("/users/{user_id}/activate", response_model=ApproveResponse)
async def activate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Devre dışı bırakılmış kullanıcıyı tekrar aktif eder."""
    user = await admin_service.activate_user(db, user_id)
    return ApproveResponse(
        message=f"{user.full_name} tekrar aktif edildi.",
        user_id=user.id,
        is_active=user.is_active,
    )


# ─── AI Pipeline Yönetimi ───────────────────────────────────────

@router.post("/requests/score-pending", tags=["Admin", "AI Pipeline"])
async def score_pending_requests(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """AI servisi geçici erişilemez olduğunda PENDING kalan talepler için
    XGBoost öncelik skorunu yeniden hesaplar.
    Erişim: Sadece ADMIN.
    """
    return await request_service.score_pending_requests(db)
