from fastapi import APIRouter
from typing import List, Dict, Any
from app.schemas.schemas import HealthProfileInput

router = APIRouter(prefix="/api/demo", tags=["Demo Profiles"])

DEMO_PROFILES: List[Dict[str, Any]] = [
    {
        "id": "demo-high-risk",
        "title": "Patient A: Middle-Aged Smoker with Elevated Vitals",
        "badge": "High Risk Demo",
        "description": "45-year-old active smoker with high BMI (31.0), borderline hypertension (138/88 mmHg), and elevated fasting glucose (148 mg/dL).",
        "profile": {
            "age": 45,
            "gender": "male",
            "height_cm": 175.0,
            "weight_kg": 95.0,
            "bmi": 31.0,
            "systolic_bp": 138,
            "diastolic_bp": 88,
            "glucose": 148,
            "cholesterol": 235,
            "smoker": True,
            "smoking_status": "current",
            "exercise_frequency": "sedentary",
            "alcohol_frequency": "moderate",
            "family_history_heart": True,
            "family_history_diabetes": True,
            "pre_existing_conditions": ["hypertension", "pre-diabetes"],
            "dependents": 2,
            "annual_income": 950000.0,
            "insurance_budget_annual": 25000.0,
            "preferred_coverage_type": "comprehensive",
            "region": "southeast"
        }
    },
    {
        "id": "demo-low-risk",
        "title": "Patient B: Young Active Professional",
        "badge": "Low Risk Demo",
        "description": "26-year-old non-smoker with optimal BMI (22.4), healthy cardiovascular vitals (118/76 mmHg), and normal fasting glucose (88 mg/dL).",
        "profile": {
            "age": 26,
            "gender": "female",
            "height_cm": 165.0,
            "weight_kg": 61.0,
            "bmi": 22.4,
            "systolic_bp": 118,
            "diastolic_bp": 76,
            "glucose": 88,
            "cholesterol": 175,
            "smoker": False,
            "smoking_status": "never",
            "exercise_frequency": "active",
            "alcohol_frequency": "never",
            "family_history_heart": False,
            "family_history_diabetes": False,
            "pre_existing_conditions": [],
            "dependents": 0,
            "annual_income": 650000.0,
            "insurance_budget_annual": 16000.0,
            "preferred_coverage_type": "comprehensive",
            "region": "southwest"
        }
    },
    {
        "id": "demo-senior",
        "title": "Patient C: Senior Citizen with Chronic History",
        "badge": "Senior Citizen Demo",
        "description": "62-year-old with stage 1 hypertension (152/92 mmHg), diabetes history (165 mg/dL), and high serum cholesterol (248 mg/dL).",
        "profile": {
            "age": 62,
            "gender": "male",
            "height_cm": 170.0,
            "weight_kg": 82.0,
            "bmi": 28.4,
            "systolic_bp": 152,
            "diastolic_bp": 92,
            "glucose": 165,
            "cholesterol": 248,
            "smoker": False,
            "smoking_status": "former",
            "exercise_frequency": "moderate",
            "alcohol_frequency": "never",
            "family_history_heart": True,
            "family_history_diabetes": True,
            "pre_existing_conditions": ["type-2 diabetes", "hypertension"],
            "dependents": 1,
            "annual_income": 800000.0,
            "insurance_budget_annual": 35000.0,
            "preferred_coverage_type": "critical_illness",
            "region": "northeast"
        }
    }
]

@router.get("/profiles")
def get_demo_profiles():
    """
    Returns curated demo profiles for rapid testing and presentations.
    """
    return DEMO_PROFILES
