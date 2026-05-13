import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from schemas.team import TeamCreate, TeamDetailResponse, TeamMemberAdd, TeamResponse
from services import team_service
from models.team import Team, TeamMember
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["Teams"])


def _require_ngo_manager(user: User) -> None:
    if user.role != UserRole.NGO_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu endpoint sadece STK yöneticileri içindir",
        )


# ─── Saha Personeli: Kendi Ekibi ────────────────────────────────

@router.get("/my-team")
async def get_my_team(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giriş yapan kullanıcının dahil olduğu ekibi ve üyelerini döndürür.
    Erişim: Tüm kayıtlı kullanıcılar (NGO_STAFF, OFFICIAL_STAFF, OFFICIAL_MANAGER vb.).
    """
    result = await db.execute(
        select(TeamMember)
        .options(
            selectinload(TeamMember.team)
            .selectinload(Team.members)
            .selectinload(TeamMember.user)
        )
        .where(TeamMember.user_id == current_user.id)
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Henüz bir ekibe atanmadınız",
        )

    team = membership.team
    return {
        "id":                str(team.id),
        "organization_id":   str(team.organization_id),
        "name":              team.name,
        "description":       team.description,
        "active_task_count": team.active_task_count,
        "created_at":        team.created_at,
        "members": [
            {
                "user_id":      str(m.user_id),
                "full_name":    m.user.full_name,
                "role":         m.user.role,
                "has_location": m.user.current_location is not None,
            }
            for m in team.members
        ],
    }


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
