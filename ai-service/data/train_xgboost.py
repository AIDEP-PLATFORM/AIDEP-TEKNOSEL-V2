"""
AI-004 — XGBoost Önceliklendirme Modeli Eğitimi

Çalıştır (ai-service dizininden):
    python data/train_xgboost.py              # Sabit parametrelerle hızlı eğitim
    python data/train_xgboost.py --grid-search # Grid Search ile optimal parametre arama

Girdi:  data/priority_dataset.csv
Çıktı:  weights/xgboost_priority.json

Metrikler: R², MAE (5-katlı çapraz doğrulama)
"""

import argparse
from pathlib import Path
import sys

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold, GridSearchCV
from sklearn.metrics import r2_score, mean_absolute_error
import xgboost as xgb

DATASET_PATH = Path(__file__).parent / "priority_dataset.csv"
MODEL_PATH   = Path(__file__).parent.parent / "weights" / "xgboost_priority.json"

FEATURES = [
    "urgency_level",
    "wait_time_minutes",
    "distance_km",
    "need_type",
    "meteorology_score",
    "person_count",
    "area_damage_score",
]
TARGET = "priority_score"


def load_data() -> tuple[np.ndarray, np.ndarray]:
    if not DATASET_PATH.exists():
        print(f"Veri seti bulunamadi: {DATASET_PATH}")
        print("Once 'python data/generate_dataset.py' calistirin.")
        sys.exit(1)

    df = pd.read_csv(DATASET_PATH)
    print(f"Yuklendi: {len(df)} satir, {len(df.columns)} sutun")
    print(df[TARGET].describe().to_string())
    return df[FEATURES].values.astype(np.float32), df[TARGET].values.astype(np.float32)


_GRID_PARAM_GRID = {
    "n_estimators":  [100, 200, 300],
    "max_depth":     [4, 6, 8],
    "learning_rate": [0.01, 0.1, 0.2],
    "subsample":     [0.7, 0.8, 1.0],
}

_GRID_FIXED = {
    "colsample_bytree": 0.9,
    "min_child_weight": 2,
    "reg_alpha":        0.1,
    "reg_lambda":       1.0,
}


def run_grid_search(X: np.ndarray, y: np.ndarray) -> dict:
    print("--- Grid Search (5-katli CV, bu islem birkaç dakika surer) ---")
    base = xgb.XGBRegressor(random_state=42, verbosity=0, **_GRID_FIXED)
    gs = GridSearchCV(
        estimator=base,
        param_grid=_GRID_PARAM_GRID,
        scoring="r2",
        cv=5,
        n_jobs=-1,
        verbose=1,
    )
    gs.fit(X, y)
    print(f"\nEn iyi parametreler : {gs.best_params_}")
    print(f"En iyi CV R²        : {gs.best_score_:.4f}")
    return {**gs.best_params_, **_GRID_FIXED}


def cross_validate(X: np.ndarray, y: np.ndarray, params: dict) -> None:
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    r2_scores, mae_scores = [], []

    for fold, (train_idx, val_idx) in enumerate(kf.split(X), 1):
        X_tr, X_val = X[train_idx], X[val_idx]
        y_tr, y_val = y[train_idx], y[val_idx]

        model = xgb.XGBRegressor(**params, random_state=42, verbosity=0)
        model.fit(X_tr, y_tr)
        preds = model.predict(X_val)

        r2  = r2_score(y_val, preds)
        mae = mean_absolute_error(y_val, preds)
        r2_scores.append(r2)
        mae_scores.append(mae)
        print(f"  Fold {fold}: R²={r2:.4f}  MAE={mae:.2f}")

    print(f"\n5-Fold Ozet | R²={np.mean(r2_scores):.4f} (±{np.std(r2_scores):.4f})"
          f"  MAE={np.mean(mae_scores):.2f} (±{np.std(mae_scores):.2f})")

    if np.mean(r2_scores) < 0.85:
        print("UYARI: R² hedefi (>=0.85) karsilanmadi — daha fazla veri veya hiperparametre ayari gerekebilir.")
    if np.mean(mae_scores) >= 10:
        print("UYARI: MAE hedefi (<10) karsilanmadi.")


def train_final(X: np.ndarray, y: np.ndarray, params: dict) -> xgb.Booster:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42
    )

    model = xgb.XGBRegressor(**params, random_state=42, verbosity=0)
    model.fit(X_train, y_train)

    preds_test = model.predict(X_test)
    r2  = r2_score(y_test, preds_test)
    mae = mean_absolute_error(y_test, preds_test)
    print(f"\nTest seti | R²={r2:.4f}  MAE={mae:.2f}")

    return model.get_booster()


_DEFAULT_PARAMS = {
    "n_estimators":     200,
    "max_depth":        6,
    "learning_rate":    0.1,
    "subsample":        0.8,
    "colsample_bytree": 0.9,
    "min_child_weight": 2,
    "reg_alpha":        0.1,
    "reg_lambda":       1.0,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="XGBoost önceliklendirme modeli eğitimi")
    parser.add_argument(
        "--grid-search",
        action="store_true",
        help="Grid Search ile optimal hiperparametre ara (yavaş)",
    )
    args = parser.parse_args()

    print("=== XGBoost Önceliklendirme Modeli Eğitimi ===\n")

    X, y = load_data()

    if args.grid_search:
        best_params = run_grid_search(X, y)
        print()
    else:
        best_params = _DEFAULT_PARAMS
        print("Sabit parametreler kullaniliyor (--grid-search ile optimize edebilirsiniz)\n")

    print("--- 5-Katli Capraz Dogrulama ---")
    cross_validate(X, y, best_params)

    print("\n--- Son Model (Train %70 / Test %30) ---")
    booster = train_final(X, y, best_params)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(MODEL_PATH))
    print(f"\nModel kaydedildi: {MODEL_PATH}")
    print("Ozellik agirliklarini goster:")

    importance = booster.get_fscore()
    for feat, imp in sorted(importance.items(), key=lambda x: -x[1]):
        print(f"  {feat}: {imp}")


if __name__ == "__main__":
    main()
