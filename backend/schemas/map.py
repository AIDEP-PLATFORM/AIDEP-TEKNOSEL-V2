from pydantic import BaseModel
from typing import Optional


class EarthquakePoint(BaseModel):
    event_id: str
    latitude: float
    longitude: float
    magnitude: float
    depth: float
    location: str
    occurred_at: str


class SafeAreaPoint(BaseModel):
    osm_id: int
    latitude: float
    longitude: float
    name: Optional[str] = None
    capacity: Optional[str] = None


class TeamLocation(BaseModel):
    team_id: str
    team_name: str
    latitude: float
    longitude: float
    member_count: int
    located_member_count: int
    active_task_count: int
    organization_name: Optional[str] = None
    organization_city: Optional[str] = None
    organization_district: Optional[str] = None


class MapEarthquakesResponse(BaseModel):
    count: int
    cached: bool
    data: list[EarthquakePoint]


class MapSafeAreasResponse(BaseModel):
    count: int
    cached: bool
    data: list[SafeAreaPoint]


class MapTeamsResponse(BaseModel):
    count: int
    data: list[TeamLocation]
