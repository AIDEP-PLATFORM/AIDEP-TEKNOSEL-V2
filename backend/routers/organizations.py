from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.database import get_db
from core.dependencies import get_current_user
from models.user import Organization, OrgType, User, UserRole
from schemas.organization import OrganizationCreateRequest, OrganizationResponse
from services import organization_service

router = APIRouter(prefix="/organizations", tags=["Organizations"])


# ─── Admin: Kurum Şubesi Ekle ──────────────────────────────────

@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    data: OrganizationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin panelinden kurum şubesi ekler. Sadece ADMIN erişebilir.
    org_type='STK' → AKUT, Kızılay gönüllü bazlı
    org_type='OFFICIAL' → AFAD, UMKE devlet kurumları
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kurum şubesi sadece admin tarafından eklenebilir",
        )
    return await organization_service.create_organization(db, data)


# ─── Listeleme ─────────────────────────────────────────────────

@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    org_type: Optional[OrgType] = Query(None, description="STK veya OFFICIAL"),
    db: AsyncSession = Depends(get_db),
):
    """Tüm kurum şubelerini döndürür. org_type ile filtrelenebilir."""
    return await organization_service.get_all(db, org_type)


@router.get("/names", response_model=list[str])
async def list_names(
    org_type: Optional[OrgType] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Benzersiz kurum isimlerini döndürür (dropdown 1. seviye)."""
    return await organization_service.get_names(db, org_type)


@router.get("/cities", response_model=list[str])
async def list_cities(
    name: str = Query(..., description="Kurum adı (örn: AKUT, AFAD)"),
    org_type: Optional[OrgType] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Seçilen kurumun bulunduğu illeri döndürür (dropdown 2. seviye)."""
    return await organization_service.get_cities(db, name, org_type)


@router.get("/branches", response_model=list[OrganizationResponse])
async def list_branches(
    name: str = Query(..., description="Kurum adı"),
    city: str = Query(..., description="İl"),
    org_type: Optional[OrgType] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Kurum + il için şubeleri döndürür (dropdown 3. seviye).
    Dönen organization_id kayıt formunda kullanılır.
    """
    return await organization_service.get_branches(db, name, city, org_type)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """ID ile tek kurum şubesi döndürür."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurum bulunamadı")
    return org
