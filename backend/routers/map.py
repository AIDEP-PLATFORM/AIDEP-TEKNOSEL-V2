import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from schemas.map import MapEarthquakesResponse, MapSafeAreasResponse, MapTeamsResponse
from services import map_service
from services.osrm_service import get_best_route

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/map", tags=["Map"])

# Sadece bu roller ekip konumlarını görebilir (web paneli)
_WEB_ROLES = {UserRole.NGO_MANAGER, UserRole.OFFICIAL_MANAGER, UserRole.ADMIN}


@router.get("/earthquakes", response_model=MapEarthquakesResponse)
async def get_earthquakes():
    """Son 7 günün depremlerini döndürür (min magnitude 3.0).
    Kaynak: AFAD API | Cache: Redis 5 dakika.
    Kimlik doğrulama gerekmez — herkese açık.
    """
    data, cached = await map_service.get_earthquakes()
    return MapEarthquakesResponse(count=len(data), cached=cached, data=data)


@router.get("/safe-areas", response_model=MapSafeAreasResponse)
async def get_safe_areas():
    """Türkiye'deki toplanma alanlarını döndürür.
    Kaynak: OpenStreetMap Overpass API | Cache: Redis 24 saat.
    Kimlik doğrulama gerekmez — herkese açık.
    """
    data, cached = await map_service.get_safe_areas()
    return MapSafeAreasResponse(count=len(data), cached=cached, data=data)


@router.get("/teams", response_model=MapTeamsResponse)
async def get_team_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ekiplerin harita konumlarını döndürür.
    Ekibin konumu, konumu paylaşan üyelerin ortalama koordinatıdır.
    Hiçbir üyesinin konumu olmayan ekipler listede görünmez.
    Sadece NGO_MANAGER, OFFICIAL_MANAGER ve ADMIN erişebilir (web paneli).
    """
    if current_user.role not in _WEB_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu endpoint sadece yöneticiler içindir",
        )

    data = await map_service.get_team_locations(db)
    return MapTeamsResponse(count=len(data), data=data)


@router.get("/nearest")
async def nearest_road(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    _: User = Depends(get_current_user),
):
    """Verilen koordinata en yakın yol noktasını döndürür (OSRM nearest).
    Yola 50m'den uzaksa 404 döner.
    """
    import httpx as _httpx
    from core.config import settings as _s
    url = f"{_s.OSRM_URL}/nearest/v1/driving/{lon},{lat}?number=1"
    try:
        async with _httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            data = resp.json()
        waypoints = data.get("waypoints", [])
        if not waypoints:
            raise HTTPException(status_code=404, detail="Yakında yol bulunamadı")
        wp = waypoints[0]
        distance = wp.get("distance", 9999)
        if distance > 50:
            raise HTTPException(status_code=404, detail="Yakında yol bulunamadı")
        snapped_lon, snapped_lat = wp["location"]
        return {"latitude": snapped_lat, "longitude": snapped_lon, "distance_m": distance}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"OSRM erişilemez: {exc}")


@router.get("/route")
async def calculate_route(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lon: float = Query(..., ge=-180, le=180),
    to_lat: float = Query(..., ge=-90, le=90),
    to_lon: float = Query(..., ge=-180, le=180),
    # Kullanıcının eklediği ara duraklar: via=lat,lon şeklinde tekrar edilebilir
    via: list[str] = Query(default=[]),
    _: User = Depends(get_current_user),
):
    """İki nokta arasında OSRM ile rota hesaplar.
    via=lat,lon parametresiyle isteğe bağlı ara duraklar eklenebilir.
    Erişim: Tüm kayıtlı kullanıcılar (mobil navigasyon için).
    """
    # Ara durakları parse et
    user_waypoints: list[tuple[float, float]] = []
    for v in via:
        try:
            parts = v.split(",")
            user_waypoints.append((float(parts[0]), float(parts[1])))
        except Exception:
            pass

    # Hasar noktalarını AI servisinden çek
    blocked_points: list[tuple[float, float]] = []
    try:
        import httpx as _httpx
        from core.config import settings as _s
        async with _httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{_s.AI_SERVICE_URL}/ai/damage-map",
                headers={"X-API-Key": _s.AI_INTERNAL_API_KEY},
            )
            if resp.status_code == 200:
                cells = resp.json()
                blocked_points = [
                    (cell["latitude"], cell["longitude"])
                    for cell in cells
                    if cell.get("aggregated_score", 0) >= 0.1
                ]
                logger.info("Rota için %d hasar noktası yüklendi", len(blocked_points))
    except Exception as exc:
        logger.warning("Hasar noktaları alınamadı, rota hasarsız hesaplanacak: %s", exc)

    route = await get_best_route(
        from_lat, from_lon, to_lat, to_lon,
        blocked_points=blocked_points,
        include_steps=True,
        user_waypoints=user_waypoints,
    )
    if not route:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rota hesaplanamadı. OSRM servisi erişilemez.",
        )

    return route
