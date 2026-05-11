from pydantic import BaseModel, Field
from uuid import UUID


class DamageDetectionRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    report_id: UUID | None = None


class DetectionItem(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: list[float] = Field(..., min_length=4, max_length=4)
    damage_score: float = Field(..., ge=0.0, le=1.0)


class DamageDetectionResponse(BaseModel):
    report_id: UUID | None
    detections: list[DetectionItem]
    road_damage_score: float = Field(..., ge=0.0, le=1.0)
    building_damage_score: float = Field(..., ge=0.0, le=1.0)
    grid_cell_id: str
    grid_confirmed_count: int
    grid_aggregated_score: float = Field(..., ge=0.0, le=1.0)
    is_confirmed: bool
    model_source: str = Field(..., description="yolov8m | mock")


class DamageMapCell(BaseModel):
    grid_cell_id: str
    latitude: float
    longitude: float
    aggregated_score: float
    report_count: int
    is_confirmed: bool
