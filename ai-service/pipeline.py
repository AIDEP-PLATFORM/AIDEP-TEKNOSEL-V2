import logging
from uuid import UUID

from models.yolo_model import is_yolo_loaded, load_yolo
from models.xgboost_model import is_xgb_loaded, load_xgboost
from schemas.damage import DamageDetectionResponse
from schemas.priority import (
    PriorityRequest,
    PriorityResponse,
    MatchRequest,
    VolunteerInfo,
    MatchResponse,
)
from services.damage_detection import analyze_photo, get_damage_map
from services.priority_scoring import score_request, score_requests_bulk
from services.matching import match_volunteers

logger = logging.getLogger(__name__)


async def startup() -> None:
    logger.info("AI pipeline baslatiliyor...")
    await load_yolo()
    await load_xgboost()
    logger.info(
        "AI pipeline hazir | YOLOv8=%s XGBoost=%s",
        "yuklü" if is_yolo_loaded() else "mock",
        "yuklü" if is_xgb_loaded() else "mock",
    )


def status() -> dict:
    return {
        "yolov8m":  "loaded" if is_yolo_loaded() else "mock",
        "xgboost":  "loaded" if is_xgb_loaded() else "mock",
        "pipeline": "ready",
    }


async def run_damage_detection(
    image_bytes: bytes,
    latitude: float,
    longitude: float,
    report_id: UUID | None = None,
) -> DamageDetectionResponse:
    return await analyze_photo(image_bytes, latitude, longitude, report_id)


async def run_priority_scoring(req: PriorityRequest) -> PriorityResponse:
    return await score_request(req)


async def run_bulk_priority_scoring(
    requests: list[PriorityRequest],
) -> list[PriorityResponse]:
    return await score_requests_bulk(requests)


async def run_matching(
    requests: list[MatchRequest],
    volunteers: list[VolunteerInfo],
) -> MatchResponse:
    return await match_volunteers(requests, volunteers)


async def get_live_damage_map() -> list[dict]:
    return await get_damage_map()
