# API Reference Documentation

## Intelligent Healthcare & Health Insurance Decision Platform

Base URL: `http://localhost:8000` (or configured deployment host)
Interactive OpenAPI Documentation: `http://localhost:8000/docs`

---

### Authentication Endpoints

#### 1. Register User
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Body**:
```json
{
  "email": "user@healthcare.ai",
  "password": "Password@123",
  "full_name": "Dr. Alex Rivera"
}
```
- **Response**: `201 Created`
```json
{
  "id": 1,
  "email": "user@healthcare.ai",
  "full_name": "Dr. Alex Rivera",
  "role": "user",
  "created_at": "2026-10-20T16:30:00Z"
}
```

#### 2. User Login
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Form Fields**: `username` (email), `password`
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": { ... }
}
```

#### 3. Current User Profile
- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

### Machine Learning Prediction Endpoints

#### 4. Predict Health Risk (Module 1)
- **Method**: `POST`
- **Route**: `/api/predict/risk`
- **Body**:
```json
{
  "age": 45,
  "gender": "male",
  "bmi": 31.0,
  "systolic_bp": 138,
  "diastolic_bp": 88,
  "glucose": 148,
  "cholesterol": 235,
  "smoker": true,
  "smoking_status": "current",
  "exercise_frequency": "sedentary"
}
```
- **Response**: `200 OK`
```json
{
  "risk_level": "High",
  "risk_probability": 99.0,
  "model_used": "Logistic Regression (Baseline)",
  "model_version": "v1.0.0",
  "shap_top_features": [
    {
      "feature_name": "Tobacco Smoking Status",
      "feature_value": "Current Smoker",
      "shap_value": 0.5284,
      "importance_rank": 1,
      "direction": "increases_risk",
      "plain_explanation": "Tobacco Smoking Status (Current Smoker) elevated the estimated risk score."
    }
  ],
  "natural_language_explanation": [
    "Tobacco Smoking Status (Current Smoker) elevated the estimated risk score."
  ],
  "clinical_alert": false,
  "clinical_alert_message": null,
  "disclaimer": "Estimated risk based on statistical data. Decision-support only — not a medical diagnosis or replacement for a doctor."
}
```

#### 5. Predict Medical Cost (Module 2)
- **Method**: `POST`
- **Route**: `/api/predict/cost`
- **Body**:
```json
{
  "age": 45,
  "gender": "male",
  "bmi": 31.0,
  "dependents": 2,
  "smoker": true,
  "region": "southeast"
}
```
- **Response**: `200 OK`
```json
{
  "estimated_annual_cost": 42146.10,
  "estimated_monthly_cost": 3512.18,
  "cost_range_low": 34559.80,
  "cost_range_high": 49732.40,
  "confidence_tier": "High",
  "model_used": "XGBoost Regressor",
  "key_cost_drivers": [
    "Tobacco usage significantly increases expected annual medical expenditure.",
    "BMI of 31.0 contributes to higher routine outpatient and diagnostic requirements."
  ],
  "disclaimer": "Estimated medical cost based on statistical data. This is NOT an insurance premium quote."
}
```

---

### Recommendation & Assessment Endpoints

#### 6. Insurance Recommendations (Module 3)
- **Method**: `POST`
- **Route**: `/api/recommendations`
- **Body**:
```json
{
  "profile": { ... },
  "custom_weights": {
    "w_affordability": 0.35,
    "w_coverage": 0.30,
    "w_risk": 0.20,
    "w_terms": 0.15
  }
}
```
- **Response**: `200 OK`
```json
{
  "recommendations": [
    {
      "rank": 1,
      "match_score": 92.4,
      "plan": {
        "id": 1,
        "plan_id": "CARE-SUPREME-01",
        "plan_name": "Care Supreme Comprehensive Care",
        "insurer_name": "Care Health Insurance",
        "annual_premium": 14200.0,
        "sum_insured": 1000000.0,
        "waiting_period": 24,
        "co_pay": 0.0
      },
      "reasons": [
        "Fits within your annual budget of ₹25,000 (uses 57% of your budget)."
      ],
      "limitations": [
        "Pre-existing illnesses have a 24-month moratorium before claims are covered."
      ]
    }
  ],
  "total_evaluated": 8,
  "disclaimer": "Recommended based on your provided profile and selected preferences. Does not guarantee policy issuance."
}
```

#### 7. Create & Save Assessment
- **Method**: `POST`
- **Route**: `/api/assessment`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "title": "Comprehensive Health Evaluation",
  "is_demo": false,
  "profile": { ... }
}
```
- **Response**: `201 Created`

#### 8. Retrieve Assessment Detail
- **Method**: `GET`
- **Route**: `/api/assessment/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

#### 9. List User Assessments
- **Method**: `GET`
- **Route**: `/api/assessments`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

### Catalogue & Administration Endpoints

#### 10. List Insurance Plans
- **Method**: `GET`
- **Route**: `/api/plans?plan_type=Comprehensive&max_premium=30000`
- **Response**: `200 OK`

#### 11. Retrieve Model Performance Benchmarks
- **Method**: `GET`
- **Route**: `/api/model-performance`
- **Response**: `200 OK`

#### 12. Trigger Pipeline Retraining (Admin Only)
- **Method**: `POST`
- **Route**: `/api/retrain`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response**: `200 OK`

#### 13. Pre-defined Demo Profiles
- **Method**: `GET`
- **Route**: `/api/demo/profiles`
- **Response**: `200 OK`
