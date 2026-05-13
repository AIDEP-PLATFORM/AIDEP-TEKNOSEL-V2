import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from schemas.team import TeamCreate, TeamDetailResponse, TeamMemberAdd, TeamResponse
from services import team_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["Teams"])


def _require_ngo_manager(user: User) -> None:
    if user.role != UserRole.NGO_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu endpoint sadece STK yöneticileri içindir",
        )


# ─── Ekip Listeleme ─────────────────────────────────────────────

@router.get("", response_model=list[TeamResponse])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yöneticinin organizasyonuna ait ekipleri listeler.
    Erişim: NGO_MANAGER.
    """
    _require_ngo_manager(current_user)
    teams = await team_service.get_teams(db, current_user)
    return teams


@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ekip detayını ve üyelerini döndürür.
    Erişim: NGO_MANAGER (sadece kendi org'unun ekipleri).
    """
    _require_ngo_manager(current_user)
    return await team_service.get_team_detail(db, team_id, current_user)


# ─── Ekip Oluşturma / Silme ─────────────────────────────────────

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yeni ekip oluşturur.
    Erişim: NGO_MANAGER.
    """
    _require_ngo_manager(current_user)
    return await team_service.create_team(db, current_user, data)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ekibi siler. Aktif görevi olan ekip silinemez.
    Erişim: NGO_MANAGER.
    """
    _require_ngo_manager(current_user)
    await team_service.delete_team(db, team_id, current_user)


# ─── Üye Ekleme / Çıkarma ───────────────────────────────────────

@router.post("/{team_id}/members", response_model=TeamDetailResponse)
async def add_member(
    team_id: UUID,
    body: TeamMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ekibe üye ekler. Üye aynı organizasyona kayıtlı olmalıdır.
    Erişim: NGO_MANAGER.
    """
    _require_ngo_manager(current_user)
    return await team_service.add_member(db, team_id, body.user_id, current_user)


@router.delete("/{team_id}/members/{member_user_id}", response_model=TeamDetailResponse)
async def remove_member(
    team_id: UUID,
    member_user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ekipten üye çıkarır.
    Erişim: NGO_MANAGER.
    """
    _require_ngo_manager(current_user)
    return await team_service.remove_member(db, team_id, member_user_id, current_user)
