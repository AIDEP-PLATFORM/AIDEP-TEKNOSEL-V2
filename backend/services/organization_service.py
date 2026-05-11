import logging
from uuid import uuid4
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from models.user import Organization, OrgType
from schemas.organization import OrganizationCreateRequest

logger = logging.getLogger(__name__)


async def create_organization(
    db: AsyncSession, data: OrganizationCreateRequest
) -> Organization:
    existing = await db.execute(
        select(Organization).where(
            Organization.name == data.name,
            Organization.city == data.city,
            Organization.district == data.district,
            Organization.org_type == data.org_type,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu kurum şubesi zaten kayıtlı (aynı isim/il/ilçe/tür)",
        )

    org = Organization(
        id=uuid4(),
        name=data.name,
        city=data.city,
        district=data.district,
        org_type=data.org_type,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    logger.info(f"Yeni organizasyon [{data.org_type}]: {org.name}/{org.city}/{org.district}")
    return org


async def get_all(
    db: AsyncSession, org_type: Optional[OrgType] = None
) -> list[Organization]:
    q = select(Organization).order_by(
        Organization.name, Organization.city, Organization.district
    )
    if org_type:
        q = q.where(Organization.org_type == org_type)
    return (await db.execute(q)).scalars().all()


async def get_names(
    db: AsyncSession, org_type: Optional[OrgType] = None
) -> list[str]:
    """Benzersiz kurum isimlerini döndürür (dropdown 1. seviye)."""
    q = select(Organization.name).distinct().order_by(Organization.name)
    if org_type:
        q = q.where(Organization.org_type == org_type)
    return [row[0] for row in (await db.execute(q)).all()]


async def get_cities(
    db: AsyncSession, name: str, org_type: Optional[OrgType] = None
) -> list[str]:
    """Belirli kurum için illeri döndürür (dropdown 2. seviye)."""
    q = (
        select(Organization.city).distinct()
        .where(Organization.name == name)
        .order_by(Organization.city)
    )
    if org_type:
        q = q.where(Organization.org_type == org_type)
    return [row[0] for row in (await db.execute(q)).all()]


async def get_branches(
    db: AsyncSession, name: str, city: str, org_type: Optional[OrgType] = None
) -> list[Organization]:
    """Kurum + il için şubeleri döndürür (dropdown 3. seviye)."""
    q = (
        select(Organization)
        .where(Organization.name == name, Organization.city == city)
        .order_by(Organization.district)
    )
    if org_type:
        q = q.where(Organization.org_type == org_type)
    return (await db.execute(q)).scalars().all()


async def get_by_id(db: AsyncSession, org_id) -> Optional[Organization]:
    return (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
