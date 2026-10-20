import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="user")  # 'user', 'admin'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), default="Health & Insurance Assessment")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False)
    disclaimer_acknowledged = Column(Boolean, default=True)

    user = relationship("User", back_populates="assessments")
    health_profile = relationship("HealthProfile", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    risk_prediction = relationship("RiskPrediction", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    cost_prediction = relationship("CostPrediction", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="assessment", cascade="all, delete-orphan")

class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), unique=True, nullable=False)

    # Demographics
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=False)

    # Clinical Vitals
    systolic_bp = Column(Integer, nullable=False)
    diastolic_bp = Column(Integer, nullable=False)
    glucose = Column(Integer, nullable=False)
    cholesterol = Column(Integer, nullable=False)

    # Lifestyle
    smoker = Column(Boolean, default=False)
    smoking_status = Column(String(50), default="never")  # 'never', 'former', 'current'
    exercise_frequency = Column(String(50), default="moderate")  # 'sedentary', 'moderate', 'active'
    alcohol_frequency = Column(String(50), default="moderate")  # 'never', 'moderate', 'frequent'

    # Medical History & Pre-existing
    family_history_heart = Column(Boolean, default=False)
    family_history_diabetes = Column(Boolean, default=False)
    pre_existing_conditions = Column(Text, default="[]")  # JSON encoded list: ['hypertension', 'diabetes', etc.]

    # Financial & Insurance Preferences
    dependents = Column(Integer, default=0)
    annual_income = Column(Float, default=600000.0)
    insurance_budget_annual = Column(Float, default=25000.0)
    preferred_coverage_type = Column(String(50), default="comprehensive")
    region = Column(String(50), default="southeast")

    assessment = relationship("Assessment", back_populates="health_profile")

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), unique=True, nullable=False)

    risk_level = Column(String(20), nullable=False)  # 'Low', 'Medium', 'High'
    risk_probability = Column(Float, nullable=False)  # 0.0 to 100.0
    model_used = Column(String(100), default="XGBoost Classifier")
    model_version = Column(String(50), default="v1.0.0")

    # Explainability Data
    shap_top_features = Column(Text, default="[]")  # JSON string of features, SHAP values, descriptions
    natural_language_explanation = Column(Text, default="[]")  # JSON list of plain language strings
    clinical_alert = Column(Boolean, default=False)
    clinical_alert_message = Column(Text, nullable=True)

    assessment = relationship("Assessment", back_populates="risk_prediction")

class CostPrediction(Base):
    __tablename__ = "cost_predictions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), unique=True, nullable=False)

    estimated_annual_cost = Column(Float, nullable=False)
    estimated_monthly_cost = Column(Float, nullable=False)
    cost_range_low = Column(Float, nullable=False)
    cost_range_high = Column(Float, nullable=False)
    confidence_tier = Column(String(50), default="High")  # 'High', 'Moderate', 'Exploratory'
    model_used = Column(String(100), default="Random Forest Regressor")
    key_cost_drivers = Column(Text, default="[]")  # JSON list

    assessment = relationship("Assessment", back_populates="cost_prediction")

class InsurancePlan(Base):
    __tablename__ = "insurance_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String(50), unique=True, index=True, nullable=False)
    plan_name = Column(String(255), nullable=False)
    insurer_name = Column(String(255), nullable=False)
    plan_type = Column(String(50), default="Comprehensive")  # Comprehensive, Super Topup, Critical Illness, Senior Citizen

    annual_premium = Column(Float, nullable=False)
    sum_insured = Column(Float, nullable=False)
    deductible = Column(Float, default=0.0)
    co_pay = Column(Float, default=0.0)  # percentage (e.g. 10.0 for 10%)
    waiting_period = Column(Integer, default=24)  # months for pre-existing diseases
    room_rent_limit = Column(String(255), default="Single Private A/C Room")
    network_hospital_count = Column(Integer, default=9500)

    maternity_coverage = Column(Boolean, default=False)
    critical_illness_coverage = Column(Boolean, default=True)
    outpatient_coverage = Column(Boolean, default=False)
    day_care_procedures = Column(Boolean, default=True)
    ayush_coverage = Column(Boolean, default=True)

    minimum_age = Column(Integer, default=18)
    maximum_age = Column(Integer, default=65)
    risk_compatibility = Column(String(50), default="All")  # 'All', 'Low-Medium', 'High-Compatible'

    claim_settlement_ratio = Column(Float, default=98.5)
    key_features = Column(Text, default="[]")  # JSON list of bullet points
    exclusions = Column(Text, default="[]")  # JSON list of exclusions
    important_limitations = Column(Text, default="[]")  # JSON list of caveats

    is_active = Column(Boolean, default=True)

    recommendations = relationship("Recommendation", back_populates="plan")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("insurance_plans.id"), nullable=False)
    rank = Column(Integer, nullable=False)  # 1, 2, 3

    match_score = Column(Float, nullable=False)  # 0 to 100
    affordability_score = Column(Float, default=0.0)
    coverage_score = Column(Float, default=0.0)
    risk_match_score = Column(Float, default=0.0)
    terms_score = Column(Float, default=0.0)

    reasons = Column(Text, default="[]")  # JSON list of reasons why recommended
    limitations = Column(Text, default="[]")  # JSON list of limitations

    assessment = relationship("Assessment", back_populates="recommendations")
    plan = relationship("InsurancePlan", back_populates="recommendations")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    module_type = Column(String(50), nullable=False)  # 'risk_classifier', 'cost_regressor'
    algorithm_name = Column(String(100), nullable=False)  # e.g., 'XGBoostClassifier', 'RandomForestRegressor'
    version_tag = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    training_date = Column(DateTime, default=datetime.datetime.utcnow)
    dataset_source = Column(String(255), nullable=False)
    training_sample_count = Column(Integer, nullable=False)
    metrics_json = Column(Text, nullable=False)  # JSON dict of accuracy, f1, mae, r2, etc.
    notes = Column(Text, nullable=True)
