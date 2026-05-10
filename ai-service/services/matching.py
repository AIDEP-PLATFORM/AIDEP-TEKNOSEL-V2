import logging
import math
from uuid import UUID

import httpx

from core.config import settings
from schemas.priority import MatchRequest, VolunteerInfo, Assignment, MatchResponse
from services.damage_detection import get_grid_score

logger = logging.getLogger(__name__)

_W_SAFETY = 0.7
_W_SPEED  = 0.3
_MAX_DISTANCE_KM = 50.0


async def _fetch_osrm_route(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
) -> dict | None:
    url = (
        f"{settings.OSRM_URL}/route/v1/driving/"
        f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    )
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            return None

        route = data["routes"][0]
        return {
            "distance_km":      round(route["distance"] / 1000, 3),
            "duration_minutes": round(route["duration"] / 60, 2),
            "geometry":         route.get("geometry"),
        }
    except Exception as exc:
        logger.warning("OSRM erisim hatasi: %s — mock rota kullaniliyor", exc)
        return _mock_route(origin_lat, origin_lon, dest_lat, dest_lon)


def _mock_route(olat: float, olon: float, dlat: float, dlon: float) -> dict:
    dist = _haversine(olat, olon, dlat, dlon)
    duration = dist / 40.0 * 60
    return {
        "distance_km":      round(dist, 3),
        "duration_minutes": round(duration, 2),
        "geometry":         None,
    }


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


async def _route_safety_score(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
    area_damage_score: float,
) -> float:
    origin_dmg = await get_grid_score(origin_lat, origin_lon)
    dest_dmg   = await get_grid_score(dest_lat,   dest_lon)
    route_dmg  = (origin_dmg + dest_dmg + area_damage_score) / 3.0
    return round(max(0.0, 1.0 - route_dmg), 4)


def _skill_multiplier(volunteer_skills: list[str], required_skills: list[str]) -> float:
    if not required_skills:
        return 1.0
    matched = sum(1 for s in required_skills if s in volunteer_skills)
    ratio = matched / len(required_skills)
    return round(0.5 + 0.5 * ratio, 4)


async def match_volunteers(
    requests: list[MatchRequest],
    volunteers: list[VolunteerInfo],
) -> MatchResponse:
    sorted_requests = sorted(requests, key=lambda r: r.priority_score, reverse=True)

    assigned_volunteers: set[UUID] = set()
    assignments: list[Assignment] = []
    unmatched: list[UUID] = []

    for req in sorted_requests:
        best_assignment: Assignment | None = None
        best_composite = -1.0

        for vol in volunteers:
            if vol.volunteer_id in assigned_volunteers:
                continue
            if vol.active_task_count >= 3:
                continue

            straight_dist = _haversine(vol.latitude, vol.longitude, req.latitude, req.longitude)
            if straight_dist > _MAX_DISTANCE_KM:
                continue

            route = await _fetch_osrm_route(
                vol.latitude, vol.longitude,
                req.latitude, req.longitude,
            )
            if route is None:
                continue

            safety = await _route_safety_score(
                vol.latitude, vol.longitude,
                req.latitude, req.longitude,
                req.area_damage_score,
            )

            speed = 1.0 / (1.0 + route["duration_minutes"] / 60.0)
            skill_mult = _skill_multiplier(vol.skills, req.required_skills)
            composite = (_W_SAFETY * safety + _W_SPEED * speed) * skill_mult

            if composite > best_composite:
                best_composite = composite
                best_assignment = Assignment(
                    request_id=req.request_id,
                    volunteer_id=vol.volunteer_id,
                    route_distance_km=route["distance_km"],
                    route_duration_minutes=route["duration_minutes"],
                    safety_score=safety,
                    composite_score=round(composite, 4),
                    route_geometry=route["geometry"],
                )

        if best_assignment:
            assignments.append(best_assignment)
            assigned_volunteers.add(best_assignment.volunteer_id)
            logger.info(
                "Eslestirme | request=%s → volunteer=%s composite=%.3f",
                req.request_id, best_assignment.volunteer_id, best_assignment.composite_score,
            )
        else:
            unmatched.append(req.request_id)
            logger.warning("Eslestirme basarisiz | request=%s", req.request_id)

    return MatchResponse(
        assignments=assignments,
        unmatched_request_ids=unmatched,
        algorithm="enhanced_greedy",
    )
