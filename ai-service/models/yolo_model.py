import asyncio
import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

CLASS_NAMES = [
    "building_intact",
    "building_damaged",
    "building_collapsed",
    "road_safe",
    "road_damaged",
    "road_blocked",
    "road_destroyed",
]

CLASS_DAMAGE_SCORES: dict[int, float] = {
    0: 0.0, 1: 0.4, 2: 1.0,
    3: 0.0, 4: 0.5, 5: 0.8, 6: 1.0,
}

ROAD_CLASSES = {3, 4, 5, 6}
BUILDING_CLASSES = {0, 1, 2}

MODEL_PATH = Path("weights/yolov8m_damage.pt")

_model = None


def _load_sync() -> None:
    global _model
    try:
        from ultralytics import YOLO  # type: ignore[import]
        if MODEL_PATH.exists():
            _model = YOLO(str(MODEL_PATH))
            logger.info("YOLOv8m modeli yuklendi: %s", MODEL_PATH)
        else:
            logger.warning("YOLOv8m model dosyasi bulunamadi (%s). Mock mod aktif.", MODEL_PATH)
    except ImportError:
        logger.warning("ultralytics yuklu degil. Mock mod aktif.")


async def load_yolo() -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _load_sync)


def is_yolo_loaded() -> bool:
    return _model is not None


def predict_sync(image_bytes: bytes) -> list[dict]:
    if _model is None:
        return _mock_predict()
    try:
        from PIL import Image  # type: ignore[import]
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = _model(img, verbose=False)
        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls.item())
                detections.append({
                    "class_id": class_id,
                    "class_name": CLASS_NAMES[class_id],
                    "confidence": round(float(box.conf.item()), 4),
                    "bbox": [round(v, 2) for v in box.xyxy[0].tolist()],
                    "damage_score": CLASS_DAMAGE_SCORES[class_id],
                })
        return detections
    except Exception as exc:
        logger.error("YOLOv8 inference hatasi: %s", exc, exc_info=True)
        return _mock_predict()


def _mock_predict() -> list[dict]:
    return [
        {"class_id": 4, "class_name": "road_damaged",    "confidence": 0.87, "bbox": [102.0, 98.0,  210.0, 195.0], "damage_score": 0.5},
        {"class_id": 1, "class_name": "building_damaged", "confidence": 0.73, "bbox": [50.0,  55.0,  148.0, 160.0], "damage_score": 0.4},
    ]
