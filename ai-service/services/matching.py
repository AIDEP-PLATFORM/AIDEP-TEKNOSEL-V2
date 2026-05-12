import asyncio
import logging
import math
from uuid import UUID

import httpx

from core.config import settings
from schemas.priority import MatchRequest, VolunteerInfo, Assignment, MatchResponse
from services.damage_detection import get_grid_score

logger = logging.getLogger(__name__)

# Composite skor ağırlıkları (toplam = 1.0)
_W_SAFETY = 0.45   # rota güvenliği — en kritik (afet bölgesine giden yol)
_W_SPEED  = 0.30   # varış süresi   — altın saat kavramı
_W_SKILL  = 0.15   # beceri uyumu   — doğru kişi doğru iş
_W_LOAD   = 0.10   # yük dengesi    — tükenmişliği önle

_MAX_DISTANCE_KM  = 50.0
_MAX_ACTIVE_TASKS = 3


async def _fetch_osrm_route(
    client: httpx.AsyncClient,
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
) -> dict | None:
    url = (
        f"{settings.OSRM_URL}/route/v1/driving/"
        f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    )
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
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
    return {
        "distance_km":      round(dist, 3),
        "duration_minutes": round(dist / 40.0 * 60, 2),
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
    origin_dmg, dest_dmg = await asyncio.gather(
        get_grid_score(origin_lat, origin_lon),
        get_grid_score(dest_lat, dest_lon),
    )
    route_dmg = origin_dmg * 0.25 + dest_dmg * 0.50 + area_damage_score * 0.25
    return round(max(0.0, 1.0 - route_dmg), 4)


def _skill_score(volunteer_skills: list[str], required_skills: list[str]) -> float:
    if not required_skills:
        return 1.0
    matched = sum(1 for s in required_skills if s in volunteer_skills)
    return round(matched / len(required_skills), 4)


def _load_score(active_task_count: int) -> float:
    return round(max(0.0, 1.0 - active_task_count / _MAX_ACTIVE_TASKS), 4)


async def _evaluate_volunteer(
    client: httpx.AsyncClient,
    req: MatchRequest,
    vol: VolunteerInfo,
) -> Assignment | None:
    """Tek gönüllü–talep çiftini değerlendirir. Uygun değilse None döner."""
    straight_dist = _haversine(vol.latitude, vol.longitude, req.latitude, req.longitude)
    if straight_dist > _MAX_DISTANCE_KM:
        return None

    route, safety = await asyncio.gather(
        _fetch_osrm_route(client, vol.latitude, vol.longitude, req.latitude, req.longitude),
        _route_safety_score(vol.latitude, vol.longitude, req.latitude, req.longitude, req.area_damage_score),
    )
    if route is None:
        return None

    speed = 1.0 / (1.0 + route["duration_minutes"] / 60.0)
    skill = _skill_score(vol.skills, req.required_skills)
    load  = _load_score(vol.active_task_count)

    composite = (
        _W_SAFETY * safety +
        _W_SPEED  * speed  +
        _W_SKILL  * skill  +
        _W_LOAD   * load
    )

    return Assignment(
        request_id=req.request_id,
        volunteer_id=vol.volunteer_id,
        route_distance_km=route["distance_km"],
        route_duration_minutes=route["duration_minutes"],
        safety_score=safety,
        composite_score=round(composite, 4),
        route_geometry=route["geometry"],
    )


async def match_volunteers(
    requests: list[MatchRequest],
    volunteers: list[VolunteerInfo],
) -> MatchResponse:
    sorted_requests = sorted(requests, key=lambda r: r.priority_score, reverse=True)

    assigned_volunteers: set[UUID] = set()
    assignments: list[Assignment] = []
    unmatched: list[UUID] = []

    async with httpx.AsyncClient(timeout=5.0) as client:
        for req in sorted_requests:
            candidates = [
                v for v in volunteers
                if v.volunteer_id not in assigned_volunteers
                and v.active_task_count < _MAX_ACTIVE_TASKS
            ]

            if not candidates:
                unmatched.append(req.request_id)
                continue

            # Tüm adayları paralel değerlendir
            results = await asyncio.gather(
                *[_evaluate_volunteer(client, req, vol) for vol in candidates],
                return_exceptions=True,
            )

            best: Assignment | None = None
            for res in results:
                if isinstance(res, Exception) or res is None:
                    continue
                if best is None or res.composite_score > best.composite_score:
                    best = res

            if best:
                assignments.append(best)
                assigned_volunteers.add(best.volunteer_id)
                logger.info(
                    "Eslestirme | request=%s → volunteer=%s composite=%.3f",
                    req.request_id, best.volunteer_id, best.composite_score,
                )
            else:
                unmatched.append(req.request_id)
                logger.warning("Eslestirme basarisiz | request=%s", req.request_id)

    return MatchResponse(
        assignments=assignments,
        unmatched_request_ids=unmatched,
        algorithm="enhanced_greedy",
    )
