import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    User, Assessment, HealthProfile, RiskPrediction, CostPrediction, Recommendation, InsurancePlan
)
from app.schemas.schemas import (
    AssessmentCreateRequest,
    AssessmentDetailResponse,
    AssessmentSummaryResponse,
    HealthProfileInput,
    RiskPredictionResponse,
    CostPredictionResponse,
    RecommendedPlanItem,
    InsurancePlanResponse,
    ShapFeatureContribution
)
from app.services.auth_service import get_current_user
from app.decision_engine.engine import decision_engine
from app.api.plans import serialize_plan_response

router = APIRouter(prefix="/api/assessment", tags=["Assessments"])

@router.post("", response_model=AssessmentDetailResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    req: AssessmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run decision support pipeline and save assessment in database.
    """
    # 1. Execute Decision Engine
    pipeline_res = decision_engine.execute_decision_pipeline(
        profile=req.profile,
        db=db
    )

    risk_res: RiskPredictionResponse = pipeline_res["risk"]
    cost_res: CostPredictionResponse = pipeline_res["cost"]
    recs: List[RecommendedPlanItem] = pipeline_res["recommendations"]

    # 2. Persist in Database
    assessment = Assessment(
        user_id=current_user.id,
        title=req.title or "Health & Insurance Assessment",
        is_demo=req.is_demo,
        disclaimer_acknowledged=True
    )
    db.add(assessment)
    db.flush()

    # Health Profile
    h_profile = HealthProfile(
        assessment_id=assessment.id,
        age=req.profile.age,
        gender=req.profile.gender,
        height_cm=req.profile.height_cm,
        weight_kg=req.profile.weight_kg,
        bmi=req.profile.bmi,
        systolic_bp=req.profile.systolic_bp,
        diastolic_bp=req.profile.diastolic_bp,
        glucose=req.profile.glucose,
        cholesterol=req.profile.cholesterol,
        smoker=req.profile.smoker,
        smoking_status=req.profile.smoking_status,
        exercise_frequency=req.profile.exercise_frequency,
        alcohol_frequency=req.profile.alcohol_frequency,
        family_history_heart=req.profile.family_history_heart,
        family_history_diabetes=req.profile.family_history_diabetes,
        pre_existing_conditions=json.dumps(req.profile.pre_existing_conditions),
        dependents=req.profile.dependents,
        annual_income=req.profile.annual_income,
        insurance_budget_annual=req.profile.insurance_budget_annual,
        preferred_coverage_type=req.profile.preferred_coverage_type,
        region=req.profile.region
    )
    db.add(h_profile)

    # Risk Prediction
    shap_data = [item.dict() for item in risk_res.shap_top_features]
    r_pred = RiskPrediction(
        assessment_id=assessment.id,
        risk_level=risk_res.risk_level,
        risk_probability=risk_res.risk_probability,
        model_used=risk_res.model_used,
        model_version=risk_res.model_version,
        shap_top_features=json.dumps(shap_data),
        natural_language_explanation=json.dumps(risk_res.natural_language_explanation),
        clinical_alert=risk_res.clinical_alert,
        clinical_alert_message=risk_res.clinical_alert_message
    )
    db.add(r_pred)

    # Cost Prediction
    c_pred = CostPrediction(
        assessment_id=assessment.id,
        estimated_annual_cost=cost_res.estimated_annual_cost,
        estimated_monthly_cost=cost_res.estimated_monthly_cost,
        cost_range_low=cost_res.cost_range_low,
        cost_range_high=cost_res.cost_range_high,
        confidence_tier=cost_res.confidence_tier,
        model_used=cost_res.model_used,
        key_cost_drivers=json.dumps(cost_res.key_cost_drivers)
    )
    db.add(c_pred)

    # Recommendations
    for item in recs:
        rec_row = Recommendation(
            assessment_id=assessment.id,
            plan_id=item.plan.id,
            rank=item.rank,
            match_score=item.match_score,
            affordability_score=item.affordability_score,
            coverage_score=item.coverage_score,
            risk_match_score=item.risk_match_score,
            terms_score=item.terms_score,
            reasons=json.dumps(item.reasons),
            limitations=json.dumps(item.limitations)
        )
        db.add(rec_row)

    db.commit()
    db.refresh(assessment)

    return AssessmentDetailResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        title=assessment.title,
        created_at=assessment.created_at,
        is_demo=assessment.is_demo,
        profile=req.profile,
        risk=risk_res,
        cost=cost_res,
        recommendations=recs,
        disclaimer="Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor."
    )

@router.get("/{id}", response_model=AssessmentDetailResponse)
def get_assessment(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full details of a saved assessment.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if assessment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this assessment")

    hp = assessment.health_profile
    rp = assessment.risk_prediction
    cp = assessment.cost_prediction

    # Reconstruct schemas
    conditions = json.loads(hp.pre_existing_conditions) if hp.pre_existing_conditions else []
    profile = HealthProfileInput(
        age=hp.age,
        gender=hp.gender,
        height_cm=hp.height_cm,
        weight_kg=hp.weight_kg,
        bmi=hp.bmi,
        systolic_bp=hp.systolic_bp,
        diastolic_bp=hp.diastolic_bp,
        glucose=hp.glucose,
        cholesterol=hp.cholesterol,
        smoker=hp.smoker,
        smoking_status=hp.smoking_status,
        exercise_frequency=hp.exercise_frequency,
        alcohol_frequency=hp.alcohol_frequency,
        family_history_heart=hp.family_history_heart,
        family_history_diabetes=hp.family_history_diabetes,
        pre_existing_conditions=conditions,
        dependents=hp.dependents,
        annual_income=hp.annual_income,
        insurance_budget_annual=hp.insurance_budget_annual,
        preferred_coverage_type=hp.preferred_coverage_type,
        region=hp.region
    )

    shap_raw = json.loads(rp.shap_top_features) if rp.shap_top_features else []
    shap_items = [ShapFeatureContribution(**s) for s in shap_raw]
    nl_expl = json.loads(rp.natural_language_explanation) if rp.natural_language_explanation else []

    risk = RiskPredictionResponse(
        risk_level=rp.risk_level,
        risk_probability=rp.risk_probability,
        model_used=rp.model_used,
        model_version=rp.model_version,
        shap_top_features=shap_items,
        natural_language_explanation=nl_expl,
        clinical_alert=rp.clinical_alert,
        clinical_alert_message=rp.clinical_alert_message
    )

    cost_drivers = json.loads(cp.key_cost_drivers) if cp.key_cost_drivers else []
    cost = CostPredictionResponse(
        estimated_annual_cost=cp.estimated_annual_cost,
        estimated_monthly_cost=cp.estimated_monthly_cost,
        cost_range_low=cp.cost_range_low,
        cost_range_high=cp.cost_range_high,
        confidence_tier=cp.confidence_tier,
        model_used=cp.model_used,
        key_cost_drivers=cost_drivers
    )

    recs = []
    for r in assessment.recommendations:
        plan_resp = serialize_plan_response(r.plan)
        recs.append(RecommendedPlanItem(
            rank=r.rank,
            match_score=r.match_score,
            affordability_score=r.affordability_score,
            coverage_score=r.coverage_score,
            risk_match_score=r.risk_match_score,
            terms_score=r.terms_score,
            plan=plan_resp,
            reasons=json.loads(r.reasons) if r.reasons else [],
            limitations=json.loads(r.limitations) if r.limitations else []
        ))
    recs.sort(key=lambda x: x.rank)

    return AssessmentDetailResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        title=assessment.title,
        created_at=assessment.created_at,
        is_demo=assessment.is_demo,
        profile=profile,
        risk=risk,
        cost=cost,
        recommendations=recs,
        disclaimer="Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor."
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(assessment)
    db.commit()
    return None

# List router for GET /api/assessments
assessments_list_router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

@assessments_list_router.get("", response_model=List[AssessmentSummaryResponse])
def list_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all previous assessments for current user.
    """
    items = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    summaries = []
    for a in items:
        top_plan = None
        top_match = None
        if a.recommendations:
            sorted_recs = sorted(a.recommendations, key=lambda x: x.rank)
            if sorted_recs and sorted_recs[0].plan:
                top_plan = sorted_recs[0].plan.plan_name
                top_match = sorted_recs[0].match_score

        summaries.append(AssessmentSummaryResponse(
            id=a.id,
            title=a.title,
            created_at=a.created_at,
            is_demo=a.is_demo,
            risk_level=a.risk_prediction.risk_level if a.risk_prediction else "Unknown",
            risk_probability=a.risk_prediction.risk_probability if a.risk_prediction else 0.0,
            estimated_annual_cost=a.cost_prediction.estimated_annual_cost if a.cost_prediction else 0.0,
            top_plan_name=top_plan,
            top_plan_match=top_match
        ))
    return summaries
