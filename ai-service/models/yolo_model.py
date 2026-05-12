import asyncio
import io
import logging
from pathlib import Path

from core.minio_client import WEIGHTS_DIR, download_model, upload_model

logger = logging.getLogger(__name__)

CLASS_NAMES = [
    "bina_cok_riskli",   # 0 — çok riskli bina
    "bina_riskli",        # 1 — riskli bina
    "bina_saglam",        # 2 — sağlam bina
    "bina_yikilmis",      # 3 — yıkılmış bina
    "yol_az_hasarli",     # 4 — az hasarlı yol
    "yol_cok_hasarli",    # 5 — çok hasarlı yol
    "yol_gecilebilir",    # 6 — geçilebilir yol
    "yol_gecilemez",      # 7 — geçilemez yol
    "yol_orta_hasarli",   # 8 — orta hasarlı yol
    "yol_saglam",         # 9 — sağlam yol
    "yol_yikilmis",       # 10 — yıkılmış yol
]

CLASS_DAMAGE_SCORES: dict[int, float] = {
    0: 0.75,  # bina_cok_riskli
    1: 0.50,  # bina_riskli
    2: 0.00,  # bina_saglam
    3: 1.00,  # bina_yikilmis
    4: 0.20,  # yol_az_hasarli
    5: 0.80,  # yol_cok_hasarli
    6: 0.00,  # yol_gecilebilir
    7: 0.90,  # yol_gecilemez
    8: 0.50,  # yol_orta_hasarli
    9: 0.00,  # yol_saglam
    10: 1.00, # yol_yikilmis
}

ROAD_CLASSES     = {4, 5, 6, 7, 8, 9, 10}
BUILDING_CLASSES = {0, 1, 2, 3}

OBJECT_NAME    = "yolov8m_damage.pt"
LOCAL_FALLBACK = WEIGHTS_DIR / OBJECT_NAME

_model = None


def _load_sync(model_path: Path) -> None:
    global _model
    try:
        from ultralytics import YOLO  # type: ignore[import]
        _model = YOLO(str(model_path))
        logger.info("YOLOv8 modeli yüklendi: %s (%d sınıf)", model_path, len(CLASS_NAMES))
    except ImportError:
        logger.warning("ultralytics yüklü değil. Mock mod aktif.")
    except Exception as exc:
        logger.error("YOLOv8 yükleme hatası: %s", exc)
        _model = None


async def load_yolo() -> None:
    # 1) MinIO'dan indir
    minio_path = WEIGHTS_DIR / OBJECT_NAME
    ok = await download_model(OBJECT_NAME, minio_path)

    if ok and minio_path.exists():
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, minio_path)
        return

    # 2) Yerel weights/ fallback
    if LOCAL_FALLBACK.exists():
        logger.warning("MinIO'da model yok — yerel dosya kullanılıyor: %s", LOCAL_FALLBACK)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, LOCAL_FALLBACK)
        # Yerel modeli MinIO'ya yedekle (ilk kurulum)
        await upload_model(LOCAL_FALLBACK, OBJECT_NAME)
        return

    logger.warning("YOLOv8 model dosyası bulunamadı. Mock mod aktif.")


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
                if class_id >= len(CLASS_NAMES):
                    continue
                detections.append({
                    "class_id":    class_id,
                    "class_name":  CLASS_NAMES[class_id],
                    "confidence":  round(float(box.conf.item()), 4),
                    "bbox":        [round(v, 2) for v in box.xyxy[0].tolist()],
                    "damage_score": CLASS_DAMAGE_SCORES[class_id],
                })
        return detections
    except Exception as exc:
        logger.error("YOLOv8 inference hatası: %s", exc, exc_info=True)
        return _mock_predict()


def _mock_predict() -> list[dict]:
    return [
        {
            "class_id": 5,
            "class_name": "yol_cok_hasarli",
            "confidence": 0.87,
            "bbox": [102.0, 98.0, 210.0, 195.0],
            "damage_score": 0.80,
        },
        {
            "class_id": 1,
            "class_name": "bina_riskli",
            "confidence": 0.73,
            "bbox": [50.0, 55.0, 148.0, 160.0],
            "damage_score": 0.50,
        },
    ]
