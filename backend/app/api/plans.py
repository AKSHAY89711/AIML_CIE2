import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import InsurancePlan, User
from app.schemas.schemas import InsurancePlanResponse
from app.services.auth_service import get_current_active_admin
from app.config import settings

router = APIRouter(prefix="/api/plans", tags=["Insurance Plans"])

def seed_sample_plans_if_empty(db: Session):
    count = db.query(InsurancePlan).count()
    if count > 0:
        return

    json_path = Path(settings.DATA_DIR) / "insurance_plans.json"
    if not json_path.exists():
        from ml.data.prepare_datasets import prepare_insurance_catalogue
        prepare_insurance_catalogue()

    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            plans_data = json.load(f)

        for p in plans_data:
            plan_obj = InsurancePlan(
                plan_id=p["plan_id"],
                plan_name=p["plan_name"],
                insurer_name=p["insurer_name"],
                plan_type=p.get("plan_type", "Comprehensive"),
                annual_premium=p["annual_premium"],
                sum_insured=p["sum_insured"],
                deductible=p.get("deductible", 0.0),
                co_pay=p.get("co_pay", 0.0),
                waiting_period=p.get("waiting_period", 24),
                room_rent_limit=p.get("room_rent_limit", "Single Private Room"),
                network_hospital_count=p.get("network_hospital_count", 9000),
                maternity_coverage=p.get("maternity_coverage", False),
                critical_illness_coverage=p.get("critical_illness_coverage", True),
                outpatient_coverage=p.get("outpatient_coverage", False),
                day_care_procedures=p.get("day_care_procedures", True),
                ayush_coverage=p.get("ayush_coverage", True),
                minimum_age=p.get("minimum_age", 18),
                maximum_age=p.get("maximum_age", 65),
                risk_compatibility=p.get("risk_compatibility", "All"),
                claim_settlement_ratio=p.get("claim_settlement_ratio", 98.0),
                key_features=json.dumps(p.get("key_features", [])),
                exclusions=json.dumps(p.get("exclusions", [])),
                important_limitations=json.dumps(p.get("important_limitations", [])),
                is_active=True
            )
            db.add(plan_obj)
        db.commit()
        print(f"Seeded {len(plans_data)} insurance plans into database.")

def serialize_plan_response(p: InsurancePlan) -> InsurancePlanResponse:
    features = json.loads(p.key_features) if isinstance(p.key_features, str) else (p.key_features or [])
    exclusions = json.loads(p.exclusions) if isinstance(p.exclusions, str) else (p.exclusions or [])
    limitations = json.loads(p.important_limitations) if isinstance(p.important_limitations, str) else (p.important_limitations or [])

    return InsurancePlanResponse(
        id=p.id,
        plan_id=p.plan_id,
        plan_name=p.plan_name,
        insurer_name=p.insurer_name,
        plan_type=p.plan_type,
        annual_premium=p.annual_premium,
        sum_insured=p.sum_insured,
        deductible=p.deductible,
        co_pay=p.co_pay,
        waiting_period=p.waiting_period,
        room_rent_limit=p.room_rent_limit,
        network_hospital_count=p.network_hospital_count,
        maternity_coverage=p.maternity_coverage,
        critical_illness_coverage=p.critical_illness_coverage,
        outpatient_coverage=p.outpatient_coverage,
        day_care_procedures=p.day_care_procedures,
        ayush_coverage=p.ayush_coverage,
        minimum_age=p.minimum_age,
        maximum_age=p.maximum_age,
        risk_compatibility=p.risk_compatibility,
        claim_settlement_ratio=p.claim_settlement_ratio,
        key_features=features,
        exclusions=exclusions,
        important_limitations=limitations
    )

@router.get("", response_model=List[InsurancePlanResponse])
def get_plans(
    plan_type: Optional[str] = Query(None),
    max_premium: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List all insurance plans in the catalogue with optional filtering.
    """
    seed_sample_plans_if_empty(db)
    query = db.query(InsurancePlan).filter(InsurancePlan.is_active == True)

    if plan_type:
        query = query.filter(InsurancePlan.plan_type.ilike(f"%{plan_type}%"))
    if max_premium:
        query = query.filter(InsurancePlan.annual_premium <= max_premium)

    plans = query.all()
    return [serialize_plan_response(p) for p in plans]

@router.get("/{id}", response_model=InsurancePlanResponse)
def get_plan_by_id(id: int, db: Session = Depends(get_db)):
    """
    Get detailed information for a single insurance plan.
    """
    plan = db.query(InsurancePlan).filter(InsurancePlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Insurance plan not found")
    return serialize_plan_response(plan)
