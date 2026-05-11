import asyncio
import logging
from uuid import UUID, uuid4

from core.redis import get_redis
from models.yolo_model import (
    predict_sync,
    is_yolo_loaded,
    ROAD_CLASSES,
    BUILDING_CLASSES,
    CLASS_DAMAGE_SCORES,
)
from schemas.damage import DamageDetectionResponse, DetectionItem

logger = logging.getLogger(__name__)

_GRID_PRECISION = 3
MIN_CONFIRMATIONS = 3
_GRID_TTL_SECONDS = 72 * 3600


def _grid_cell_id(lat: float, lon: float) -> str:
    return f"{round(lat, _GRID_PRECISION)}:{round(lon, _GRID_PRECISION)}"


def _compute_image_scores(detections: list[dict]) -> tuple[float, float]:
    road_scores: list[float] = []
    bldg_scores: list[float] = []

    for det in detections:
        cid = det["class_id"]
        score = CLASS_DAMAGE_SCORES[cid]
        if cid in ROAD_CLASSES:
            road_scores.append(score)
        elif cid in BUILDING_CLASSES:
            bldg_scores.append(score)

    road = max(road_scores, default=0.0)
    bldg = max(bldg_scores, default=0.0)
    return road, bldg


async def analyze_photo(
    image_bytes: bytes,
    latitude: float,
    longitude: float,
    report_id: UUID | None = None,
) -> DamageDetectionResponse:
    report_id = report_id or uuid4()
    cell_id = _grid_cell_id(latitude, longitude)

    loop = asyncio.get_event_loop()
    detections_raw = await loop.run_in_executor(None, predict_sync, image_bytes)

    road_score, bldg_score = _compute_image_scores(detections_raw)
    area_score = round(road_score * 0.7 + bldg_score * 0.3, 4)

    redis = get_redis()
    redis_key = f"ai:grid:{cell_id}:scores"

    await redis.rpush(redis_key, str(area_score))
    await redis.expire(redis_key, _GRID_TTL_SECONDS)

    all_scores_raw = await redis.lrange(redis_key, 0, -1)
    all_scores = [float(s) for s in all_scores_raw]

    count = len(all_scores)
    aggregated = round(sum(all_scores) / count, 4) if all_scores else area_score
    is_confirmed = count >= MIN_CONFIRMATIONS

    logger.info(
        "Hasar analizi | cell=%s count=%d agg=%.3f confirmed=%s",
        cell_id, count, aggregated, is_confirmed,
    )

    return DamageDetectionResponse(
        report_id=report_id,
        detections=[DetectionItem(**d) for d in detections_raw],
        road_damage_score=road_score,
        building_damage_score=bldg_score,
        grid_cell_id=cell_id,
        grid_confirmed_count=count,
        grid_aggregated_score=aggregated,
        is_confirmed=is_confirmed,
        model_source="yolov8m" if is_yolo_loaded() else "mock",
    )


async def get_damage_map() -> list[dict]:
    redis = get_redis()
    pattern = "ai:grid:*:scores"
    keys = await redis.keys(pattern)

    cells = []
    for key in keys:
        parts = key.split(":")
        if len(parts) != 5:
            continue
        lat, lon = float(parts[2]), float(parts[3])
        scores_raw = await redis.lrange(key, 0, -1)
        scores = [float(s) for s in scores_raw]
        count = len(scores)
        aggregated = round(sum(scores) / count, 4) if scores else 0.0
        cells.append({
            "grid_cell_id": f"{parts[2]}:{parts[3]}",
            "latitude": lat,
            "longitude": lon,
            "aggregated_score": aggregated,
            "report_count": count,
            "is_confirmed": count >= MIN_CONFIRMATIONS,
        })

    return cells


async def get_grid_score(latitude: float, longitude: float) -> float:
    cell_id = _grid_cell_id(latitude, longitude)
    redis = get_redis()
    scores_raw = await redis.lrange(f"ai:grid:{cell_id}:scores", 0, -1)
    if not scores_raw:
        return 0.0
    scores = [float(s) for s in scores_raw]
    return round(sum(scores) / len(scores), 4)
