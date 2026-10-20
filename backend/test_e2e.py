import json
from fastapi.testclient import TestClient
from app.main import app

def test_full_system_flow():
    client = TestClient(app)

    print("\n--- 1. Testing Root Status ---")
    res_root = client.get("/")
    assert res_root.status_code == 200
    print("Root API OK:", res_root.json()["service"])

    print("\n--- 2. Testing Authentication ---")
    login_data = {"username": "demo@healthcare.ai", "password": "Demo@1234"}
    res_login = client.post("/api/auth/login", data=login_data)
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Demo Login OK. Token acquired.")

    print("\n--- 3. Testing Plans Catalogue ---")
    res_plans = client.get("/api/plans")
    assert res_plans.status_code == 200
    plans = res_plans.json()
    assert len(plans) >= 8
    print(f"Catalogue seeded with {len(plans)} plans.")

    print("\n--- 4. Testing Model Performance Metrics ---")
    res_perf = client.get("/api/model-performance")
    assert res_perf.status_code == 200
    perf = res_perf.json()
    print("Winning Risk Classifier:", perf["winning_risk_model"])
    print("Winning Cost Regressor:", perf["winning_cost_model"])

    print("\n--- 5. Testing Health Assessment Creation ---")
    assessment_payload = {
        "title": "Comprehensive College E2E Test Patient",
        "is_demo": True,
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
    }

    res_assess = client.post("/api/assessment", json=assessment_payload, headers=headers)
    assert res_assess.status_code == 201
    assess_data = res_assess.json()
    assess_id = assess_data["id"]
    print("Assessment Created successfully! ID:", assess_id)
    print("  Predicted Risk:", assess_data["risk"]["risk_level"], f"({assess_data['risk']['risk_probability']}%)")
    print("  Estimated Annual Cost: INR", assess_data["cost"]["estimated_annual_cost"])
    print("  SHAP Factors Count:", len(assess_data["risk"]["shap_top_features"]))
    print("  Top Recommended Plan:", assess_data["recommendations"][0]["plan"]["plan_name"], f"({assess_data['recommendations'][0]['match_score']}%)")

    print("\n--- 6. Testing Assessment Retrieval ---")
    res_get = client.get(f"/api/assessment/{assess_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == assess_id
    print("Assessment Retrieval verified.")

    print("\n--- 7. Testing Assessment History List ---")
    res_list = client.get("/api/assessments", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) >= 1
    print(f"User has {len(items)} saved assessments.")

    print("\n==================================================")
    print("ALL END-TO-END VERIFICATION CHECKS PASSED (100%)!")
    print("==================================================")

if __name__ == "__main__":
    test_full_system_flow()
