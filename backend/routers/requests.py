import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.request import AssignmentStatus, NeedType, RequestStatus
from models.user import User, UserRole
from schemas.request import (
    AssignmentStatusUpdate,
    HelpRequestCreate,
    HelpRequestResponse,
    MatchingRunResponse,
)
from services import matching_service, request_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["Help Requests"])


# ─── Yetki yardımcıları ─────────────────────────────────────────

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
    return HelpRequestResponse.model_validate(req)


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
    return [HelpRequestResponse.model_validate(r) for r in reqs]


@router.get("/{request_id}", response_model=HelpRequestResponse)
async def get_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Tek yardım talebi detayını döndürür. Eşleştirme bilgisi varsa dahil edilir."""
    req = await request_service.get_request(db, request_id)
    return HelpRequestResponse.model_validate(req)


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
    return HelpRequestResponse.model_validate(req)


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
    return HelpRequestResponse.model_validate(req)


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
