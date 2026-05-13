from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

from models.user import UserRole


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)


class TeamMemberAdd(BaseModel):
    user_id: UUID


class TeamMemberResponse(BaseModel):
    user_id: UUID
    full_name: str
    role: UserRole
    has_location: bool

    model_config = {"from_attributes": True}


class TeamResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: Optional[str]
    active_task_count: int
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamDetailResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: Optional[str]
    active_task_count: int
    created_at: datetime
    members: list[TeamMemberResponse]

    model_config = {"from_attributes": True}
