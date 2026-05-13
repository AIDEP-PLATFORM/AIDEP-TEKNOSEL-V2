from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.request import HelpRequest, RequestStatus
from models.user import User, UserRole, VolunteerProfile

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

_ACTIVE_STATUSES = [
    RequestStatus.PENDING,
    RequestStatus.SCORED,
    RequestStatus.ASSIGNED,
    RequestStatus.EN_ROUTE,
]


class DashboardSummary(BaseModel):
    active_requests: int
    completed_requests: int
    cancelled_requests: int
    total_requests: int
    available_volunteers: int
    total_volunteers: int


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Dashboard KPI kartları için özet istatistikler.
    Erişim: Tüm kayıtlı kullanıcılar.
    """
    # Talep sayıları
    active_result = await db.execute(
        select(func.count(HelpRequest.id)).where(HelpRequest.status.in_(_ACTIVE_STATUSES))
    )
    active_requests = active_result.scalar_one() or 0

    completed_result = await db.execute(
        select(func.count(HelpRequest.id)).where(HelpRequest.status == RequestStatus.COMPLETED)
    )
    completed_requests = completed_result.scalar_one() or 0

    cancelled_result = await db.execute(
        select(func.count(HelpRequest.id)).where(HelpRequest.status == RequestStatus.CANCELLED)
    )
    cancelled_requests = cancelled_result.scalar_one() or 0

    total_requests = active_requests + completed_requests + cancelled_requests

    # Gönüllü sayıları
    available_result = await db.execute(
        select(func.count(VolunteerProfile.id)).where(
            VolunteerProfile.is_available == True,
        )
    )
    available_volunteers = available_result.scalar_one() or 0

    total_vol_result = await db.execute(
        select(func.count(VolunteerProfile.id))
    )
    total_volunteers = total_vol_result.scalar_one() or 0

    return DashboardSummary(
        active_requests=active_requests,
        completed_requests=completed_requests,
        cancelled_requests=cancelled_requests,
        total_requests=total_requests,
        available_volunteers=available_volunteers,
        total_volunteers=total_volunteers,
    )
