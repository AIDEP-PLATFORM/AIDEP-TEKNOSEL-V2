from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from models.user import UserRole


class AdminOrganizationInfo(BaseModel):
    id: UUID
    name: str
    city: str
    district: str

    model_config = {"from_attributes": True}


class AdminNgoManagerInfo(BaseModel):
    organization: Optional[AdminOrganizationInfo] = None
    activity_areas: list[str]
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminNgoStaffInfo(BaseModel):
    organization: Optional[AdminOrganizationInfo] = None

    model_config = {"from_attributes": True}


class AdminOfficialInfo(BaseModel):
    organization: Optional[AdminOrganizationInfo] = None
    registration_number: str
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminVolunteerInfo(BaseModel):
    organization: Optional[AdminOrganizationInfo] = None
    skills: list[str]
    skills_completed: bool
    is_available: bool

    model_config = {"from_attributes": True}


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: str
    tc_no: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    ngo_manager_profile: Optional[AdminNgoManagerInfo] = None
    ngo_staff_profile: Optional[AdminNgoStaffInfo] = None
    official_profile: Optional[AdminOfficialInfo] = None
    volunteer_profile: Optional[AdminVolunteerInfo] = None

    model_config = {"from_attributes": True}


class ApproveResponse(BaseModel):
    message: str
    user_id: UUID
    is_active: bool
