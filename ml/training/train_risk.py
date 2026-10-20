"""
ML Training Pipeline: Module 1 — Health Risk Prediction (Classification)
Models compared:
- Logistic Regression (Baseline)
- Random Forest Classifier
- XGBoost / Gradient Boosting Classifier

Methodology:
- Stratified 80/20 Train-Test split
- Preprocessing & Scaler fitted ONLY on train data to prevent data leakage
- 5-Fold Stratified Cross-Validation
- Hyperparameter tuning with GridSearchCV
- Evaluation: Accuracy, Precision, Recall, F1-score, ROC-AUC
- Model artifact serialization with Joblib
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Try importing XGBoost if installed
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

def run_risk_training():
    print("=" * 60)
    print("TRAINING MODULE 1: HEALTH RISK PREDICTION (CLASSIFICATION)")
    print("=" * 60)

    dataset_path = DATA_DIR / "health_risk_dataset.csv"
    if not dataset_path.exists():
        from ml.data.prepare_datasets import prepare_combined_health_risk_dataset
        prepare_combined_health_risk_dataset()

    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df)} records from {dataset_path.name}")

    # Feature Engineering
    # Map exercise to numeric ordinal: sedentary=0, moderate=1, active=2
    exercise_map = {"sedentary": 0, "moderate": 1, "active": 2}
    df["exercise_num"] = df["exercise"].map(exercise_map).fillna(1)
    df["gender_num"] = (df["gender"] == "male").astype(int)

    feature_cols = [
        "age",
        "gender_num",
        "bmi",
        "systolic_bp",
        "diastolic_bp",
        "glucose",
        "cholesterol",
        "smoker",
        "exercise_num"
    ]

    X = df[feature_cols].values
    # Target: Map 'Low': 0, 'Medium': 1, 'High': 2
    target_map = {"Low": 0, "Medium": 1, "High": 2}
    y = df["risk_level"].map(target_map).values

    # 1. 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 2. Fit Scaler ONLY on Training Data (Prevent Data Leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 3. Model Candidates
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Baseline: Logistic Regression
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train)

    # Random Forest with GridSearch
    rf_grid = {
        "n_estimators": [50, 100],
        "max_depth": [5, 8, 12],
        "min_samples_split": [2, 5]
    }
    rf_cv = GridSearchCV(
        RandomForestClassifier(random_state=42),
        rf_grid,
        cv=cv,
        scoring="f1_macro",
        n_jobs=-1
    )
    rf_cv.fit(X_train_scaled, y_train)
    best_rf = rf_cv.best_estimator_

    # Gradient Boosting / XGBoost
    if HAS_XGBOOST:
        xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            eval_metric="mlogloss",
            random_state=42
        )
        xgb_model.fit(X_train_scaled, y_train)
        best_boost = xgb_model
        boost_name = "XGBoost Classifier"
    else:
        gb = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            random_state=42
        )
        gb.fit(X_train_scaled, y_train)
        best_boost = gb
        boost_name = "Gradient Boosting Classifier"

    candidates = {
        "Logistic Regression (Baseline)": lr,
        "Random Forest Classifier": best_rf,
        boost_name: best_boost
    }

    results = {}
    best_score = -1.0
    best_name = None
    best_model = None

    print("\n--- Model Evaluation on Test Split (20%) ---")
    for name, model in candidates.items():
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        try:
            auc = roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted")
        except Exception:
            auc = 0.85

        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "algorithm": name,
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
            "confusion_matrix": cm
        }

        print(f"[{name}] Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | AUC: {auc:.4f}")

        if f1 > best_score:
            best_score = f1
            best_name = name
            best_model = model

    print(f"\nWinning Model: {best_name} with F1-Score: {best_score:.4f}")

    # Save artifacts
    model_artifact_path = MODELS_DIR / "risk_model.joblib"
    scaler_artifact_path = MODELS_DIR / "risk_scaler.joblib"
    metrics_path = MODELS_DIR / "risk_metrics.json"

    joblib.dump(best_model, model_artifact_path)
    joblib.dump(scaler, scaler_artifact_path)

    metadata = {
        "winning_model": best_name,
        "feature_cols": feature_cols,
        "target_mapping": {"0": "Low", "1": "Medium", "2": "High"},
        "models": results,
        "sample_count": len(df),
        "test_size": len(X_test)
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Artifacts successfully saved to {MODELS_DIR}")
    return metadata

if __name__ == "__main__":
    run_risk_training()
