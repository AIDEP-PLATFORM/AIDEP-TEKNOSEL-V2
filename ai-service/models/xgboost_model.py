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
    try:
        import xgboost as xgb  # type: ignore[import]
        _model = xgb.Booster()
        _model.load_model(str(model_path))
        logger.info("XGBoost modeli yüklendi: %s", model_path)
    except ImportError:
        logger.warning("xgboost yüklü değil. Mock mod aktif.")
    except Exception as exc:
        logger.error("XGBoost yükleme hatası: %s", exc)
        _model = None


async def load_xgboost() -> None:
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

    logger.warning("XGBoost model dosyası bulunamadı. Mock mod aktif.")


def is_xgb_loaded() -> bool:
    return _model is not None


def predict_sync(features: np.ndarray) -> float:
    if _model is None:
        return _mock_predict(features)
    try:
        import xgboost as xgb  # type: ignore[import]
        dmatrix = xgb.DMatrix(features.reshape(1, -1))
        score = float(_model.predict(dmatrix)[0])
        return round(min(max(score, 0.0), 100.0), 2)
    except Exception as exc:
        logger.error("XGBoost inference hatası: %s", exc, exc_info=True)
        return _mock_predict(features)


def _mock_predict(features: np.ndarray) -> float:
    # features: [urgency, wait, distance, need_type, meteo, persons, damage]
    urgency      = float(features[0]) / 5.0
    wait_norm    = min(float(features[1]) / 480.0, 1.0)
    dist_pen     = max(0.0, 1.0 - float(features[2]) / 20.0)
    need_w       = [1.0, 0.9, 0.6, 0.4, 0.3]
    need_score   = need_w[min(int(features[3]), 4)]
    meteo_score  = float(features[4])
    persons_norm = min(float(features[5]) / 50.0, 1.0)
    damage_score = float(features[6])

    score = (
        urgency      * 25.0 +
        wait_norm    * 20.0 +
        dist_pen     * 10.0 +
        need_score   * 18.0 +
        meteo_score  *  5.0 +
        persons_norm *  7.0 +
        damage_score * 15.0
    )
    return round(min(score, 100.0), 2)
