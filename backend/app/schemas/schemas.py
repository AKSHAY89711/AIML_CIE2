from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# -----------------------------
# Auth Schemas
# -----------------------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# -----------------------------
# Health Profile Input
# -----------------------------

class HealthProfileInput(BaseModel):
    # Demographics
    age: int = Field(..., ge=18, le=100, description="Age between 18 and 100")
    gender: str = Field("male", description="Gender: male, female, other")
    height_cm: Optional[float] = Field(170.0, ge=100.0, le=250.0)
    weight_kg: Optional[float] = Field(70.0, ge=30.0, le=250.0)
    bmi: Optional[float] = Field(None, ge=12.0, le=70.0)

    # Clinical Vitals
    systolic_bp: int = Field(120, ge=70, le=240, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: int = Field(80, ge=40, le=140, description="Diastolic Blood Pressure (mmHg)")
    glucose: int = Field(100, ge=50, le=400, description="Fasting Blood Glucose (mg/dL)")
    cholesterol: int = Field(190, ge=100, le=450, description="Total Serum Cholesterol (mg/dL)")

    # Lifestyle
    smoker: bool = Field(False, description="Whether currently a tobacco smoker")
    smoking_status: str = Field("never", description="'never', 'former', 'current'")
    exercise_frequency: str = Field("moderate", description="'sedentary', 'moderate', 'active'")
    alcohol_frequency: str = Field("moderate", description="'never', 'moderate', 'frequent'")

    # Family & Medical History
    family_history_heart: bool = Field(False)
    family_history_diabetes: bool = Field(False)
    pre_existing_conditions: List[str] = Field(default_factory=list, description="e.g. ['hypertension', 'diabetes', 'asthma']")

    # Financial & Insurance Preferences
    dependents: int = Field(0, ge=0, le=10)
    annual_income: float = Field(600000.0, ge=50000.0)
    insurance_budget_annual: float = Field(25000.0, ge=3000.0)
    preferred_coverage_type: str = Field("comprehensive", description="comprehensive, basic, critical_illness, family_floater")
    region: str = Field("southeast", description="southeast, southwest, northeast, northwest")

    @field_validator("bmi", mode="before")
    def calculate_or_validate_bmi(cls, v, values):
        # Auto-calculate BMI if not provided and height/weight exist
        if v is not None:
            return round(float(v), 1)
        data = values.data if hasattr(values, "data") else values
        h = data.get("height_cm")
        w = data.get("weight_kg")
        if h and w and h > 0:
            h_m = h / 100.0
            return round(w / (h_m * h_m), 1)
        return 24.5

# -----------------------------
# ML Prediction Schemas
# -----------------------------

class ShapFeatureContribution(BaseModel):
    feature_name: str
    feature_value: Any
    shap_value: float
    importance_rank: int
    direction: str  # "increases_risk" or "decreases_risk"
    plain_explanation: str

class RiskPredictionResponse(BaseModel):
    risk_level: str  # "Low", "Medium", "High"
    risk_probability: float  # 0 to 100 percentage
    model_used: str
    model_version: str
    shap_top_features: List[ShapFeatureContribution]
    natural_language_explanation: List[str]
    clinical_alert: bool
    clinical_alert_message: Optional[str] = None
    disclaimer: str = "Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor."

class CostPredictionResponse(BaseModel):
    estimated_annual_cost: float
    estimated_monthly_cost: float
    cost_range_low: float
    cost_range_high: float
    confidence_tier: str
    model_used: str
    key_cost_drivers: List[str]
    disclaimer: str = "Estimated medical cost based on statistical patterns. This is NOT an insurance premium quote."

# -----------------------------
# Insurance Plan Schemas
# -----------------------------

class InsurancePlanResponse(BaseModel):
    id: int
    plan_id: str
    plan_name: str
    insurer_name: str
    plan_type: str
    annual_premium: float
    sum_insured: float
    deductible: float
    co_pay: float
    waiting_period: int
    room_rent_limit: str
    network_hospital_count: int
    maternity_coverage: bool
    critical_illness_coverage: bool
    outpatient_coverage: bool
    day_care_procedures: bool
    ayush_coverage: bool
    minimum_age: int
    maximum_age: int
    risk_compatibility: str
    claim_settlement_ratio: float
    key_features: List[str]
    exclusions: List[str]
    important_limitations: List[str]

    class Config:
        from_attributes = True

class RecommendedPlanItem(BaseModel):
    rank: int
    match_score: float
    affordability_score: float
    coverage_score: float
    risk_match_score: float
    terms_score: float
    plan: InsurancePlanResponse
    reasons: List[str]
    limitations: List[str]

class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendedPlanItem]
    total_evaluated: int
    disclaimer: str = "Recommended based on your provided profile and selected preferences. Does not guarantee policy issuance."

# -----------------------------
# Assessment Request / Response
# -----------------------------

class AssessmentCreateRequest(BaseModel):
    title: Optional[str] = "Health & Insurance Assessment"
    is_demo: bool = False
    profile: HealthProfileInput

class AssessmentDetailResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    is_demo: bool
    profile: HealthProfileInput
    risk: RiskPredictionResponse
    cost: CostPredictionResponse
    recommendations: List[RecommendedPlanItem]
    disclaimer: str = "Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor."

class AssessmentSummaryResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    is_demo: bool
    risk_level: str
    risk_probability: float
    estimated_annual_cost: float
    top_plan_name: Optional[str] = None
    top_plan_match: Optional[float] = None

# -----------------------------
# Model Performance Schemas
# -----------------------------

class ClassificationMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    algorithm: str
    confusion_matrix: Optional[List[List[int]]] = None

class RegressionMetrics(BaseModel):
    mae: float
    rmse: float
    r2_score: float
    algorithm: str

class RecommendationMetrics(BaseModel):
    top3_hit_rate: float
    catalog_coverage: float
    algorithm: str

class ModelPerformanceResponse(BaseModel):
    risk_classification: Dict[str, ClassificationMetrics]
    cost_regression: Dict[str, RegressionMetrics]
    recommendation: RecommendationMetrics
    active_risk_model: str
    active_cost_model: str
    last_trained: str
    dataset_details: Dict[str, Any]
