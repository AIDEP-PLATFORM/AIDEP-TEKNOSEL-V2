import logging
from uuid import uuid4, UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.team import Team, TeamMember
from models.user import NgoManagerProfile, User, UserRole, NgoStaffProfile, VolunteerProfile
from schemas.team import TeamCreate

logger = logging.getLogger(__name__)


async def _get_manager_org_id(db: AsyncSession, user: User) -> UUID:
    """NGO yöneticisinin organizasyon ID'sini döndürür."""
    result = await db.execute(
        select(NgoManagerProfile.organization_id)
        .where(NgoManagerProfile.user_id == user.id)
    )
    org_id = result.scalar_one_or_none()
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yönetici profilinize ait organizasyon bulunamadı",
        )
    return org_id


async def _get_team(db: AsyncSession, team_id: UUID, org_id: UUID) -> Team:
    """Ekibi getirir. Org'a ait değilse 404 döner."""
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
        .where(Team.id == team_id, Team.organization_id == org_id)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ekip bulunamadı")
    return team


# ─── Ekip Listeleme ─────────────────────────────────────────────

async def get_teams(db: AsyncSession, user: User) -> list[dict]:
    """NGO yöneticisinin organizasyonuna ait ekipleri listeler."""
    org_id = await _get_manager_org_id(db, user)

    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members))
        .where(Team.organization_id == org_id)
        .order_by(Team.name)
    )
    teams = result.scalars().all()

    return [
        {
            "id": t.id,
            "organization_id": t.organization_id,
            "name": t.name,
            "description": t.description,
            "active_task_count": t.active_task_count,
            "member_count": len(t.members),
            "created_at": t.created_at,
        }
        for t in teams
    ]


async def get_team_detail(db: AsyncSession, team_id: UUID, user: User) -> dict:
    """Tek ekip detayını üyeleriyle birlikte döndürür."""
    org_id = await _get_manager_org_id(db, user)
    team = await _get_team(db, team_id, org_id)

    return {
        "id": team.id,
        "organization_id": team.organization_id,
        "name": team.name,
        "description": team.description,
        "active_task_count": team.active_task_count,
        "created_at": team.created_at,
        "members": [
            {
                "user_id": m.user.id,
                "full_name": m.user.full_name,
                "role": m.user.role,
                "has_location": m.user.current_location is not None,
            }
            for m in team.members
        ],
    }


# ─── Ekip Oluşturma ─────────────────────────────────────────────

async def create_team(db: AsyncSession, user: User, data: TeamCreate) -> dict:
    """Yöneticinin organizasyonuna yeni ekip ekler."""
    org_id = await _get_manager_org_id(db, user)

    team = Team(
        id=uuid4(),
        organization_id=org_id,
        name=data.name,
        description=data.description,
        active_task_count=0,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)

    logger.info(f"Yeni ekip olusturuldu: {team.id} | {team.name} | org={org_id}")

    return {
        "id": team.id,
        "organization_id": team.organization_id,
        "name": team.name,
        "description": team.description,
        "active_task_count": 0,
        "member_count": 0,
        "created_at": team.created_at,
    }


# ─── Ekip Silme ─────────────────────────────────────────────────

async def delete_team(db: AsyncSession, team_id: UUID, user: User) -> None:
    """Ekibi siler. Aktif görevi varsa silinemez."""
    org_id = await _get_manager_org_id(db, user)
    team = await _get_team(db, team_id, org_id)

    if team.active_task_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aktif görevi olan ekip silinemez",
        )

    await db.delete(team)
    await db.commit()
    logger.info(f"Ekip silindi: {team_id}")


# ─── Üye Ekleme / Çıkarma ───────────────────────────────────────

async def add_member(db: AsyncSession, team_id: UUID, member_user_id: UUID, user: User) -> dict:
    """Ekibe üye ekler. Üye aynı organizasyona ait olmalıdır."""
    org_id = await _get_manager_org_id(db, user)
    team = await _get_team(db, team_id, org_id)

    # Eklenecek kullanıcının bu org'a ait olup olmadığını kontrol et
    await _verify_member_belongs_to_org(db, member_user_id, org_id)

    # Zaten üye mi?
    existing = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == member_user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı zaten ekipte",
        )

    member = TeamMember(id=uuid4(), team_id=team_id, user_id=member_user_id)
    db.add(member)
    await db.commit()
    logger.info(f"Ekip uyesi eklendi: team={team_id} user={member_user_id}")

    return await get_team_detail(db, team_id, user)


async def remove_member(
    db: AsyncSession, team_id: UUID, member_user_id: UUID, user: User
) -> dict:
    """Ekipten üye çıkarır."""
    org_id = await _get_manager_org_id(db, user)
    await _get_team(db, team_id, org_id)  # yetki kontrolü

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == member_user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu kullanıcı ekipte bulunamadı",
        )

    await db.delete(member)
    await db.commit()
    logger.info(f"Ekip uyesi cikarildi: team={team_id} user={member_user_id}")

    return await get_team_detail(db, team_id, user)


# ─── Yardımcı ───────────────────────────────────────────────────

async def _verify_member_belongs_to_org(
    db: AsyncSession, member_user_id: UUID, org_id: UUID
) -> None:
    """Kullanıcının bu organizasyona ait gönüllü veya personel olduğunu doğrular."""
    # Gönüllü mü?
    vol_result = await db.execute(
        select(VolunteerProfile).where(
            VolunteerProfile.user_id == member_user_id,
            VolunteerProfile.organization_id == org_id,
        )
    )
    if vol_result.scalar_one_or_none():
        return

    # STK personeli mi?
    staff_result = await db.execute(
        select(NgoStaffProfile).where(
            NgoStaffProfile.user_id == member_user_id,
            NgoStaffProfile.organization_id == org_id,
        )
    )
    if staff_result.scalar_one_or_none():
        return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Bu kullanıcı organizasyonunuza ait değil",
    )
