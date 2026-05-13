from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DamagePhotoResponse(BaseModel):
    """Hasar fotoğrafı yükleme yanıtı."""

    id: UUID
    request_id: UUID
    uploaded_by: Optional[UUID]
    minio_key: str
    original_filename: Optional[str]

    # YOLOv8 analiz sonuçları
    damage_score: Optional[float]
    damage_labels: Optional[dict]

    # Fotoğraf konumu
    latitude: Optional[float]
    longitude: Optional[float]

    created_at: datetime

    # Analizin başarılı olup olmadığını gösteren yardımcı alan
    analysis_success: bool = True

    model_config = {"from_attributes": True}
