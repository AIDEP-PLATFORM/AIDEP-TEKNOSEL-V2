from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from models.user import UserRole


# ─── Ortak validator mixin ─────────────────────────────────────

def _validate_tc(v: str) -> str:
    v = v.strip()
    if not v.isdigit() or len(v) != 11:
        raise ValueError("TC Kimlik No 11 haneli sayıdan oluşmalıdır")
    return v


def _validate_phone(v: str) -> str:
    v = v.strip()
    if not v.startswith("+"):
        raise ValueError("Telefon numarası + ile başlamalı (örn: +905551234567)")
    if not v[1:].isdigit():
        raise ValueError("Geçersiz telefon numarası")
    return v


def _validate_password(v: str) -> str:
    if len(v) < 6:
        raise ValueError("Şifre en az 6 karakter olmalı")
    return v


# ─── Request Schemas ───────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Vatandaş ve Gönüllü ortak kayıt formu.
    organization_id verilirse → VOLUNTEER, verilmezse → CITIZEN.
    """
    tc_no: str
    full_name: str
    email: EmailStr
    phone: str
    password: str
    password_confirm: str
    organization_id: Optional[UUID] = None

    @field_validator("tc_no")
    @classmethod
    def v_tc(cls, v): return _validate_tc(v)

    @field_validator("phone")
    @classmethod
    def v_phone(cls, v): return _validate_phone(v)

    @field_validator("password")
    @classmethod
    def v_pw(cls, v): return _validate_password(v)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Şifreler eşleşmiyor")
        return self


class NgoManagerRegisterRequest(BaseModel):
    """STK Yönetim Görevlisi — admin onayı gerekir."""
    tc_no: str
    full_name: str
    organization_id: UUID
    email: EmailStr
    phone: str
    password: str
    password_confirm: str
    activity_areas: list[str]
    address: Optional[str] = None

    @field_validator("tc_no")
    @classmethod
    def v_tc(cls, v): return _validate_tc(v)

    @field_validator("phone")
    @classmethod
    def v_phone(cls, v): return _validate_phone(v)

    @field_validator("password")
    @classmethod
    def v_pw(cls, v): return _validate_password(v)

    @field_validator("activity_areas")
    @classmethod
    def v_areas(cls, v):
        if not v:
            raise ValueError("En az bir faaliyet alanı seçilmelidir")
        return [a.strip() for a in v if a.strip()]

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Şifreler eşleşmiyor")
        return self


class NgoStaffRegisterRequest(BaseModel):
    """STK Saha Görevlisi (yalnızca mobil) — yönetici onayı gerekir."""
    tc_no: str
    full_name: str
    organization_id: UUID
    email: EmailStr
    phone: str
    password: str
    password_confirm: str

    @field_validator("tc_no")
    @classmethod
    def v_tc(cls, v): return _validate_tc(v)

    @field_validator("phone")
    @classmethod
    def v_phone(cls, v): return _validate_phone(v)

    @field_validator("password")
    @classmethod
    def v_pw(cls, v): return _validate_password(v)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Şifreler eşleşmiyor")
        return self


class OfficialRegisterRequest(BaseModel):
    """Resmi kurum (AFAD, UMKE vb.) çalışanı kayıt formu.
    Sicil no başı '1' → OFFICIAL_MANAGER (web+mobil)
    Sicil no başı ≠'1' → OFFICIAL_STAFF (sadece mobil)
    Onay mekanizması yok — sicil numarası yeterli doğrulama.
    """
    tc_no: str
    full_name: str
    phone: str
    email: EmailStr
    password: str
    password_confirm: str
    organization_id: UUID   # OFFICIAL tipindeki kurum şubesi
    address: Optional[str] = None
    registration_number: str  # 10 haneli sayı, başı '1' → yetkili

    @field_validator("tc_no")
    @classmethod
    def v_tc(cls, v): return _validate_tc(v)

    @field_validator("phone")
    @classmethod
    def v_phone(cls, v): return _validate_phone(v)

    @field_validator("password")
    @classmethod
    def v_pw(cls, v): return _validate_password(v)

    @field_validator("registration_number")
    @classmethod
    def v_reg(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Sicil numarası 10 haneli sayıdan oluşmalıdır")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Şifreler eşleşmiyor")
        return self


class SkillsUpdateRequest(BaseModel):
    """Gönüllünün ilk giriş popup'ında doldurduğu beceri formu."""
    skills: list[str]

    @field_validator("skills")
    @classmethod
    def skills_not_empty(cls, v):
        if not v:
            raise ValueError("En az bir beceri seçilmelidir")
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("En az bir beceri seçilmelidir")
        return cleaned


class LocationUpdateRequest(BaseModel):
    """Mobil uygulamanın anlık konum güncellemesi için."""
    latitude: float
    longitude: float


# ─── Login ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    platform: Literal["web", "mobile"] = "mobile"


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


class OrganizationBriefResponse(BaseModel):
    id: UUID
    name: str
    city: str
    district: str

    model_config = {"from_attributes": True}


class VolunteerProfileResponse(BaseModel):
    organization_id: Optional[UUID]
    organization: Optional[OrganizationBriefResponse]
    skills: list[str]
    skills_completed: bool
    is_available: bool
    active_task_count: int

    model_config = {"from_attributes": True}


class NgoManagerProfileResponse(BaseModel):
    organization_id: UUID
    organization: OrganizationBriefResponse
    activity_areas: list[str]
    address: Optional[str]

    model_config = {"from_attributes": True}


class NgoStaffProfileResponse(BaseModel):
    organization_id: UUID
    organization: OrganizationBriefResponse

    model_config = {"from_attributes": True}


class OfficialProfileResponse(BaseModel):
    organization_id: UUID
    organization: OrganizationBriefResponse
    registration_number: str
    address: Optional[str]

    model_config = {"from_attributes": True}


class MeResponse(UserResponse):
    volunteer_profile: Optional[VolunteerProfileResponse] = None
    ngo_manager_profile: Optional[NgoManagerProfileResponse] = None
    ngo_staff_profile: Optional[NgoStaffProfileResponse] = None
    official_profile: Optional[OfficialProfileResponse] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
