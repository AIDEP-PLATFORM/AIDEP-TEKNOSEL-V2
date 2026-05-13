"""
OSRM rota servisi.

- get_best_route(): 3 alternatif rota ister, hasar noktalarından en uzak olanı seçer.
- route_distance_km(): iki koordinat arasındaki OSRM mesafesini km olarak döner.
- Hasar noktaları: OSRM güzergah koordinatlarından 500m içinde olan noktalar "tehlikeli" sayılır.
"""
import logging
import math
from typing import Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

DAMAGE_AVOID_RADIUS_M = 500  # Hasar noktası etki yarıçapı (metre)


# ─── Haversine ─────────────────────────────────────────────────

def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """İki GPS koordinatı arasındaki mesafeyi metre cinsinden hesaplar."""
    R = 6_371_000  # Dünya yarıçapı (metre)
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _route_damage_score(
    route_coords: list[list[float]],
    blocked_points: list[tuple[float, float]],
) -> int:
    """
    Bir rotanın hasar noktalarına yakınlığını sayar.
    route_coords: [[lon, lat], ...] — OSRM formatı
    blocked_points: [(lat, lon), ...]
    """
    if not blocked_points:
        return 0
    score = 0
    for lon, lat in route_coords:
        for blat, blon in blocked_points:
            if _haversine_m(lat, lon, blat, blon) <= DAMAGE_AVOID_RADIUS_M:
                score += 1
                break  # Aynı rota noktasını birden fazla sayma
    return score


# ─── OSRM API ──────────────────────────────────────────────────

async def get_best_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    blocked_points: Optional[list[tuple[float, float]]] = None,
    include_steps: bool = False,
) -> Optional[dict]:
    """
    OSRM'den 3 alternatif rota ister.
    Hasar noktalarından en uzak rotayı seçer.

    Dönüş:
        {
            "distance_km": float,
            "duration_min": float,
            "geometry": [[lon, lat], ...],
            "damage_score": int,
            "steps": [                        # include_steps=True ise
                {
                    "instruction": "Sağa dönün",
                    "street_name": "Atatürk Caddesi",
                    "distance_m": 320,
                    "duration_s": 45,
                    "location": [lon, lat],
                    "maneuver": "turn"
                }, ...
            ]
        }
    Ya da OSRM erişilemezse None.
    """
    blocked_points = blocked_points or []
    steps_param = "true" if include_steps else "false"
    url = (
        f"{settings.OSRM_URL}/route/v1/driving/"
        f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        f"?alternatives=3&overview=full&geometries=geojson&steps={steps_param}"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("OSRM unavailable (%s), falling back to straight-line distance", exc)
        return None

    routes = data.get("routes", [])
    if not routes:
        return None

    best = None
    best_score = float("inf")
    best_raw = None

    for route in routes:
        coords: list[list[float]] = route["geometry"]["coordinates"]
        score = _route_damage_score(coords, blocked_points)
        if score < best_score:
            best_score = score
            best_raw = route
            best = {
                "distance_km": route["distance"] / 1000,
                "duration_min": route["duration"] / 60,
                "geometry": coords,
                "damage_score": score,
                "steps": [],
            }

    if best and include_steps and best_raw:
        best["steps"] = _parse_steps(best_raw)

    logger.info(
        "OSRM best route: %.1f km, %.0f min, damage_score=%d (from %d alternatives)",
        best["distance_km"], best["duration_min"], best["damage_score"], len(routes),
    )
    return best


def _parse_steps(route: dict) -> list[dict]:
    """OSRM rota adımlarını mobil uygulamanın anlayacağı formata çevirir."""
    steps = []
    _MANEUVER_TR = {
        "turn":             {"right": "Sağa dönün", "left": "Sola dönün",
                             "slight right": "Hafif sağa dönün", "slight left": "Hafif sola dönün",
                             "sharp right": "Keskin sağa dönün", "sharp left": "Keskin sola dönün",
                             "straight": "Düz devam edin", "uturn": "Geri dönün"},
        "new name":         {"": "Yolda devam edin"},
        "depart":           {"": "Başlangıç noktasından hareket edin"},
        "arrive":           {"": "Hedefe ulaştınız"},
        "merge":            {"": "Yola katılın"},
        "on ramp":          {"right": "Sağdan gidin", "left": "Soldan gidin"},
        "off ramp":         {"right": "Sağdan çıkın", "left": "Soldan çıkın"},
        "fork":             {"right": "Sağdaki yoldan devam edin", "left": "Soldaki yoldan devam edin"},
        "end of road":      {"right": "Sağa dönün", "left": "Sola dönün"},
        "roundabout":       {"": "Dönel kavşağa girin"},
        "rotary":           {"": "Dönel kavşağa girin"},
        "roundabout turn":  {"right": "Dönel kavşaktan sağa çıkın", "left": "Dönel kavşaktan sola çıkın"},
        "notification":     {"": "Devam edin"},
    }

    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            maneuver = step.get("maneuver", {})
            mtype    = maneuver.get("type", "")
            modifier = maneuver.get("modifier", "")
            location = maneuver.get("location", [0, 0])

            # Türkçe talimat bul
            type_map = _MANEUVER_TR.get(mtype, {})
            instruction = (
                type_map.get(modifier)
                or type_map.get("")
                or f"{mtype} {modifier}".strip().capitalize()
            )

            street = step.get("name", "") or step.get("ref", "") or ""

            steps.append({
                "instruction": instruction,
                "street_name": street,
                "distance_m": int(step.get("distance", 0)),
                "duration_s": int(step.get("duration", 0)),
                "location": location,      # [lon, lat]
                "maneuver": mtype,
            })

    return steps


async def route_distance_km(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> float:
    """
    İki nokta arasındaki OSRM yol mesafesini km olarak döner.
    OSRM erişilemezse haversine ile kuş uçuşu mesafe (× 1.4 düzeltme faktörü) kullanılır.
    """
    route = await get_best_route(origin_lat, origin_lon, dest_lat, dest_lon)
    if route:
        return route["distance_km"]

    # Fallback: haversine × düzeltme faktörü
    m = _haversine_m(origin_lat, origin_lon, dest_lat, dest_lon)
    return (m / 1000) * 1.4
