import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    String, Boolean, Integer, DateTime,
    Enum, ForeignKey, ARRAY, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from core.database import Base


class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    VOLUNTEER = "VOLUNTEER"
    NGO_MANAGER = "NGO_MANAGER"       # STK yönetim görevlisi — admin onaylar
    NGO_STAFF = "NGO_STAFF"           # STK saha görevlisi — yönetici onaylar
    OFFICIAL_MANAGER = "OFFICIAL_MANAGER"  # Resmi yetkili (sicil başı 1) — web+mobil
    OFFICIAL_STAFF = "OFFICIAL_STAFF"     # Resmi personel (sicil başı ≠1) — sadece mobil
    ADMIN = "ADMIN"


class OrgType(str, enum.Enum):
    STK = "STK"           # AKUT, Kızılay (gönüllü bazlı)
    OFFICIAL = "OFFICIAL" # AFAD, UMKE, Kızılay resmi (devlet kurumu)


# ─── Organization (Kurum Şubesi) ────────────────────────────────
# Admin panelinden eklenir. Her kayıt tek bir şubeyi temsil eder.
# Örn: AKUT / Konya / Selçuklu  ya da  AFAD / Konya / Selçuklu

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    org_type: Mapped[OrgType] = mapped_column(
        Enum(OrgType, name="orgtype"), nullable=False, default=OrgType.STK
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    ngo_manager_profiles: Mapped[list["NgoManagerProfile"]] = relationship(
        "NgoManagerProfile", back_populates="organization"
    )
    ngo_staff_profiles: Mapped[list["NgoStaffProfile"]] = relationship(
        "NgoStaffProfile", back_populates="organization"
    )
    volunteers: Mapped[list["VolunteerProfile"]] = relationship(
        "VolunteerProfile", back_populates="organization"
    )
    official_profiles: Mapped[list["OfficialProfile"]] = relationship(
        "OfficialProfile", back_populates="organization"
    )

    def __repr__(self) -> str:
        return f"<Organization {self.org_type} {self.name}/{self.city}/{self.district}>"


# ─── User ───────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    phone: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    tc_no: Mapped[str | None] = mapped_column(
        String(11), nullable=True
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    current_location = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )
    fcm_token: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    volunteer_profile: Mapped["VolunteerProfile"] = relationship(
        "VolunteerProfile", back_populates="user",
        uselist=False, cascade="all, delete-orphan"
    )
    ngo_manager_profile: Mapped["NgoManagerProfile"] = relationship(
        "NgoManagerProfile", back_populates="user",
        uselist=False, cascade="all, delete-orphan"
    )
    ngo_staff_profile: Mapped["NgoStaffProfile"] = relationship(
        "NgoStaffProfile", back_populates="user",
        uselist=False, cascade="all, delete-orphan"
    )
    official_profile: Mapped["OfficialProfile"] = relationship(
        "OfficialProfile", back_populates="user",
        uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"


# ─── NgoManagerProfile ──────────────────────────────────────────

class NgoManagerProfile(Base):
    __tablename__ = "ngo_manager_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    activity_areas: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="ngo_manager_profile")
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="ngo_manager_profiles"
    )


# ─── NgoStaffProfile ────────────────────────────────────────────

class NgoStaffProfile(Base):
    __tablename__ = "ngo_staff_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="ngo_staff_profile")
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="ngo_staff_profiles"
    )


# ─── OfficialProfile ────────────────────────────────────────────
# AFAD, UMKE gibi resmi kurum çalışanları.
# Sicil no başı '1' → OFFICIAL_MANAGER (web+mobil)
# Sicil no başı ≠'1' → OFFICIAL_STAFF (sadece mobil)

class OfficialProfile(Base):
    __tablename__ = "official_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    registration_number: Mapped[str] = mapped_column(
        String(10), unique=True, nullable=False
    )
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="official_profile")
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="official_profiles"
    )

    def __repr__(self) -> str:
        return f"<OfficialProfile user_id={self.user_id} reg={self.registration_number}>"


# ─── VolunteerProfile ───────────────────────────────────────────

class VolunteerProfile(Base):
    __tablename__ = "volunteer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL",
                   name="fk_volunteer_organization"),
        nullable=True,
    )
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )
    skills_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_available: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    active_task_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="volunteer_profile")
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="volunteers"
    )
