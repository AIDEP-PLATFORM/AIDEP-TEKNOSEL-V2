import asyncio
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = Path("weights/xgboost_priority.json")

_model = None


def _load_sync() -> None:
    global _model
    try:
        import xgboost as xgb  # type: ignore[import]
        if MODEL_PATH.exists():
            _model = xgb.Booster()
            _model.load_model(str(MODEL_PATH))
            logger.info("XGBoost modeli yuklendi: %s", MODEL_PATH)
        else:
            logger.warning("XGBoost model dosyasi bulunamadi (%s). Mock mod aktif.", MODEL_PATH)
    except ImportError:
        logger.warning("xgboost yuklu degil. Mock mod aktif.")


async def load_xgboost() -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _load_sync)


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
        logger.error("XGBoost inference hatasi: %s", exc, exc_info=True)
        return _mock_predict(features)


def _mock_predict(features: np.ndarray) -> float:
    urgency      = float(features[0]) / 5.0
    wait_norm    = min(float(features[1]) / 120.0, 1.0)
    dist_pen     = max(0.0, 1.0 - float(features[2]) / 50.0)
    need_w       = [0.9, 1.0, 0.6, 1.0, 0.4]
    need_score   = need_w[min(int(features[3]), 4)]
    meteo_pen    = 1.0 - float(features[4]) * 0.3
    persons_norm = min(float(features[5]) / 20.0, 1.0)
    damage_score = float(features[6])

    score = (
        urgency      * 30.0 +
        wait_norm    * 15.0 +
        dist_pen     * 10.0 +
        need_score   * 20.0 +
        meteo_pen    *  5.0 +
        persons_norm * 10.0 +
        damage_score * 10.0
    )
    return round(min(score, 100.0), 2)
