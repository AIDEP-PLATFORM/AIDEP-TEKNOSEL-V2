"""
route_service.py

Dinamik rota yeniden hesaplama servisi.

Senaryo:
  1. Bir hasar fotoğrafı yüklenir → damage_score > 0.7 ise yol bloke sayılır.
  2. Aktif görevlerdeki (EN_ROUTE / ASSIGNED) ekiplerin rotaları kontrol edilir.
  3. Hasar noktasına yakın rotası olan ekipler tespit edilir.
  4. Firebase'den ekip üyelerinin anlık konumu alınır.
  5. OSRM'den yeni en iyi rota hesaplanır (hasar noktasından kaçınarak).
  6. FCM ile ekip üyelerine bildirim gönderilir.
  7. Assignment.route_geometry güncellenir.
"""
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.firebase import db_get, send_fcm
from models.request import Assignment, AssignmentStatus, HelpRequest
from models.team import Team, TeamMember
from models.user import User
from services.osrm_service import _haversine_m, get_best_route

logger = logging.getLogger(__name__)

# Hasar noktası bu skoru aşarsa yol bloke kabul edilir
DAMAGE_BLOCK_THRESHOLD = 0.7
# Ekip rotasının hasar noktasına bu kadar yakın geçerse etkilenmiş sayılır
ROUTE_IMPACT_RADIUS_M = 1_000   # 1 km


async def check_and_reroute(
    db: AsyncSession,
    damage_lat: float,
    damage_lon: float,
    damage_score: float,
) -> None:
    """
    Yeni hasar fotoğrafı yüklendiğinde çağrılır.
    Eğer damage_score yeterince yüksekse aktif görevleri kontrol edip yeniden rota hesaplar.
    """
    if damage_score < DAMAGE_BLOCK_THRESHOLD:
        logger.debug(
            "Hasar skoru düşük (%.2f < %.2f), yeniden rota gerekmez.",
            damage_score, DAMAGE_BLOCK_THRESHOLD,
        )
        return

    logger.info(
        "Yol hasarı tespit edildi (score=%.2f) @ (%.5f, %.5f) — aktif görevler kontrol ediliyor.",
        damage_score, damage_lat, damage_lon,
    )

    # Aktif görevleri (ASSIGNED / EN_ROUTE) ve ilgili talepleri çek
    result = await db.execute(
        select(Assignment)
        .where(Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.EN_ROUTE]))
        .options(selectinload(Assignment.help_request))
    )
    active_assignments: list[Assignment] = list(result.scalars().all())

    if not active_assignments:
        logger.debug("Aktif görev yok.")
        return

    blocked_points = [(damage_lat, damage_lon)]

    for assignment in active_assignments:
        await _process_assignment(db, assignment, blocked_points, damage_lat, damage_lon)


async def _process_assignment(
    db: AsyncSession,
    assignment: Assignment,
    blocked_points: list[tuple[float, float]],
    damage_lat: float,
    damage_lon: float,
) -> None:
    """
    Tek bir görevi kontrol eder:
    - Rota hasarlı bölgeden geçiyor mu?
    - Geçiyorsa ekibin anlık konumundan yeni rota hesapla ve bildir.
    """
    req: HelpRequest = assignment.help_request
    if not req:
        return

    # Mevcut rota geometrisi kontrol et
    route_coords: list[list[float]] | None = assignment.route_geometry
    if route_coords:
        route_impacted = _route_passes_near_damage(route_coords, damage_lat, damage_lon)
    else:
        # Rota geometrisi yoksa talep konumuna haversine mesafesine bak
        dist_m = _haversine_m(req.latitude, req.longitude, damage_lat, damage_lon)
        route_impacted = dist_m <= ROUTE_IMPACT_RADIUS_M * 3

    if not route_impacted:
        return

    logger.info(
        "Görev %s etkilendi (team=%s) — yeni rota hesaplanıyor.",
        assignment.id, assignment.team_id,
    )

    # Ekip üyelerinin Firebase konumlarını al
    team_location = await _get_team_location_from_firebase(str(assignment.team_id), db)
    if not team_location:
        logger.warning(
            "Ekip %s için Firebase konumu bulunamadı, yeniden rota atlanıyor.",
            assignment.team_id,
        )
        return

    team_lat, team_lon = team_location

    # OSRM'den hasar noktasından kaçınan yeni rota
    new_route = await get_best_route(
        origin_lat=team_lat,
        origin_lon=team_lon,
        dest_lat=req.latitude,
        dest_lon=req.longitude,
        blocked_points=blocked_points,
    )

    if not new_route:
        logger.warning("OSRM'den yeni rota alınamadı (görev=%s).", assignment.id)
        return

    # Assignment güncelle
    assignment.route_geometry = new_route["geometry"]
    assignment.route_distance_km = new_route["distance_km"]
    assignment.route_duration_minutes = new_route["duration_min"]
    await db.commit()

    logger.info(
        "Görev %s için yeni rota kaydedildi: %.1f km, %.0f dk, hasar_skoru=%d.",
        assignment.id,
        new_route["distance_km"],
        new_route["duration_min"],
        new_route["damage_score"],
    )

    # Ekip üyelerine FCM bildirimi gönder
    await _notify_team(db, assignment.team_id, new_route, req)


def _route_passes_near_damage(
    route_coords: list[list[float]],
    damage_lat: float,
    damage_lon: float,
) -> bool:
    """Rota koordinatlarından herhangi biri hasar noktasına yakın mı?"""
    for coord in route_coords:
        if isinstance(coord, (list, tuple)) and len(coord) >= 2:
            lon, lat = coord[0], coord[1]
            if _haversine_m(lat, lon, damage_lat, damage_lon) <= ROUTE_IMPACT_RADIUS_M:
                return True
    return False


async def _get_team_location_from_firebase(
    team_id: str, db: AsyncSession
) -> tuple[float, float] | None:
    """
    Ekip üyelerinin Firebase konumunu kontrol eder.
    İlk bulunan üyenin konumunu döner.
    Hiç konum yoksa None döner.
    """
    # Ekip üyelerini DB'den çek
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id)
    )
    members = list(result.scalars().all())

    for member in members:
        user_id = str(member.user_id)
        location_data = await db_get(f"locations/{user_id}")
        if location_data and "lat" in location_data and "lon" in location_data:
            return float(location_data["lat"]), float(location_data["lon"])

    return None


async def _notify_team(
    db: AsyncSession,
    team_id: UUID,
    new_route: dict,
    req: HelpRequest,
) -> None:
    """Ekip üyelerinin FCM token'larına yeniden rota bildirimi gönderir."""
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.team_id == team_id)
        .options(selectinload(TeamMember.user))
    )
    members = list(result.scalars().all())

    title = "🔄 Rota Güncellendi"
    body = (
        f"Güzergahınızda hasar tespit edildi. "
        f"Yeni rota: {new_route['distance_km']:.1f} km, "
        f"~{new_route['duration_min']:.0f} dk."
    )
    data = {
        "type": "ROUTE_UPDATE",
        "request_id": str(req.id),
        "distance_km": str(round(new_route["distance_km"], 2)),
        "duration_min": str(round(new_route["duration_min"], 1)),
    }

    for member in members:
        user: User = member.user
        if user and user.fcm_token:
            await send_fcm(user.fcm_token, title, body, data)
        else:
            logger.debug("Kullanıcı %s için FCM token bulunamadı.", member.user_id)
