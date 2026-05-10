import asyncio
import logging

import numpy as np

from models.xgboost_model import predict_sync, is_xgb_loaded
from schemas.priority import PriorityRequest, PriorityResponse

logger = logging.getLogger(__name__)

_THRESHOLDS = {
    "critical": 75.0,
    "high":     50.0,
    "medium":   25.0,
}


def _to_priority_class(score: float) -> str:
    if score >= _THRESHOLDS["critical"]:
        return "critical"
    if score >= _THRESHOLDS["high"]:
        return "high"
    if score >= _THRESHOLDS["medium"]:
        return "medium"
    return "low"


def _build_feature_vector(req: PriorityRequest) -> np.ndarray:
    return np.array([
        float(req.urgency_level),
        float(req.wait_time_minutes),
        float(req.distance_km),
        float(req.need_type.value),
        float(req.meteorology_score),
        float(req.person_count),
        float(req.area_damage_score),
    ], dtype=np.float32)


async def score_request(req: PriorityRequest) -> PriorityResponse:
    features = _build_feature_vector(req)

    loop = asyncio.get_event_loop()
    raw_score = await loop.run_in_executor(None, predict_sync, features)

    priority_class = _to_priority_class(raw_score)

    logger.info(
        "Onceliklendirme | request=%s score=%.1f class=%s",
        req.request_id, raw_score, priority_class,
    )

    return PriorityResponse(
        request_id=req.request_id,
        priority_score=raw_score,
        priority_class=priority_class,
        model_source="xgboost" if is_xgb_loaded() else "mock",
    )


async def score_requests_bulk(requests: list[PriorityRequest]) -> list[PriorityResponse]:
    tasks = [score_request(r) for r in requests]
    results = await asyncio.gather(*tasks)
    return sorted(results, key=lambda r: r.priority_score, reverse=True)
