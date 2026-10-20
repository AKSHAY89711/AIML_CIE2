from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import (
    HealthProfileInput,
    RiskPredictionResponse,
    CostPredictionResponse
)
from app.ml.inference import ml_service

router = APIRouter(prefix="/api/predict", tags=["Predictions"])

@router.post("/risk", response_model=RiskPredictionResponse)
def predict_risk(profile: HealthProfileInput):
    """
    Predict health risk level (Low, Medium, High), probability, and SHAP feature contributions.
    """
    try:
        result = ml_service.predict_health_risk(profile)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing health risk prediction pipeline: {str(e)}"
        )

@router.post("/cost", response_model=CostPredictionResponse)
def predict_cost(profile: HealthProfileInput):
    """
    Predict expected yearly medical costs, monthly breakdown, and key drivers.
    """
    try:
        result = ml_service.predict_medical_cost(profile)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing medical cost regression pipeline: {str(e)}"
        )
