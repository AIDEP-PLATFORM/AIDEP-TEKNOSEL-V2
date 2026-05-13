import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    String, Boolean, Integer, Float, Text, DateTime,
    Enum, ForeignKey, func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from core.database import Base


class NeedType(str, enum.Enum):
    RESCUE  = "RESCUE"   # Enkaz / Kurtarma
    MEDICAL = "MEDICAL"  # Tıbbi yardım
    SHELTER = "SHELTER"  # Barınma
    FOOD    = "FOOD"     # Gıda / Su
    OTHER   = "OTHER"    # Diğer


class RequestStatus(str, enum.Enum):
    PENDING   = "PENDING"    # Oluşturuldu, henüz skorlanmadı/atanmadı
    SCORED    = "SCORED"     # XGBoost skoru hesaplandı
    ASSIGNED  = "ASSIGNED"   # Gönüllü atandı
    EN_ROUTE  = "EN_ROUTE"   # Gönüllü yolda
    COMPLETED = "COMPLETED"  # Tamamlandı
    CANCELLED = "CANCELLED"  # İptal edildi


class AssignmentStatus(str, enum.Enum):
    ASSIGNED  = "ASSIGNED"
    EN_ROUTE  = "EN_ROUTE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class HelpRequest(Base):
    __tablename__ = "help_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,  # kullanıcı silinse bile talep kalsın
    )

    # Konum
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location = mapped_column(
        Geometry("POINT", srid=4326), nullable=False
    )

    # Talep bilgileri
    need_type: Mapped[NeedType] = mapped_column(
        Enum(NeedType, name="needtype"), nullable=False
    )
    urgency_level: Mapped[int] = mapped_column(
        Integer, nullable=False  # 1-5
    )
    person_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Durum
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="requeststatus"),
        nullable=False,
        default=RequestStatus.PENDING,
    )

    # AI skorları (AI service'ten gelir)
    priority_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_damage_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    assignment: Mapped["Assignment"] = relationship(
        "Assignment", back_populates="help_request",
        uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<HelpRequest id={self.id} need={self.need_type} status={self.status}>"


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("help_requests.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
    )

    # AI service'ten gelen eşleştirme verileri
    route_distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    route_duration_minutes: Mapped[float] = mapped_column(Float, nullable=False)
    safety_score: Mapped[float] = mapped_column(Float, nullable=False)
    composite_score: Mapped[float] = mapped_column(Float, nullable=False)
    route_geometry = mapped_column(JSONB, nullable=True)  # OSRM GeoJSON

    status: Mapped[AssignmentStatus] = mapped_column(
        Enum(AssignmentStatus, name="assignmentstatus"),
        nullable=False,
        default=AssignmentStatus.ASSIGNED,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    help_request: Mapped["HelpRequest"] = relationship(
        "HelpRequest", back_populates="assignment"
    )

    def __repr__(self) -> str:
        return f"<Assignment request={self.request_id} team={self.team_id}>"
