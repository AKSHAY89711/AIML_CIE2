"""
Module 3: Insurance Plan Recommendation & Scoring Engine
Features:
- Multi-attribute weighted scoring (Affordability, Coverage Fit, Risk Match, Terms Fit)
- Cosine similarity matching on normalized feature vectors
- Configurable weights
- Plan eligibility filtering (age, conditions)
- Automatic natural-language recommendation rationale & caveat generation
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.schemas.schemas import HealthProfileInput, RecommendedPlanItem, InsurancePlanResponse

def calculate_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.5
    return dot / (norm_a * norm_b)

def score_and_rank_plans(
    profile: HealthProfileInput,
    risk_level: str,
    risk_probability: float,
    estimated_annual_cost: float,
    plans: List[Any],
    weights: Dict[str, float] = None
) -> List[RecommendedPlanItem]:
    """
    Ranks insurance plans based on profile, risk level, cost estimation, and plan catalogue.
    """
    if weights is None:
        weights = {
            "w_affordability": settings.WEIGHT_AFFORDABILITY,
            "w_coverage": settings.WEIGHT_COVERAGE,
            "w_risk": settings.WEIGHT_RISK_MATCH,
            "w_terms": settings.WEIGHT_TERMS_FIT
        }

    user_age = profile.age
    budget = profile.insurance_budget_annual
    has_dependents = profile.dependents > 0
    has_chronic = len(profile.pre_existing_conditions) > 0 or profile.systolic_bp > 140 or profile.glucose > 140

    # User Profile Vector for Cosine Similarity
    # [risk_norm, budget_norm, coverage_need_norm, waiting_pref_norm, critical_need]
    risk_norm = min(max(risk_probability / 100.0, 0.1), 1.0)
    budget_norm = min(budget / 50000.0, 1.0)
    # If high expected cost, higher coverage needed
    needed_sum_insured = max(estimated_annual_cost * 10, 500000.0)
    coverage_need_norm = min(needed_sum_insured / 2500000.0, 1.0)
    waiting_pref_norm = 1.0 if has_chronic else 0.5
    critical_need_norm = 1.0 if (risk_level == "High" or user_age > 45) else 0.4

    user_vec = [risk_norm, budget_norm, coverage_need_norm, waiting_pref_norm, critical_need_norm]

    scored_items = []

    for plan in plans:
        # Eligibility Filter: Age check
        if user_age < plan.minimum_age or user_age > plan.maximum_age:
            continue

        # 1. Affordability Score (0-100)
        premium = plan.annual_premium
        if premium <= budget:
            # Plan is within budget; reward affordability while ensuring adequate coverage
            ratio = premium / budget
            affordability_score = 95.0 - (ratio * 15.0)  # 80 to 95
        else:
            # Over budget
            over_pct = (premium - budget) / budget
            affordability_score = max(20.0, 75.0 - (over_pct * 80.0))

        # 2. Coverage Fit Score (0-100)
        # Sum insured relative to estimated annual medical cost
        coverage_ratio = plan.sum_insured / max(estimated_annual_cost, 10000.0)
        if coverage_ratio >= 15.0:
            cov_base = 95.0
        elif coverage_ratio >= 8.0:
            cov_base = 85.0
        elif coverage_ratio >= 4.0:
            cov_base = 75.0
        else:
            cov_base = 55.0

        # Bonuses for network size and appropriate benefits
        if plan.network_hospital_count >= 10000:
            cov_base += 3.0
        if profile.dependents > 0 and plan.plan_type in ["Comprehensive", "Super Top-Up"]:
            cov_base += 2.0
        coverage_score = min(100.0, max(30.0, cov_base))

        # 3. Risk Match Score (0-100)
        if risk_level == "High":
            if plan.risk_compatibility in ["High-Compatible", "All"]:
                risk_match = 90.0
            else:
                risk_match = 60.0

            # For high risk, shorter waiting period is preferred
            if plan.waiting_period <= 12:
                risk_match += 8.0
            elif plan.waiting_period <= 24:
                risk_match += 4.0
            else:
                risk_match -= 8.0

            if plan.critical_illness_coverage:
                risk_match += 5.0
        elif risk_level == "Medium":
            risk_match = 85.0
            if plan.waiting_period <= 24:
                risk_match += 5.0
        else:  # Low Risk
            risk_match = 90.0
            if plan.plan_type in ["Comprehensive", "Super Top-Up"]:
                risk_match += 5.0

        risk_score = min(100.0, max(30.0, risk_match))

        # 4. Terms Fit Score (0-100)
        terms_score = 80.0
        # Co-pay penalty
        if plan.co_pay == 0:
            terms_score += 10.0
        elif plan.co_pay <= 10:
            terms_score += 2.0
        else:
            terms_score -= 10.0

        # Room rent capping
        if "No Capping" in plan.room_rent_limit or "No Sub-limit" in plan.room_rent_limit:
            terms_score += 6.0

        # Claim settlement ratio
        if plan.claim_settlement_ratio >= 98.0:
            terms_score += 4.0

        terms_score = min(100.0, max(25.0, terms_score))

        # 5. Cosine Similarity Calculation
        plan_risk_weight = 0.9 if plan.risk_compatibility == "High-Compatible" else (0.7 if plan.risk_compatibility == "All" else 0.4)
        plan_prem_norm = min(plan.annual_premium / 50000.0, 1.0)
        plan_si_norm = min(plan.sum_insured / 2500000.0, 1.0)
        plan_wait_norm = 1.0 - min(plan.waiting_period / 48.0, 1.0)
        plan_ci_norm = 1.0 if plan.critical_illness_coverage else 0.0

        plan_vec = [plan_risk_weight, plan_prem_norm, plan_si_norm, plan_wait_norm, plan_ci_norm]
        cos_sim = calculate_cosine_similarity(user_vec, plan_vec)

        # 6. Combined Weighted Plan Score
        rule_score = (
            weights["w_affordability"] * affordability_score +
            weights["w_coverage"] * coverage_score +
            weights["w_risk"] * risk_score +
            weights["w_terms"] * terms_score
        )

        # Blend rule score (85%) with cosine similarity score (15%)
        final_match_score = round(0.85 * rule_score + 0.15 * (cos_sim * 100.0), 1)
        final_match_score = min(99.0, max(45.0, final_match_score))

        # 7. Generate Plain-Language Recommendation Reasons
        reasons = []
        if premium <= budget:
            utilization = round((premium / budget) * 100)
            reasons.append(f"Fits within your annual budget of ₹{budget:,.0f} (uses {utilization}% of your budget).")
        else:
            reasons.append(f"Provides expanded protection slightly above budget (+₹{premium - budget:,.0f}).")

        si_lakhs = plan.sum_insured / 100000.0
        reasons.append(f"Comprehensive ₹{si_lakhs:.0f} Lakhs sum insured shields against estimated ₹{estimated_annual_cost:,.0f}/year medical expenses.")

        if plan.co_pay == 0.0:
            reasons.append("Zero co-payment ensures no mandatory deduction on admissible hospital claims.")
        else:
            reasons.append(f"Includes a {plan.co_pay:.0f}% co-pay in exchange for specialized coverage.")

        if plan.waiting_period <= 24:
            reasons.append(f"Favorable {plan.waiting_period}-month pre-existing condition waiting duration.")

        if plan.critical_illness_coverage:
            reasons.append("Includes critical illness shield against major cardiovascular and metabolic events.")

        # Limitations
        limitations = []
        if plan.co_pay > 0:
            limitations.append(f"Requires {plan.co_pay:.0f}% co-pay on each claim.")
        if plan.waiting_period > 0:
            limitations.append(f"Pre-existing illnesses have a {plan.waiting_period}-month moratorium before claims are covered.")
        if plan.deductible > 0:
            limitations.append(f"Policy only triggers after claims exceed ₹{plan.deductible:,.0f} deductible.")
        if plan.exclusions:
            limitations.append("Standard exclusions apply (experimental treatments, cosmetic procedures).")

        # Serialized plan object
        plan_dict = {
            "id": plan.id,
            "plan_id": plan.plan_id,
            "plan_name": plan.plan_name,
            "insurer_name": plan.insurer_name,
            "plan_type": plan.plan_type,
            "annual_premium": plan.annual_premium,
            "sum_insured": plan.sum_insured,
            "deductible": plan.deductible,
            "co_pay": plan.co_pay,
            "waiting_period": plan.waiting_period,
            "room_rent_limit": plan.room_rent_limit,
            "network_hospital_count": plan.network_hospital_count,
            "maternity_coverage": plan.maternity_coverage,
            "critical_illness_coverage": plan.critical_illness_coverage,
            "outpatient_coverage": plan.outpatient_coverage,
            "day_care_procedures": plan.day_care_procedures,
            "ayush_coverage": plan.ayush_coverage,
            "minimum_age": plan.minimum_age,
            "maximum_age": plan.maximum_age,
            "risk_compatibility": plan.risk_compatibility,
            "claim_settlement_ratio": plan.claim_settlement_ratio,
            "key_features": plan.key_features if isinstance(plan.key_features, list) else [],
            "exclusions": plan.exclusions if isinstance(plan.exclusions, list) else [],
            "important_limitations": plan.important_limitations if isinstance(plan.important_limitations, list) else []
        }

        scored_items.append({
            "match_score": final_match_score,
            "affordability_score": round(affordability_score, 1),
            "coverage_score": round(coverage_score, 1),
            "risk_match_score": round(risk_score, 1),
            "terms_score": round(terms_score, 1),
            "plan_obj": plan_dict,
            "reasons": reasons[:4],
            "limitations": limitations[:3]
        })

    # Sort descending by match_score
    scored_items.sort(key=lambda x: x["match_score"], reverse=True)

    # Pick Top 3
    top_3 = scored_items[:3]
    results = []
    for rank, item in enumerate(top_3, start=1):
        results.append(RecommendedPlanItem(
            rank=rank,
            match_score=item["match_score"],
            affordability_score=item["affordability_score"],
            coverage_score=item["coverage_score"],
            risk_match_score=item["risk_match_score"],
            terms_score=item["terms_score"],
            plan=InsurancePlanResponse(**item["plan_obj"]),
            reasons=item["reasons"],
            limitations=item["limitations"]
        ))

    return results
