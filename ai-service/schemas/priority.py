from enum import IntEnum
from pydantic import BaseModel, Field
from uuid import UUID


class NeedType(IntEnum):
    RESCUE  = 0
    MEDICAL = 1
    SHELTER = 2
    FOOD    = 3
    OTHER   = 4


class PriorityRequest(BaseModel):
    request_id: UUID
    urgency_level: int = Field(..., ge=1, le=5)
    wait_time_minutes: int = Field(..., ge=0)
    distance_km: float = Field(..., ge=0.0)
    need_type: NeedType
    meteorology_score: float = Field(..., ge=0.0, le=1.0)
    person_count: int = Field(..., ge=1)
    area_damage_score: float = Field(..., ge=0.0, le=1.0)


class PriorityResponse(BaseModel):
    request_id: UUID
    priority_score: float = Field(..., ge=0.0, le=100.0)
    priority_class: str
    model_source: str


class VolunteerInfo(BaseModel):
    volunteer_id: UUID
    latitude: float
    longitude: float
    skills: list[str] = []
    active_task_count: int = 0


class MatchRequest(BaseModel):
    request_id: UUID
    latitude: float
    longitude: float
    priority_score: float
    required_skills: list[str] = []
    area_damage_score: float = Field(0.0, ge=0.0, le=1.0)


class Assignment(BaseModel):
    request_id: UUID
    volunteer_id: UUID
    route_distance_km: float
    route_duration_minutes: float
    safety_score: float = Field(..., ge=0.0, le=1.0)
    composite_score: float
    route_geometry: dict | None = None


class MatchResponse(BaseModel):
    assignments: list[Assignment]
    unmatched_request_ids: list[UUID] = []
    algorithm: str = "enhanced_greedy"


class MatchPayload(BaseModel):
    requests: list[MatchRequest]
    volunteers: list[VolunteerInfo]
