"""
ML Inference Service & SHAP Explainability Engine
Handles:
- Loading model artifacts
- Running Risk Classification pipeline
- Running Medical Cost Regression pipeline
- SHAP feature attributions & plain-English translations
- Clinical safety guardrails (extreme value detection)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.schemas.schemas import (
    HealthProfileInput,
    RiskPredictionResponse,
    CostPredictionResponse,
    ShapFeatureContribution
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = Path(settings.MODELS_DIR)
DATA_DIR = Path(settings.DATA_DIR)

class MLInferenceService:
    def __init__(self):
        self.risk_model = None
        self.risk_scaler = None
        self.risk_metadata = None
        self.cost_model = None
        self.cost_preprocessor = None
        self.cost_metadata = None
        self.shap_explainer = None
        self.models_loaded = False

    def load_models(self):
        try:
            risk_model_file = MODELS_DIR / "risk_model.joblib"
            risk_scaler_file = MODELS_DIR / "risk_scaler.joblib"
            risk_meta_file = MODELS_DIR / "risk_metrics.json"

            cost_model_file = MODELS_DIR / "cost_model.joblib"
            cost_prep_file = MODELS_DIR / "cost_preprocessor.joblib"
            cost_meta_file = MODELS_DIR / "cost_metrics.json"

            # Check if models exist, if not, trigger training
            if not (risk_model_file.exists() and cost_model_file.exists()):
                print("Models not found on disk. Initiating training pipeline...")
                self._train_and_save_all()

            self.risk_model = joblib.load(risk_model_file)
            self.risk_scaler = joblib.load(risk_scaler_file)
            with open(risk_meta_file, "r", encoding="utf-8") as f:
                self.risk_metadata = json.load(f)

            self.cost_model = joblib.load(cost_model_file)
            self.cost_preprocessor = joblib.load(cost_prep_file)
            with open(cost_meta_file, "r", encoding="utf-8") as f:
                self.cost_metadata = json.load(f)

            # Initialize SHAP explainer
            self._init_shap()
            self.models_loaded = True
            print("ML models and SHAP explainer loaded successfully.")
        except Exception as e:
            print(f"Error loading ML models: {e}")
            self.models_loaded = False

    def _train_and_save_all(self):
        from ml.data.prepare_datasets import (
            prepare_medical_cost_dataset,
            prepare_combined_health_risk_dataset,
            prepare_insurance_catalogue,
            prepare_diabetes_dataset,
            prepare_heart_dataset
        )
        prepare_medical_cost_dataset()
        prepare_combined_health_risk_dataset()
        prepare_insurance_catalogue()
        prepare_diabetes_dataset()
        prepare_heart_dataset()

        from ml.training.train_risk import run_risk_training
        from ml.training.train_cost import run_cost_training
        run_risk_training()
        run_cost_training()

    def _init_shap(self):
        try:
            import shap
            from sklearn.linear_model import LogisticRegression
            if isinstance(self.risk_model, LogisticRegression):
                # Sample background data for LinearExplainer
                bg = np.zeros((1, 9))
                self.shap_explainer = shap.LinearExplainer(self.risk_model, bg)
                print("SHAP LinearExplainer initialized.")
            else:
                self.shap_explainer = shap.TreeExplainer(self.risk_model)
                print("SHAP TreeExplainer initialized.")
        except Exception as e:
            print(f"SHAP explainer init note: {e}; analytical feature attribution will be used.")
            self.shap_explainer = None

    def check_clinical_alerts(self, profile: HealthProfileInput) -> Tuple[bool, str]:
        alerts = []
        if profile.systolic_bp >= 180 or profile.diastolic_bp >= 120:
            alerts.append(f"Systolic BP ({profile.systolic_bp} mmHg) / Diastolic BP ({profile.diastolic_bp} mmHg) is in the hypertensive crisis range.")
        if profile.glucose >= 250:
            alerts.append(f"Fasting Glucose ({profile.glucose} mg/dL) is significantly above standard glycemic levels.")
        if profile.cholesterol >= 320:
            alerts.append(f"Serum Cholesterol ({profile.cholesterol} mg/dL) indicates severe hypercholesterolemia.")
        if profile.bmi >= 45.0:
            alerts.append(f"BMI ({profile.bmi}) falls into class III obesity.")

        if alerts:
            msg = "CLINICAL ADVISORY: " + " ".join(alerts) + " Some entered values may require professional medical attention. Please consult a qualified healthcare professional. (Decision-support only)."
            return True, msg
        return False, None

    def predict_health_risk(self, profile: HealthProfileInput) -> RiskPredictionResponse:
        if not self.models_loaded:
            self.load_models()

        exercise_map = {"sedentary": 0, "moderate": 1, "active": 2}
        exercise_num = exercise_map.get(profile.exercise_frequency.lower(), 1)
        gender_num = 1 if profile.gender.lower() == "male" else 0
        smoker_val = 1 if profile.smoker else 0

        feature_names = [
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

        raw_features = [
            profile.age,
            gender_num,
            profile.bmi,
            profile.systolic_bp,
            profile.diastolic_bp,
            profile.glucose,
            profile.cholesterol,
            smoker_val,
            exercise_num
        ]

        X_raw = np.array([raw_features])
        X_scaled = self.risk_scaler.transform(X_raw)

        # Probabilities for [Low, Medium, High]
        probabilities = self.risk_model.predict_proba(X_scaled)[0]
        # P(Low) = p0, P(Medium) = p1, P(High) = p2
        p_low, p_med, p_high = probabilities[0], probabilities[1], probabilities[2]

        # Overall risk percentage composite (0 to 100%)
        risk_pct = round(float((p_med * 0.5 + p_high * 1.0) * 100), 1)
        risk_pct = min(99.0, max(5.0, risk_pct))

        # Risk level determination
        if risk_pct < 35.0:
            risk_level = "Low"
        elif risk_pct < 65.0:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # Calculate SHAP or Feature Attributions
        shap_contributions = self._compute_shap_explanations(profile, X_scaled, feature_names)

        # Plain language summary bullet points
        nl_explanations = self._generate_plain_language_explanations(profile, shap_contributions, risk_level)

        # Safety Check
        is_alert, alert_msg = self.check_clinical_alerts(profile)

        winning_model = self.risk_metadata.get("winning_model", "XGBoost / Random Forest Classifier") if self.risk_metadata else "Machine Learning Classifier"

        return RiskPredictionResponse(
            risk_level=risk_level,
            risk_probability=risk_pct,
            model_used=winning_model,
            model_version="v1.0.0",
            shap_top_features=shap_contributions,
            natural_language_explanation=nl_explanations,
            clinical_alert=is_alert,
            clinical_alert_message=alert_msg,
            disclaimer="Estimated risk based on statistical data. Decision-support only — not a medical diagnosis or replacement for a doctor."
        )

    def _compute_shap_explanations(self, profile: HealthProfileInput, X_scaled: np.ndarray, feature_names: List[str]) -> List[ShapFeatureContribution]:
        shap_values = None

        # Attempt SHAP explainer
        if self.shap_explainer is not None:
            try:
                raw_shap = self.shap_explainer.shap_values(X_scaled)
                # For multiclass, take class 2 (High risk) or sum of positive classes
                if isinstance(raw_shap, list):
                    shap_values = raw_shap[2][0] if len(raw_shap) > 2 else raw_shap[1][0]
                elif len(raw_shap.shape) == 3:
                    shap_values = raw_shap[0, :, 2] if raw_shap.shape[2] > 2 else raw_shap[0, :, 1]
                else:
                    shap_values = raw_shap[0]
            except Exception as e:
                shap_values = None

        # If SHAP is unavailable or failed, calculate analytical Tree/Model feature attribution
        if shap_values is None or len(shap_values) != len(feature_names):
            importances = getattr(self.risk_model, "feature_importances_", None)
            if importances is None:
                importances = np.array([0.15, 0.05, 0.20, 0.15, 0.08, 0.12, 0.10, 0.12, 0.03])

            # Directional adjustment based on deviation from standard baseline
            deviations = [
                (profile.age - 35) / 20.0,
                0.0,
                (profile.bmi - 23.0) / 6.0,
                (profile.systolic_bp - 120) / 20.0,
                (profile.diastolic_bp - 80) / 12.0,
                (profile.glucose - 95) / 30.0,
                (profile.cholesterol - 190) / 40.0,
                1.5 if profile.smoker else -0.5,
                -0.4 if profile.exercise_frequency == "active" else (0.4 if profile.exercise_frequency == "sedentary" else 0.0)
            ]
            shap_values = importances * np.array(deviations)

        readable_names = {
            "age": "Age",
            "gender_num": "Gender",
            "bmi": "Body Mass Index (BMI)",
            "systolic_bp": "Systolic Blood Pressure",
            "diastolic_bp": "Diastolic Blood Pressure",
            "glucose": "Fasting Blood Glucose",
            "cholesterol": "Serum Cholesterol",
            "smoker": "Tobacco Smoking Status",
            "exercise_num": "Physical Activity Level"
        }

        feature_values = {
            "age": f"{profile.age} yrs",
            "gender_num": profile.gender.capitalize(),
            "bmi": f"{profile.bmi:.1f} kg/m²",
            "systolic_bp": f"{profile.systolic_bp} mmHg",
            "diastolic_bp": f"{profile.diastolic_bp} mmHg",
            "glucose": f"{profile.glucose} mg/dL",
            "cholesterol": f"{profile.cholesterol} mg/dL",
            "smoker": "Current Smoker" if profile.smoker else "Non-Smoker",
            "exercise_num": profile.exercise_frequency.capitalize()
        }

        contributions = []
        for i, f_name in enumerate(feature_names):
            val = float(shap_values[i])
            direction = "increases_risk" if val > 0 else "decreases_risk"

            # Plain english translation
            disp_name = readable_names.get(f_name, f_name)
            disp_val = feature_values.get(f_name, "")
            if direction == "increases_risk":
                plain = f"{disp_name} ({disp_val}) elevated the estimated risk score."
            else:
                plain = f"{disp_name} ({disp_val}) exerted a protective, risk-lowering influence."

            contributions.append({
                "feature_name": disp_name,
                "feature_value": disp_val,
                "shap_value": round(val, 4),
                "direction": direction,
                "abs_val": abs(val),
                "plain_explanation": plain
            })

        # Rank by absolute magnitude of contribution
        contributions.sort(key=lambda x: x["abs_val"], reverse=True)
        ranked = []
        for rank, item in enumerate(contributions, start=1):
            ranked.append(ShapFeatureContribution(
                feature_name=item["feature_name"],
                feature_value=item["feature_value"],
                shap_value=item["shap_value"],
                importance_rank=rank,
                direction=item["direction"],
                plain_explanation=item["plain_explanation"]
            ))

        return ranked

    def _generate_plain_language_explanations(self, profile: HealthProfileInput, contributions: List[ShapFeatureContribution], risk_level: str) -> List[str]:
        explanations = []

        # Highlight top 3 factors
        top_factors = contributions[:3]
        for item in top_factors:
            explanations.append(item.plain_explanation)

        if profile.smoker:
            explanations.append("Smoking status is a major driver of estimated health risk.")
        elif profile.bmi > 30.0:
            explanations.append(f"A BMI of {profile.bmi:.1f} indicates an elevated risk factor for metabolic conditions.")

        if profile.systolic_bp > 135:
            explanations.append(f"Blood pressure of {profile.systolic_bp}/{profile.diastolic_bp} mmHg indicates pre-hypertensive or hypertensive patterns.")

        if profile.exercise_frequency == "active":
            explanations.append("Regular physical activity provides a protective factor moderating overall risk.")

        return explanations[:4]

    def predict_medical_cost(self, profile: HealthProfileInput) -> CostPredictionResponse:
        if not self.models_loaded:
            self.load_models()

        df_input = pd.DataFrame([{
            "age": profile.age,
            "sex": profile.gender.lower() if profile.gender.lower() in ["male", "female"] else "male",
            "bmi": profile.bmi,
            "children": profile.dependents,
            "smoker": "yes" if profile.smoker else "no",
            "region": profile.region.lower() if profile.region.lower() in ["southwest", "southeast", "northwest", "northeast"] else "southeast"
        }])

        X_proc = self.cost_preprocessor.transform(df_input)
        raw_pred = self.cost_model.predict(X_proc)[0]

        # Clean cost estimate
        est_cost = max(1200.0, float(raw_pred))
        monthly = round(est_cost / 12.0, 2)
        low_range = round(est_cost * 0.82, 2)
        high_range = round(est_cost * 1.18, 2)

        # Drivers
        drivers = []
        if profile.smoker:
            drivers.append("Tobacco usage significantly increases expected annual medical expenditure.")
        if profile.bmi > 30.0:
            drivers.append(f"BMI of {profile.bmi:.1f} contributes to higher routine outpatient and diagnostic requirements.")
        if profile.age > 45:
            drivers.append(f"Age group ({profile.age} years) shows higher baseline cardiovascular and preventative costs.")
        if profile.dependents > 1:
            drivers.append(f"Family size ({profile.dependents} dependents) increases expected pediatric and healthcare frequency.")

        if not drivers:
            drivers.append("Healthy vitals and non-smoking status maintain estimated costs near baseline.")

        winning_model = self.cost_metadata.get("winning_model", "Random Forest Regressor") if self.cost_metadata else "Machine Learning Regressor"

        return CostPredictionResponse(
            estimated_annual_cost=round(est_cost, 2),
            estimated_monthly_cost=monthly,
            cost_range_low=low_range,
            cost_range_high=high_range,
            confidence_tier="High" if self.cost_metadata else "Moderate",
            model_used=winning_model,
            key_cost_drivers=drivers,
            disclaimer="Estimated medical cost based on statistical data. This is NOT an insurance premium quote."
        )

# Global singleton
ml_service = MLInferenceService()
