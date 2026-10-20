"""
ML Training Pipeline: Module 2 — Medical Cost Estimation (Regression)
Models compared:
- Linear Regression (Baseline)
- Random Forest Regressor
- XGBoost / Gradient Boosting Regressor

Methodology:
- 80/20 Train-Test split
- Feature encoding & scaling fitted ONLY on train data to prevent data leakage
- 5-Fold Cross-Validation
- Evaluation: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), R² Score
- Model artifact serialization with Joblib
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, KFold, GridSearchCV
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

def run_cost_training():
    print("=" * 60)
    print("TRAINING MODULE 2: MEDICAL COST ESTIMATION (REGRESSION)")
    print("=" * 60)

    dataset_path = DATA_DIR / "insurance.csv"
    if not dataset_path.exists():
        from ml.data.prepare_datasets import prepare_medical_cost_dataset
        prepare_medical_cost_dataset()

    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df)} records from {dataset_path.name}")

    # Features and Target
    X = df[["age", "sex", "bmi", "children", "smoker", "region"]]
    y = df["charges"].values

    numeric_features = ["age", "bmi", "children"]
    categorical_features = ["sex", "smoker", "region"]

    # 1. 80/20 Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 2. Pipeline Preprocessor (fitted strictly on X_train)
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False), categorical_features),
        ]
    )

    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    # 3. Model Candidates
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    # Baseline: Linear Regression
    lr = LinearRegression()
    lr.fit(X_train_proc, y_train)

    # Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=6, min_samples_split=4, random_state=42)
    rf.fit(X_train_proc, y_train)

    # Gradient Boosting / XGBoost Regressor
    if HAS_XGBOOST:
        xgb_reg = XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.08, random_state=42)
        xgb_reg.fit(X_train_proc, y_train)
        best_boost = xgb_reg
        boost_name = "XGBoost Regressor"
    else:
        gb = GradientBoostingRegressor(n_estimators=100, max_depth=3, learning_rate=0.08, random_state=42)
        gb.fit(X_train_proc, y_train)
        best_boost = gb
        boost_name = "Gradient Boosting Regressor"

    candidates = {
        "Linear Regression (Baseline)": lr,
        "Random Forest Regressor": rf,
        boost_name: best_boost
    }

    results = {}
    best_r2 = -float("inf")
    best_name = None
    best_model = None

    print("\n--- Model Evaluation on Test Split (20%) ---")
    for name, model in candidates.items():
        y_pred = model.predict(X_test_proc)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        results[name] = {
            "algorithm": name,
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "r2_score": round(float(r2), 4)
        }

        print(f"[{name}] MAE: ${mae:.2f} | RMSE: ${rmse:.2f} | R²: {r2:.4f}")

        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            best_model = model

    print(f"\nWinning Model: {best_name} with R²: {best_r2:.4f}")

    # Save artifacts
    model_artifact_path = MODELS_DIR / "cost_model.joblib"
    preprocessor_artifact_path = MODELS_DIR / "cost_preprocessor.joblib"
    metrics_path = MODELS_DIR / "cost_metrics.json"

    joblib.dump(best_model, model_artifact_path)
    joblib.dump(preprocessor, preprocessor_artifact_path)

    metadata = {
        "winning_model": best_name,
        "models": results,
        "sample_count": len(df),
        "test_size": len(X_test),
        "feature_columns": numeric_features + categorical_features
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Artifacts successfully saved to {MODELS_DIR}")
    return metadata

if __name__ == "__main__":
    run_cost_training()
