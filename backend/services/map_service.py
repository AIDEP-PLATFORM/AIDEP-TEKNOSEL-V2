import json
import logging
from datetime import datetime, timedelta, timezone

import httpx
from geoalchemy2.functions import ST_X, ST_Y
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.redis import get_redis
from models.user import (
    NgoStaffProfile,
    Organization,
    User,
    UserRole,
    VolunteerProfile,
)
from schemas.map import EarthquakePoint, SafeAreaPoint, VolunteerLocation

logger = logging.getLogger(__name__)

# ─── Cache sabitleri ────────────────────────────────────────────
EARTHQUAKE_CACHE_KEY = "map:earthquakes"
EARTHQUAKE_CACHE_TTL = 300        # 5 dakika

SAFE_AREAS_CACHE_KEY = "map:safe_areas"
SAFE_AREAS_CACHE_TTL = 86400      # 24 saat

OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter"
# Türkiye sınır kutusu: min_lat, min_lon, max_lat, max_lon
TURKEY_BBOX = "35.8,25.9,42.1,44.8"


# ─── Depremler ─────────────────────────────────────────────────

async def get_earthquakes() -> tuple[list[EarthquakePoint], bool]:
    """AFAD API'den son 7 günün depremlerini çeker (min mag 3.0).
    Önce Redis cache'e bakar; cache yoksa API'ye istek atar.
    Returns (data, is_cached).
    """
    redis = get_redis()

    if redis:
        try:
            cached = await redis.get(EARTHQUAKE_CACHE_KEY)
            if cached:
                return [EarthquakePoint(**e) for e in json.loads(cached)], True
        except Exception as e:
            logger.warning(f"Redis okuma hatasi (depremler): {e}")

    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S")
    end = now.strftime("%Y-%m-%dT%H:%M:%S")

    params = {
        "start": start,
        "end": end,
        "minmag": 3,
        "orderby": "timedesc",
        "limit": 200,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(settings.AFAD_API_URL, params=params)
            response.raise_for_status()
            raw = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"AFAD API HTTP hatasi {e.response.status_code}: {e}")
        return [], False
    except Exception as e:
        logger.error(f"AFAD API hatasi: {e}")
        return [], False

    earthquakes: list[EarthquakePoint] = []
    for item in raw:
        try:
            earthquakes.append(EarthquakePoint(
                event_id=str(item.get("eventID", "")),
                latitude=float(item.get("latitude", 0)),
                longitude=float(item.get("longitude", 0)),
                magnitude=float(item.get("magnitude", 0)),
                depth=float(item.get("depth", 0)),
                location=item.get("location", ""),
                occurred_at=item.get("date", ""),
            ))
        except (ValueError, KeyError) as e:
            logger.warning(f"Deprem satiri parse hatasi: {e} | veri: {item}")
            continue

    if redis and earthquakes:
        try:
            await redis.setex(
                EARTHQUAKE_CACHE_KEY,
                EARTHQUAKE_CACHE_TTL,
                json.dumps([e.model_dump() for e in earthquakes]),
            )
        except Exception as e:
            logger.warning(f"Redis yazma hatasi (depremler): {e}")

    return earthquakes, False


# ─── Güvenli Alanlar ────────────────────────────────────────────

async def get_safe_areas() -> tuple[list[SafeAreaPoint], bool]:
    """Overpass API (OpenStreetMap) üzerinden Türkiye'deki toplanma alanlarını çeker.
    Önce Redis cache'e bakar; cache yoksa Overpass'a istek atar.
    Returns (data, is_cached).
    """
    redis = get_redis()

    if redis:
        try:
            cached = await redis.get(SAFE_AREAS_CACHE_KEY)
            if cached:
                return [SafeAreaPoint(**s) for s in json.loads(cached)], True
        except Exception as e:
            logger.warning(f"Redis okuma hatasi (guvenli alanlar): {e}")

    overpass_query = f"""
[out:json][timeout:30];
node["emergency"="assembly_point"]({TURKEY_BBOX});
out body;
"""

    try:
        import urllib.parse
        async with httpx.AsyncClient(timeout=35.0) as client:
            response = await client.post(
                OVERPASS_URL,
                content=urllib.parse.urlencode({"data": overpass_query}).encode(),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            raw = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Overpass API HTTP hatasi {e.response.status_code}: {e}")
        return [], False
    except Exception as e:
        logger.error(f"Overpass API hatasi: {e}")
        return [], False

    safe_areas: list[SafeAreaPoint] = []
    for element in raw.get("elements", []):
        if element.get("type") != "node":
            continue
        tags = element.get("tags", {})
        try:
            safe_areas.append(SafeAreaPoint(
                osm_id=int(element["id"]),
                latitude=float(element["lat"]),
                longitude=float(element["lon"]),
                name=tags.get("name") or tags.get("name:tr") or None,
                capacity=str(tags["capacity"]) if "capacity" in tags else None,
            ))
        except (KeyError, ValueError) as e:
            logger.warning(f"Guvenli alan parse hatasi: {e} | element: {element}")
            continue

    if redis and safe_areas:
        try:
            await redis.setex(
                SAFE_AREAS_CACHE_KEY,
                SAFE_AREAS_CACHE_TTL,
                json.dumps([s.model_dump() for s in safe_areas]),
            )
        except Exception as e:
            logger.warning(f"Redis yazma hatasi (guvenli alanlar): {e}")

    return safe_areas, False


# ─── Ekip Konumları ─────────────────────────────────────────────

async def get_team_locations(db: AsyncSession) -> list[VolunteerLocation]:
    """Konumu paylaşan aktif gönüllü ve STK saha görevlilerini döndürür.
    Her iki rol için ayrı JOIN yapılır (volunteer_profiles / ngo_staff_profiles).
    """
    locations: list[VolunteerLocation] = []

    # ── Gönüllüler ──────────────────────────────────────────────
    vol_result = await db.execute(
        select(
            User.id,
            User.full_name,
            User.role,
            ST_Y(User.current_location).label("lat"),
            ST_X(User.current_location).label("lng"),
            Organization.name.label("org_name"),
            Organization.city.label("org_city"),
            Organization.district.label("org_district"),
        )
        .join(VolunteerProfile, VolunteerProfile.user_id == User.id)
        .outerjoin(Organization, Organization.id == VolunteerProfile.organization_id)
        .where(
            User.role == UserRole.VOLUNTEER,
            User.is_active.is_(True),
            User.current_location.isnot(None),
        )
    )

    # ── STK Saha Görevlileri ─────────────────────────────────────
    staff_result = await db.execute(
        select(
            User.id,
            User.full_name,
            User.role,
            ST_Y(User.current_location).label("lat"),
            ST_X(User.current_location).label("lng"),
            Organization.name.label("org_name"),
            Organization.city.label("org_city"),
            Organization.district.label("org_district"),
        )
        .join(NgoStaffProfile, NgoStaffProfile.user_id == User.id)
        .join(Organization, Organization.id == NgoStaffProfile.organization_id)
        .where(
            User.role == UserRole.NGO_STAFF,
            User.is_active.is_(True),
            User.current_location.isnot(None),
        )
    )

    for rows in (vol_result.all(), staff_result.all()):
        for row in rows:
            try:
                locations.append(VolunteerLocation(
                    user_id=str(row.id),
                    full_name=row.full_name,
                    role=row.role.value,
                    latitude=float(row.lat),
                    longitude=float(row.lng),
                    organization_name=row.org_name,
                    organization_city=row.org_city,
                    organization_district=row.org_district,
                ))
            except Exception as e:
                logger.warning(f"Konum parse hatasi: {e}")
                continue

    return locations
