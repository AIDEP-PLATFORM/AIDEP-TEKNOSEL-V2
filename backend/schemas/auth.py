from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from models.user import UserRole


# ─── Request Schemas ───────────────────────────────────────────

class CitizenRegisterRequest(BaseModel):
    email: EmailStr
    phone: str
    password: str
    full_name: str

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("+"):
            raise ValueError("Telefon numarası + ile başlamalı (örn: +905551234567)")
        if not v[1:].isdigit():
            raise ValueError("Geçersiz telefon numarası")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Şifre en az 6 karakter olmalı")
        return v


class VolunteerRegisterRequest(CitizenRegisterRequest):
    skills: list[str] = []
    preferred_ngo_id: Optional[UUID] = None


class NgoRegisterRequest(CitizenRegisterRequest):
    organization_name: str
    authorization_number: str


# ─── Login ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Response Schemas ──────────────────────────────────────────

class UserResponse(BaseModel):
    id: UUID
    email: str
    phone: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VolunteerProfileResponse(BaseModel):
    skills: list[str]
    is_available: bool
    active_task_count: int
    preferred_ngo_id: Optional[UUID]

    model_config = {"from_attributes": True}


class NgoProfileResponse(BaseModel):
    organization_name: str
    authorization_number: str

    model_config = {"from_attributes": True}


class MeResponse(UserResponse):
    volunteer_profile: Optional[VolunteerProfileResponse] = None
    ngo_profile: Optional[NgoProfileResponse] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
