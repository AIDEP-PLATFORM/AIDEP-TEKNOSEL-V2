from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from models.user import OrgType


class OrganizationCreateRequest(BaseModel):
    """Admin panelinden kurum şubesi eklerken kullanılır."""
    name: str           # AKUT, AFAD vb.
    city: str           # Konya
    district: str       # Selçuklu
    org_type: OrgType = OrgType.STK  # STK (varsayılan) veya OFFICIAL


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    city: str
    district: str
    org_type: OrgType
    created_at: datetime

    model_config = {"from_attributes": True}
