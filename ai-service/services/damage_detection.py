import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from core.redis import get_redis
from core.mongodb import get_collection
from models.yolo_model import (
    predict_sync,
    ROAD_CLASSES,
    BUILDING_CLASSES,
    CLASS_DAMAGE_SCORES,
)
from schemas.damage import DamageDetectionResponse, DetectionItem

logger = logging.getLogger(__name__)

_GRID_PRECISION = 3
MIN_CONFIRMATIONS = 3
_GRID_TTL_SECONDS = 6 * 3600


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


async def _save_to_mongodb(
    report_id: UUID,
    latitude: float,
    longitude: float,
    detections: list[dict],
    damage_score: float,
    multi_confirm_count: int,
    image_s3_url: str | None = None,
) -> None:
    collection = get_collection("damage_detections")
    if collection is None:
        return
    try:
        doc = {
            "report_id": str(report_id),
            "image_s3_url": image_s3_url,
            "location": {"lat": latitude, "lng": longitude},
            "detections": [
                {
                    "class": d["class_name"],
                    "confidence": d["confidence"],
                    "bbox": d["bbox"],
                    "damage_score": d["damage_score"],
                }
                for d in detections
            ],
            "damage_score": round(damage_score * 100, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "multi_confirm_count": multi_confirm_count,
            "model_source": "yolov8m",
        }
        await collection.insert_one(doc)
    except Exception as exc:
        logger.warning("MongoDB kayit hatasi (devam ediliyor): %s", exc)


async def analyze_photo(
    image_bytes: bytes,
    latitude: float,
    longitude: float,
    report_id: UUID | None = None,
    image_s3_url: str | None = None,
) -> DamageDetectionResponse:
    report_id = report_id or uuid4()
    cell_id = _grid_cell_id(latitude, longitude)

    loop = asyncio.get_running_loop()
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

    await _save_to_mongodb(report_id, latitude, longitude, detections_raw, area_score, count, image_s3_url)

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
        model_source="yolov8m",
    )


async def get_damage_map() -> list[dict]:
    redis = get_redis()
    pattern = "ai:grid:*:scores"
    keys = await redis.keys(pattern)

    valid_keys = []
    valid_coords = []
    for key in keys:
        parts = key.split(":")
        if len(parts) != 5:
            continue
        try:
            lat, lon = float(parts[2]), float(parts[3])
        except ValueError:
            logger.warning("Geçersiz grid key formatı: %s", key)
            continue
        valid_keys.append(key)
        valid_coords.append((lat, lon, parts[2], parts[3]))

    if not valid_keys:
        return []

    pipe = redis.pipeline()
    for key in valid_keys:
        pipe.lrange(key, 0, -1)
    all_scores_raw = await pipe.execute()

    cells = []
    for (lat, lon, lat_str, lon_str), scores_raw in zip(valid_coords, all_scores_raw):
        try:
            scores = [float(s) for s in scores_raw]
        except ValueError:
            logger.warning("Geçersiz skor verisi, grid cell atlandı: %s:%s", lat_str, lon_str)
            continue
        count = len(scores)
        aggregated = round(sum(scores) / count, 4) if scores else 0.0
        cells.append({
            "grid_cell_id": f"{lat_str}:{lon_str}",
            "latitude": lat,
            "longitude": lon,
            "aggregated_score": aggregated,
            "report_count": count,
            "is_confirmed": count >= MIN_CONFIRMATIONS,
        })

    return cells


async def clear_all_damage_cells() -> int:
    """Redis'teki tüm ai:grid:* key'lerini siler. Silinen key sayısını döner."""
    redis = get_redis()
    keys = await redis.keys("ai:grid:*")
    if not keys:
        return 0
    deleted = await redis.delete(*keys)
    logger.info("clear_all_damage_cells: %d key silindi", deleted)
    return deleted


async def get_grid_score(latitude: float, longitude: float) -> float:
    cell_id = _grid_cell_id(latitude, longitude)
    redis = get_redis()
    scores_raw = await redis.lrange(f"ai:grid:{cell_id}:scores", 0, -1)
    if not scores_raw:
        return 0.0
    try:
        scores = [float(s) for s in scores_raw]
    except ValueError:
        return 0.0
    return round(sum(scores) / len(scores), 4)
