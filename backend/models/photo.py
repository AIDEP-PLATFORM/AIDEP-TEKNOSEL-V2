import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class DamagePhoto(Base):
    """Yardım talebine eklenen hasar fotoğrafı.

    Herhangi bir kayıtlı kullanıcı yükleyebilir.
    YOLOv8 analizi sonucunda damage_score ve damage_labels doldurulur.
    request_id üzerinden ilişkili HelpRequest.area_damage_score güncellenir.
    """

    __tablename__ = "damage_photos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # İlişkili talep
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("help_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Yükleyen kullanıcı
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # MinIO'daki nesne anahtarı  (ör. "damage-photos/<request_id>/<photo_id>.jpg")
    minio_key: Mapped[str] = mapped_column(String(512), nullable=False)

    # Orijinal dosya adı
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # YOLOv8 analiz sonuçları
    damage_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    damage_labels: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Fotoğrafın çekildiği konum (isteğe bağlı)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    help_request = relationship("HelpRequest", back_populates="photos")

    def __repr__(self) -> str:
        return f"<DamagePhoto id={self.id} request={self.request_id} score={self.damage_score}>"
