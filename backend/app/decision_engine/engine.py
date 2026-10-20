"""
Unified Decision Engine
Orchestrates:
1. Input validation & clinical vitals checking
2. Module 1: Health Risk Prediction (Classification + SHAP)
3. Module 2: Medical Cost Estimation (Regression)
4. Module 3: Insurance Plan Recommendation & Scoring
5. Synthesis of explanations and disclaimers
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.schemas.schemas import (
    HealthProfileInput,
    RiskPredictionResponse,
    CostPredictionResponse,
    RecommendedPlanItem
)
from app.ml.inference import ml_service
from app.decision_engine.recommender import score_and_rank_plans
from app.models.entities import InsurancePlan

class DecisionEngine:
    def __init__(self):
        pass

    def execute_decision_pipeline(
        self,
        profile: HealthProfileInput,
        db: Session,
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Executes the end-to-end multi-module decision support pipeline.
        """
        # Step 1: Health Risk Prediction (Module 1)
        risk_result: RiskPredictionResponse = ml_service.predict_health_risk(profile)

        # Step 2: Medical Cost Estimation (Module 2)
        cost_result: CostPredictionResponse = ml_service.predict_medical_cost(profile)

        # Step 3: Fetch active insurance plans catalogue from database
        plans = db.query(InsurancePlan).filter(InsurancePlan.is_active == True).all()

        # Step 4: Insurance Plan Recommendation & Scoring (Module 3)
        recommendations: List[RecommendedPlanItem] = score_and_rank_plans(
            profile=profile,
            risk_level=risk_result.risk_level,
            risk_probability=risk_result.risk_probability,
            estimated_annual_cost=cost_result.estimated_annual_cost,
            plans=plans,
            weights=weights
        )

        return {
            "risk": risk_result,
            "cost": cost_result,
            "recommendations": recommendations,
            "total_plans_evaluated": len(plans),
            "disclaimer": "Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor."
        }

decision_engine = DecisionEngine()
