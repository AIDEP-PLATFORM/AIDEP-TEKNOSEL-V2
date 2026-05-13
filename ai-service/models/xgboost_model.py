import asyncio
import logging
from pathlib import Path

import numpy as np

from core.minio_client import WEIGHTS_DIR, download_model, upload_model

logger = logging.getLogger(__name__)

OBJECT_NAME    = "xgboost_priority.json"
LOCAL_FALLBACK = WEIGHTS_DIR / OBJECT_NAME

_model = None


def _load_sync(model_path: Path) -> None:
    global _model
    import xgboost as xgb  # type: ignore[import]
    _model = xgb.Booster()
    _model.load_model(str(model_path))
    logger.info("XGBoost modeli yüklendi: %s", model_path)


async def load_xgboost() -> None:
    # 1) MinIO'dan indir
    minio_path = WEIGHTS_DIR / OBJECT_NAME
    ok = await download_model(OBJECT_NAME, minio_path)

    if ok and minio_path.exists():
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, minio_path)
        return

    # 2) Yerel weights/ fallback (bind-mount)
    if LOCAL_FALLBACK.exists():
        logger.info("MinIO'da model yok — yerel dosya kullanılıyor: %s", LOCAL_FALLBACK)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _load_sync, LOCAL_FALLBACK)
        # Yerel modeli MinIO'ya yedekle
        await upload_model(LOCAL_FALLBACK, OBJECT_NAME)
        return

    raise RuntimeError(
        f"XGBoost model dosyası bulunamadı. "
        f"'{OBJECT_NAME}' dosyasını MinIO 'ai-models' bucket'ına veya "
        f"./ai-service/weights/ dizinine koyun."
    )


def is_xgb_loaded() -> bool:
    return _model is not None


def predict_sync(features: np.ndarray) -> float:
    if _model is None:
        raise RuntimeError("XGBoost modeli yüklenmedi")
    try:
        import xgboost as xgb  # type: ignore[import]
        dmatrix = xgb.DMatrix(features.reshape(1, -1))
        score = float(_model.predict(dmatrix)[0])
        return round(min(max(score, 0.0), 100.0), 2)
    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("XGBoost inference hatası: %s", exc, exc_info=True)
        raise
