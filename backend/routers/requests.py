import logging
from typing import Optional, Union
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.request import AssignmentStatus, NeedType, RequestStatus
from models.user import User, UserRole
from schemas.photo import DamagePhotoResponse
from pydantic import BaseModel
from schemas.request import (
    AssignmentStatusUpdate,
    HelpRequestCreate,
    HelpRequestResponse,
    MatchingRunResponse,
)
from services import matching_service, request_service, photo_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["Help Requests"])


# ─── Yardımcılar ────────────────────────────────────────────────

def _to_response(req) -> HelpRequestResponse:
    """HelpRequest ORM nesnesini response şemasına çevirir; photo_count dahil."""
    r = HelpRequestResponse.model_validate(req)
    r.photo_count = len(req.photos) if req.photos is not None else 0
    return r


def _require_manager_or_admin(user: User) -> None:
    """Eşleştirme tetiklemek için NGO_MANAGER, OFFICIAL_MANAGER veya ADMIN gerekir."""
    allowed = {UserRole.NGO_MANAGER, UserRole.OFFICIAL_MANAGER, UserRole.ADMIN}
    if user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir",
        )


# ─── Talep Oluşturma ────────────────────────────────────────────

@router.post("", response_model=HelpRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_help_request(
    data: HelpRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yeni yardım talebi oluşturur.
    Oluşturulduktan sonra AI servisine XGBoost öncelik skoru hesaplatılır.
    AI servisi erişilemezse talep PENDING durumunda kalır, ileride skorlanır.
    """
    req = await request_service.create_request(db, current_user, data)
    return _to_response(req)


# ─── Listeleme ve Sorgulama ─────────────────────────────────────

@router.get("", response_model=list[HelpRequestResponse])
async def list_requests(
    status: Optional[RequestStatus] = Query(None, description="Durum filtresi"),
    need_type: Optional[NeedType] = Query(None, description="İhtiyaç türü filtresi"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Tüm yardım taleplerini listeler. Durum ve ihtiyaç türüne göre filtrelenebilir.
    Öncelik skoruna göre azalan sıradadır; skorlanmamışlar en sona düşer.
    Erişim: Tüm kayıtlı kullanıcılar.
    """
    reqs = await request_service.get_requests(db, status_filter=status, need_type=need_type)
    return [_to_response(r) for r in reqs]


# ─── Aktif Görev (Mobil) ───────────────────────────────────────

@router.get("/my-task", response_model=Optional[HelpRequestResponse])
async def get_my_task(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının dahil olduğu ekibe atanmış aktif görevi döndürür.
    Navigasyon için rota adımları (route_steps) dahil edilir.
    Aktif görev yoksa null döner.
    Erişim: VOLUNTEER, NGO_STAFF, NGO_MANAGER, OFFICIAL_STAFF, OFFICIAL_MANAGER.
    """
    req = await request_service.get_my_active_task(db, current_user)
    if req is None:
        return None

    response = _to_response(req)

    if req.assignment:
        try:
            from services.osrm_service import get_best_route
            from core.firebase import db_get
            from geoalchemy2.shape import to_shape

            # 1. Kullanıcının ANLIK konumunu al
            # Önce Firebase'e bak (en güncel), yoksa PostgreSQL'deki son konuma dön
            origin_lat, origin_lon = None, None

            firebase_loc = await db_get(f"locations/{current_user.id}")
            if firebase_loc and "lat" in firebase_loc and "lon" in firebase_loc:
                origin_lat = float(firebase_loc["lat"])
                origin_lon = float(firebase_loc["lon"])
            elif current_user.current_location is not None:
                point = to_shape(current_user.current_location)
                origin_lat = point.y
                origin_lon = point.x

            if origin_lat is None:
                # Konum hiç bilinmiyorsa rota hesaplanamaz, steps boş döner
                logger.info("my-task: kullanıcı konumu bilinmiyor, steps atlandı")
                return response

            # 2. Hedef = yardım talebinin konumu
            dest_lat = req.latitude
            dest_lon = req.longitude

            # 3. Şu anki konumdan hedefe OSRM rotası (adım adım)
            route_with_steps = await get_best_route(
                origin_lat=origin_lat,
                origin_lon=origin_lon,
                dest_lat=dest_lat,
                dest_lon=dest_lon,
                include_steps=True,
            )

            if route_with_steps:
                # route_geometry'yi de güncel konumdan hesaplananla güncelle
                response.assignment.route_geometry = route_with_steps.get("geometry", [])
                response.assignment.route_steps    = route_with_steps.get("steps", [])
                response.assignment.route_distance_km      = route_with_steps["distance_km"]
                response.assignment.route_duration_minutes = route_with_steps["duration_min"]

        except Exception as exc:
            logger.warning("my-task rota hesaplama hatası: %s", exc)

    return response


@router.get("/{request_id}", response_model=HelpRequestResponse)
async def get_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Tek yardım talebi detayını döndürür. Eşleştirme bilgisi varsa dahil edilir."""
    req = await request_service.get_request(db, request_id)
    return _to_response(req)


# ─── Talep İptal ────────────────────────────────────────────────

@router.delete("/{request_id}", response_model=HelpRequestResponse)
async def cancel_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Talebi iptal eder.
    Kural: Talep sahibi veya ADMIN iptal edebilir.
    Zaten COMPLETED veya CANCELLED olan talepler iptal edilemez.
    """
    req = await request_service.cancel_request(db, request_id, current_user)
    return _to_response(req)


# ─── Görev Durumu Güncelleme ────────────────────────────────────

@router.put("/{request_id}/assignment-status", response_model=HelpRequestResponse)
async def update_assignment_status(
    request_id: UUID,
    body: AssignmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gönüllü kendi görev durumunu günceller.
    Geçerli geçişler: ASSIGNED → EN_ROUTE → COMPLETED
    Sadece göreve atanan gönüllü güncelleyebilir.
    """
    if body.status not in (AssignmentStatus.EN_ROUTE, AssignmentStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece EN_ROUTE veya COMPLETED durumuna geçilebilir",
        )
    assignment = await request_service.update_assignment_status(
        db, request_id, body.status, current_user
    )
    # Güncel talep bilgisini döndür
    req = await request_service.get_request(db, request_id)
    return _to_response(req)


# ─── Hasar Fotoğrafı Yükleme ───────────────────────────────────

@router.post(
    "/{request_id}/photos",
    response_model=DamagePhotoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yardım talebine hasar fotoğrafı yükle",
)
async def upload_damage_photo(
    request_id: UUID,
    file: UploadFile = File(..., description="Hasar fotoğrafı (JPEG/PNG/WEBP, max 10 MB)"),
    latitude: Optional[float] = Form(None, ge=-90, le=90, description="Fotoğraf konumu enlem"),
    longitude: Optional[float] = Form(None, ge=-180, le=180, description="Fotoğraf konumu boylam"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yardım talebine hasar fotoğrafı yükler.

    - Fotoğraf AWS S3'e kaydedilir.
    - YOLOv8 modeli ile hasar analizi yapılır ve `damage_score` döner.
    - Talebin `area_damage_score` alanı tüm fotoğrafların ortalamasıyla güncellenir.
    - AI servisi erişilemezse fotoğraf yine de kaydedilir; `damage_score` boş kalır.
    - Erişim: Tüm kayıtlı kullanıcılar (vatandaş dahil).
    """
    photo = await photo_service.upload_damage_photo(
        db=db,
        request_id=request_id,
        file=file,
        user=current_user,
        latitude=latitude,
        longitude=longitude,
    )
    response = DamagePhotoResponse.model_validate(photo)
    response.analysis_success = photo.damage_score is not None
    return response


@router.get(
    "/{request_id}/photos",
    response_model=list[DamagePhotoResponse],
    summary="Yardım talebinin hasar fotoğraflarını listele",
)
async def list_damage_photos(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Bir yardım talebine yüklenmiş hasar fotoğraflarını listeler.
    Yükleme tarihine göre artan sırada döner. photo_url presigned URL içerir.
    Erişim: Tüm kayıtlı kullanıcılar.
    """
    await request_service.get_request(db, request_id)
    photos = await photo_service.get_request_photos(db, request_id)
    responses = []
    for p in photos:
        r = DamagePhotoResponse.model_validate(p)
        r.analysis_success = p.damage_score is not None
        r.photo_url = await photo_service.get_presigned_url(p.minio_key)
        responses.append(r)
    return responses


# ─── Manuel Görev Atama ────────────────────────────────────────

class ManualAssignBody(BaseModel):
    team_id: UUID


@router.post("/{request_id}/assign", response_model=HelpRequestResponse)
async def manual_assign(
    request_id: UUID,
    body: ManualAssignBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Talebi manuel olarak seçilen ekibe atar.
    Yalnızca PENDING veya SCORED durumdaki talepler atanabilir.
    Erişim: NGO_MANAGER (kendi org ekipleri), OFFICIAL_MANAGER, ADMIN.
    """
    _require_manager_or_admin(current_user)
    req = await request_service.manual_assign_request(db, request_id, body.team_id, current_user)
    return _to_response(req)


# ─── Eşleştirme Tetikleme ───────────────────────────────────────

@router.post(
    "/matching/run",
    response_model=MatchingRunResponse,
    tags=["Matching"],
)
async def run_matching(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI tabanlı gönüllü-talep eşleştirmesini manuel tetikler.
    Tüm PENDING/SCORED talepleri müsait gönüllülerle eşleştirir.
    XGBoost öncelik skorları + Greedy algoritması kullanılır.
    Erişim: NGO_MANAGER, OFFICIAL_MANAGER, ADMIN.
    """
    _require_manager_or_admin(current_user)
    result = await matching_service.run_matching(db, current_user)
    return MatchingRunResponse(**result)


# ─── Konumdan Rota Hesaplama ────────────────────────────────────

class RouteResponse(dict):
    pass


@router.get(
    "/{request_id}/route",
    summary="Verilen konumdan talep noktasına rota hesapla",
)
async def calculate_route(
    request_id: UUID,
    origin_lat: float = Query(..., ge=-90,  le=90,  description="Başlangıç enlemi"),
    origin_lon: float = Query(..., ge=-180, le=180, description="Başlangıç boylamı"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Tarayıcı/kullanıcı konumundan belirtilen yardım talebinin konumuna
    OSRM üzerinden adım adım rota hesaplar.

    Dönüş:
        distance_km, duration_min, damage_score,
        geometry  ([[lon, lat], ...]),
        steps     ([{instruction, street_name, distance_m, duration_s, location, maneuver}])
    """
    from services.osrm_service import get_best_route

    req = await request_service.get_request(db, request_id)

    route = await get_best_route(
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        dest_lat=req.latitude,
        dest_lon=req.longitude,
        include_steps=True,
    )

    if not route:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rota hesaplanamadı. OSRM servisi erişilemez olabilir.",
        )

    return {
        "distance_km":   route["distance_km"],
        "duration_min":  route["duration_min"],
        "damage_score":  route["damage_score"],
        "geometry":      route["geometry"],
        "steps":         route.get("steps", []),
        "origin":        {"lat": origin_lat, "lon": origin_lon},
        "destination":   {"lat": req.latitude, "lon": req.longitude},
    }
