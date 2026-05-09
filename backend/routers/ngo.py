from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from pydantic import BaseModel

from core.database import get_db
from models.user import NgoProfile

router = APIRouter(prefix="/ngos", tags=["NGO"])


class NgoListItem(BaseModel):
    id: UUID
    organization_name: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[NgoListItem])
async def list_ngos(db: AsyncSession = Depends(get_db)):
    """Kayıtlı STK listesi — gönüllü kayıt ekranı dropdown için"""
    result = await db.execute(
        select(NgoProfile).order_by(NgoProfile.organization_name)
    )
    return result.scalars().all()
