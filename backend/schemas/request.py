from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

from models.request import NeedType, RequestStatus, AssignmentStatus


# ─── Talep Oluşturma ────────────────────────────────────────────

class HelpRequestCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    need_type: NeedType
    urgency_level: int = Field(..., ge=1, le=5, description="1=Düşük, 5=Kritik")
    person_count: int = Field(..., ge=1)
    description: Optional[str] = Field(None, max_length=1000)


# ─── Response Şemaları ──────────────────────────────────────────

class AssignmentResponse(BaseModel):
    id: UUID
    team_id: Optional[UUID]
    route_distance_km: float
    route_duration_minutes: float
    safety_score: float
    composite_score: float
    route_geometry: Optional[list] = None   # [[lon, lat], ...]
    route_steps: Optional[list] = None      # Adım adım yönlendirme talimatları
    status: AssignmentStatus
    assigned_at: datetime

    model_config = {"from_attributes": True}


class HelpRequestResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    latitude: float
    longitude: float
    need_type: NeedType
    urgency_level: int
    person_count: int
    description: Optional[str]
    status: RequestStatus
    priority_score: Optional[float]
    area_damage_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    assignment: Optional[AssignmentResponse] = None
    photo_count: int = 0

    model_config = {"from_attributes": True}


# ─── Durum Güncelleme ───────────────────────────────────────────

class AssignmentStatusUpdate(BaseModel):
    """Gönüllünün görev durumunu güncellemesi için (EN_ROUTE, COMPLETED)."""
    status: AssignmentStatus


# ─── Eşleştirme Tetikleme ───────────────────────────────────────

class MatchingRunResponse(BaseModel):
    matched: int
    unmatched: int
    total_requests: int
    total_volunteers: int
    message: str
