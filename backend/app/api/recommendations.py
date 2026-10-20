from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict
from pydantic import BaseModel
from app.database import get_db
from app.models.entities import InsurancePlan
from app.schemas.schemas import HealthProfileInput, RecommendationsResponse
from app.decision_engine.recommender import score_and_rank_plans
from app.ml.inference import ml_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

class RecommendationRequest(BaseModel):
    profile: HealthProfileInput
    custom_weights: Optional[Dict[str, float]] = None

@router.post("", response_model=RecommendationsResponse)
def get_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Score and recommend top insurance plans for a given health & financial profile.
    """
    try:
        # Run risk and cost
        risk_res = ml_service.predict_health_risk(req.profile)
        cost_res = ml_service.predict_medical_cost(req.profile)

        plans = db.query(InsurancePlan).filter(InsurancePlan.is_active == True).all()
        if not plans:
            # Seed plans if empty
            from app.api.plans import seed_sample_plans_if_empty
            seed_sample_plans_if_empty(db)
            plans = db.query(InsurancePlan).filter(InsurancePlan.is_active == True).all()

        scored = score_and_rank_plans(
            profile=req.profile,
            risk_level=risk_res.risk_level,
            risk_probability=risk_res.risk_probability,
            estimated_annual_cost=cost_res.estimated_annual_cost,
            plans=plans,
            weights=req.custom_weights
        )

        return RecommendationsResponse(
            recommendations=scored,
            total_evaluated=len(plans),
            disclaimer="Recommended based on your provided profile and selected preferences. Does not guarantee policy issuance."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating insurance recommendations: {str(e)}"
        )
