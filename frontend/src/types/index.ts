export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
  bmi: number;
  systolic_bp: number;
  diastolic_bp: number;
  glucose: number;
  cholesterol: number;
  smoker: boolean;
  smoking_status: 'never' | 'former' | 'current';
  exercise_frequency: 'sedentary' | 'moderate' | 'active';
  alcohol_frequency: 'never' | 'moderate' | 'frequent';
  family_history_heart: boolean;
  family_history_diabetes: boolean;
  pre_existing_conditions: string[];
  dependents: number;
  annual_income: number;
  insurance_budget_annual: number;
  preferred_coverage_type: 'comprehensive' | 'basic' | 'critical_illness' | 'family_floater';
  region: 'southeast' | 'southwest' | 'northeast' | 'northwest';
}

export interface ShapContribution {
  feature_name: string;
  feature_value: string | number;
  shap_value: number;
  importance_rank: number;
  direction: 'increases_risk' | 'decreases_risk';
  plain_explanation: string;
}

export interface RiskPrediction {
  risk_level: 'Low' | 'Medium' | 'High';
  risk_probability: number;
  model_used: string;
  model_version: string;
  shap_top_features: ShapContribution[];
  natural_language_explanation: string[];
  clinical_alert: boolean;
  clinical_alert_message?: string;
  disclaimer: string;
}

export interface CostPrediction {
  estimated_annual_cost: number;
  estimated_monthly_cost: number;
  cost_range_low: number;
  cost_range_high: number;
  confidence_tier: string;
  model_used: string;
  key_cost_drivers: string[];
  disclaimer: string;
}

export interface InsurancePlan {
  id: number;
  plan_id: string;
  plan_name: string;
  insurer_name: string;
  plan_type: string;
  annual_premium: number;
  sum_insured: number;
  deductible: number;
  co_pay: number;
  waiting_period: number;
  room_rent_limit: string;
  network_hospital_count: number;
  maternity_coverage: boolean;
  critical_illness_coverage: boolean;
  outpatient_coverage: boolean;
  day_care_procedures: boolean;
  ayush_coverage: boolean;
  minimum_age: number;
  maximum_age: number;
  risk_compatibility: string;
  claim_settlement_ratio: number;
  key_features: string[];
  exclusions: string[];
  important_limitations: string[];
}

export interface RecommendedPlanItem {
  rank: number;
  match_score: number;
  affordability_score: number;
  coverage_score: number;
  risk_match_score: number;
  terms_score: number;
  plan: InsurancePlan;
  reasons: string[];
  limitations: string[];
}

export interface AssessmentDetail {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  is_demo: boolean;
  profile: HealthProfile;
  risk: RiskPrediction;
  cost: CostPrediction;
  recommendations: RecommendedPlanItem[];
  disclaimer: string;
}

export interface AssessmentSummary {
  id: number;
  title: string;
  created_at: string;
  is_demo: boolean;
  risk_level: string;
  risk_probability: number;
  estimated_annual_cost: number;
  top_plan_name?: string;
  top_plan_match?: number;
}

export interface DemoProfileItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  profile: HealthProfile;
}

export interface ModelPerformanceData {
  risk_classification: Record<string, {
    algorithm: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix?: number[][];
  }>;
  winning_risk_model: string;
  cost_regression: Record<string, {
    algorithm: string;
    mae: number;
    rmse: number;
    r2_score: number;
  }>;
  winning_cost_model: string;
  recommendation: {
    algorithm: string;
    top3_hit_rate: number;
    catalog_coverage: number;
    weights: {
      affordability: number;
      coverage_fit: number;
      risk_match: number;
      terms_fit: number;
    };
  };
  datasets: Record<string, any>;
  last_evaluated: string;
}
