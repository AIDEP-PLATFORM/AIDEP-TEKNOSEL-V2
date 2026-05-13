from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import OfficialProfile, User, UserRole

router = APIRouter(prefix="/officials", tags=["Officials"])


class OfficialMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    role: str
    is_active: bool
    registration_number: str
    created_at: str

    model_config = {"from_attributes": True}


# ─── Belirli org'un resmi personeli ─────────────────────────────

@router.get("/org/{org_id}/members", response_model=list[OfficialMemberResponse])
async def get_official_org_members(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Belirli bir OFFICIAL kurum şubesinin personelini listeler.
    ADMIN tüm kurumları görebilir; OFFICIAL_MANAGER yalnızca kendi kurumunu görebilir.
    """
    allowed = {UserRole.OFFICIAL_MANAGER, UserRole.ADMIN}
    if current_user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Erişim yetkisi yok")

    # OFFICIAL_MANAGER sadece kendi org'unu görebilir
    if current_user.role == UserRole.OFFICIAL_MANAGER:
        mgr_result = await db.execute(
            select(OfficialProfile.organization_id)
            .where(OfficialProfile.user_id == current_user.id)
        )
        manager_org_id = mgr_result.scalar_one_or_none()
        if not manager_org_id or str(manager_org_id) != str(org_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu organizasyona erişim yetkiniz yok")

    result = await db.execute(
        select(User, OfficialProfile)
        .join(OfficialProfile, OfficialProfile.user_id == User.id)
        .where(OfficialProfile.organization_id == org_id)
        .order_by(User.full_name)
    )

    members = []
    for user, profile in result.all():
        members.append(OfficialMemberResponse(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role=str(user.role.value),
            is_active=user.is_active,
            registration_number=profile.registration_number,
            created_at=user.created_at.isoformat(),
        ))

    return members
