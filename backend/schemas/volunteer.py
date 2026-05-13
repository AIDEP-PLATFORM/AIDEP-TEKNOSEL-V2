from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

from models.user import UserRole


class OrgMemberResponse(BaseModel):
    """NGO yöneticisinin kendi organizasyonundaki üyeleri görmesi için."""
    id: UUID
    full_name: str
    email: str
    phone: str
    role: UserRole
    is_active: bool
    skills: list[str]           # NGO_STAFF için boş liste döner
    active_task_count: int      # NGO_STAFF için 0 döner
    has_location: bool          # Konumu güncel mi?
    created_at: datetime

    model_config = {"from_attributes": True}
