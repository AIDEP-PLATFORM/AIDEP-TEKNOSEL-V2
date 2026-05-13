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

CONFIDENCE_THRESHOLD = 0.5

OBJECT_NAME    = "yolov8m_damage.pt"
LOCAL_FALLBACK = WEIGHTS_DIR / OBJECT_NAME

_model = None


def _load_sync(model_path: Path) -> None:
    global _model
    from ultralytics import YOLO  # type: ignore[import]
    _model = YOLO(str(model_path))
    logger.info("YOLOv8 modeli yüklendi: %s (%d sınıf)", model_path, len(CLASS_NAMES))


async def load_yolo() -> None:
    minio_path = WEIGHTS_DIR / OBJECT_NAME

    # 1) Zaten cache'liyse tekrar indirme (reload döngüsünü önler)
    if minio_path.exists():
        logger.info("Model cache'den yükleniyor: %s", minio_path)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, minio_path)
        return

    # 2) MinIO'dan indir
    ok = await download_model(OBJECT_NAME, minio_path)
    if ok and minio_path.exists():
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, minio_path)
        return

    # 3) Yerel weights/ fallback (bind-mount)
    if LOCAL_FALLBACK.exists():
        logger.info("MinIO'da model yok — yerel dosya kullanılıyor: %s", LOCAL_FALLBACK)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, LOCAL_FALLBACK)
        await upload_model(LOCAL_FALLBACK, OBJECT_NAME)
        return

    raise RuntimeError(
        f"YOLOv8 model dosyası bulunamadı. "
        f"'{OBJECT_NAME}' dosyasını MinIO 'ai-models' bucket'ına veya "
        f"./ai-service/weights/ dizinine koyun."
    )


def is_yolo_loaded() -> bool:
    return _model is not None


def predict_sync(image_bytes: bytes) -> list[dict]:
    if _model is None:
        raise RuntimeError("YOLOv8 modeli yüklenmedi")
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
                confidence = round(float(box.conf.item()), 4)
                if confidence < CONFIDENCE_THRESHOLD:
                    continue
                detections.append({
                    "class_id":    class_id,
                    "class_name":  CLASS_NAMES[class_id],
                    "confidence":  confidence,
                    "bbox":        [round(v, 2) for v in box.xyxy[0].tolist()],
                    "damage_score": CLASS_DAMAGE_SCORES[class_id],
                })
        return detections
    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("YOLOv8 inference hatası: %s", exc, exc_info=True)
        raise
