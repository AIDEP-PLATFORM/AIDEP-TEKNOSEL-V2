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

DAMAGE_AVOID_RADIUS_M = 250  # Hasar noktası etki yarıçapı (metre)


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

async def _osrm_request(waypoints: list[tuple[float, float]], steps: bool) -> list[dict]:
    """OSRM'e çok noktalı rota isteği atar. waypoints: [(lat, lon), ...]"""
    coords_str = ";".join(f"{lon},{lat}" for lat, lon in waypoints)
    alts = "3" if len(waypoints) == 2 else "false"
    url = (
        f"{settings.OSRM_URL}/route/v1/driving/{coords_str}"
        f"?alternatives={alts}&overview=full&geometries=geojson&steps={'true' if steps else 'false'}"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json().get("routes", [])
    except Exception as exc:
        logger.debug("OSRM isteği başarısız: %s", exc)
        return []


def _build_route_entry(raw: dict, blocked_points: list[tuple[float, float]]) -> dict:
    coords: list[list[float]] = raw["geometry"]["coordinates"]
    return {
        "distance_km":  raw["distance"] / 1000,
        "duration_min": raw["duration"] / 60,
        "geometry":     coords,
        "damage_score": _route_damage_score(coords, blocked_points),
        "steps":        [],
        "_raw":         raw,
    }


def _safe_stopover(
    dest_lat: float,
    dest_lon: float,
    blocked_points: list[tuple[float, float]],
    offset_deg: float = 0.0036,  # ~400 m
) -> list[tuple[float, float]]:
    """
    Hedefe en yakın hasar noktasını bulur.
    O noktanın hedefe göre ters yönünde ~400m uzakta bir ara durak üretir.
    Hem sağ hem sol tarafa birer durak döner (OSRM hangisini kullanabilirse).
    """
    if not blocked_points:
        return []

    # Hedefe en yakın hasar noktası
    nearest = min(blocked_points, key=lambda p: _haversine_m(dest_lat, dest_lon, p[0], p[1]))
    blat, blon = nearest

    # Hasar → hedef yön vektörü (normalize)
    dlat = dest_lat - blat
    dlon = dest_lon - blon
    length = math.sqrt(dlat ** 2 + dlon ** 2)
    if length < 1e-9:
        return []
    nlat = dlat / length
    nlon = dlon / length

    # Hedefe ~400m uzak, hasar noktasının KARŞI yönünde → güvenli taraf
    # (hasar→hedef vektörünün tersine gidiyoruz, yani hasardan kaçıyoruz)
    stop_lat = dest_lat + nlat * offset_deg
    stop_lon = dest_lon + nlon * offset_deg

    # Dik yönde iki seçenek (sağ + sol) → ikisini de dene
    perp_lat, perp_lon = -nlon, nlat
    return [
        (round(stop_lat + perp_lat * offset_deg * 0.5, 6),
         round(stop_lon + perp_lon * offset_deg * 0.5, 6)),
        (round(stop_lat - perp_lat * offset_deg * 0.5, 6),
         round(stop_lon - perp_lon * offset_deg * 0.5, 6)),
    ]


async def get_best_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    blocked_points: Optional[list[tuple[float, float]]] = None,
    include_steps: bool = False,
    user_waypoints: Optional[list[tuple[float, float]]] = None,
) -> Optional[dict]:
    """
    Güvenli rota bulur.

    1) Kullanıcı ara durakları varsa direkt o waypoint'lerden geçer.
    2) Yoksa 3 standart alternatif ister, en az hasarlıyı seçer.
    3) Hâlâ hasarlıysa hedefe ~400m uzak güvenli ara durak ekleyerek tekrar dener.
    """
    import asyncio as _asyncio
    blocked_points = blocked_points or []
    user_waypoints = user_waypoints or []

    # ── 1. Kullanıcı ara durakları varsa direkt kullan ───────────
    if user_waypoints:
        all_wps = [(origin_lat, origin_lon)] + user_waypoints + [(dest_lat, dest_lon)]
        raw_routes = await _osrm_request(all_wps, steps=False)
        if raw_routes:
            best = _build_route_entry(raw_routes[0], blocked_points)
            if include_steps:
                step_raws = await _osrm_request(all_wps, steps=True)
                if step_raws:
                    best["steps"] = _parse_steps(step_raws[0])
            best.pop("_raw", None)
            best["alternatives"] = []
            logger.info(
                "Kullanıcı ara durakları ile rota: %.1f km, damage_score=%d",
                best["distance_km"], best["damage_score"],
            )
            return best

    # ── 2. Standart 3 alternatif ─────────────────────────────────
    raw_routes = await _osrm_request(
        [(origin_lat, origin_lon), (dest_lat, dest_lon)], steps=False
    )
    if not raw_routes:
        logger.warning("OSRM unavailable, falling back to straight-line distance")
        return None

    all_routes = [_build_route_entry(r, blocked_points) for r in raw_routes]
    all_routes.sort(key=lambda r: r["damage_score"])
    best = all_routes[0]

    # ── 3. Otomatik güvenli ara durak (rota hâlâ hasarlıysa) ─────
    if best["damage_score"] > 0 and blocked_points:
        stopovers = _safe_stopover(dest_lat, dest_lon, blocked_points)

        async def _try_stopover(stop: tuple[float, float]) -> Optional[dict]:
            raws = await _osrm_request(
                [(origin_lat, origin_lon), stop, (dest_lat, dest_lon)], steps=False
            )
            if not raws:
                return None
            return _build_route_entry(raws[0], blocked_points)

        stopover_results = await _asyncio.gather(*[_try_stopover(s) for s in stopovers])
        for candidate in stopover_results:
            if candidate and candidate["damage_score"] < best["damage_score"]:
                best = candidate
                logger.info("Güvenli ara durak ile daha iyi rota: damage_score=%d", best["damage_score"])

    # ── 4. Adımları ekle ─────────────────────────────────────────
    if include_steps:
        step_raws = await _osrm_request(
            [(origin_lat, origin_lon), (dest_lat, dest_lon)], steps=True
        )
        if step_raws:
            step_routes = sorted(
                [_build_route_entry(r, blocked_points) for r in step_raws],
                key=lambda r: r["damage_score"],
            )
            best["steps"] = _parse_steps(step_routes[0]["_raw"])
            for r in step_routes:
                r.pop("_raw", None)

    # ── 5. Temizle ve döndür ──────────────────────────────────────
    for r in all_routes:
        r.pop("_raw", None)
    best.pop("_raw", None)
    best["alternatives"] = list(all_routes[1:])

    logger.info(
        "OSRM best route: %.1f km, %.0f min, damage_score=%d",
        best["distance_km"], best["duration_min"], best["damage_score"],
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
