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


@router.get("/route")
async def calculate_route(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lon: float = Query(..., ge=-180, le=180),
    to_lat: float = Query(..., ge=-90, le=90),
    to_lon: float = Query(..., ge=-180, le=180),
    _: User = Depends(get_current_user),
):
    """İki nokta arasında OSRM ile rota hesaplar.
    Hasar noktalarından kaçınan en güvenli rotayı döner.
    Erişim: Tüm kayıtlı kullanıcılar (mobil navigasyon için).
    """
    route = await get_best_route(from_lat, from_lon, to_lat, to_lon, include_steps=True)
    if not route:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rota hesaplanamadı. OSRM servisi erişilemez.",
        )
    return route
