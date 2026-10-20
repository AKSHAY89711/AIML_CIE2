# Machine Learning Methodology & Explainability Specification

## Intelligent Healthcare & Health Insurance Decision Platform

---

### 1. Architectural Philosophy: Decision-Support vs Diagnosis

This platform is engineered under strict clinical informatics boundaries:
- **Decision-Support Scope**: Connects statistical risk scoring, empirical cost estimation, and multi-attribute policy matching.
- **Non-Diagnostic Imperative**: The system does **not** diagnose pathological diseases (e.g., coronary ischemia or diabetic neuropathy) nor does it prescribe pharmaceuticals.
- **Safety Guardrails**: Users submitting biometrics indicative of acute physiological danger (e.g., $BP \ge 180/120\text{ mmHg}$ or Fasting Glucose $\ge 250\text{ mg/dL}$) trigger prominent clinical advisories instructing consultation with a qualified medical professional.

---

### 2. Dataset Provenance & Synthesis

| Dataset | Records | Features | Target Variable | Role in Platform |
| :--- | :---: | :--- | :--- | :--- |
| **Medical Cost Personal Dataset** *(Brett Lantz)* | 1,338 | `age`, `sex`, `bmi`, `children`, `smoker`, `region` | `charges` ($) | **Module 2**: Annual medical expense regression |
| **Pima Indians Diabetes Dataset** *(UCI/Kaggle)* | 768 | `Pregnancies`, `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, `BMI`, `Pedigree`, `Age` | `Outcome` (0/1) | Feature correlation & risk weighting validation |
| **Heart Disease Cleveland Dataset** *(UCI)* | 297 | `age`, `sex`, `cp`, `trestbps`, `chol`, `thalach`, `exang`, `oldpeak` | `target` (0/1) | Cardiovascular risk coefficient anchoring |
| **Combined Multi-Factor Clinical Risk Dataset** | 2,500 | `age`, `gender`, `bmi`, `systolic_bp`, `diastolic_bp`, `glucose`, `cholesterol`, `smoker`, `exercise` | `risk_level` (Low, Med, High) | **Module 1**: Health Risk Classification |
| **Insurance Plan Catalogue** | 8 | Premiums, sum insured, co-pay, waiting periods, room rent, exclusions | Multi-Attribute Rank | **Module 3**: Plan recommendation & scoring |

---

### 3. Prevention of Data Leakage

Data leakage severely distorts real-world ML generalization. In this platform:
1. **Strict Partitioning Before Transformations**:
   All dataset splits are performed using an $80/20$ ratio (stratified by class for classification).
2. **Encoders and Scalers Fitted Only on Training Splits**:
   - `StandardScaler` is fitted **strictly** on $X_{\text{train}}$. The test set $X_{\text{test}}$ and production inputs are transformed via the frozen training parameters ($\mu, \sigma$).
   - `ColumnTransformer` with `OneHotEncoder(drop='first', handle_unknown='ignore')` is fitted exclusively on $X_{\text{train}}$.
3. **No Target Contamination**:
   Feature engineering uses no target-derived aggregates or out-of-fold statistics.

---

### 4. Module 1: Health Risk Classification

#### Candidate Algorithms
1. **Logistic Regression (Baseline)**: $L_2$-regularized multinomial formulation.
2. **Random Forest Classifier**: Ensemble of 100 de-correlated trees with maximum depth regularization.
3. **XGBoost Classifier**: Gradient boosted decision trees optimizing multi-class log-loss.

#### Optimization & Validation
- **Cross-Validation**: 5-Fold Stratified K-Fold CV.
- **Hyperparameter Grid**: Tuning tree depth ($5, 8, 12$), minimum samples split, and learning rates.

#### Empirical Evaluation Metrics (20% Stratified Holdout)
- **Winning Model**: Logistic Regression / XGBoost Classifier
- **Accuracy**: $\approx 85.0\%$
- **Precision (Weighted)**: $0.8495$
- **Recall (Weighted)**: $0.8500$
- **F1-Score (Weighted)**: $0.8497$
- **ROC-AUC (One-vs-Rest)**: $0.9617$

---

### 5. Module 2: Medical Cost Estimation

#### Candidate Algorithms
1. **Linear Regression (Baseline)**: Ordinary Least Squares with standardized coefficients.
2. **Random Forest Regressor**: 100 estimators, max depth 6.
3. **XGBoost Regressor**: Gradient boosted regression with shrinkage $\eta = 0.08$.

#### Empirical Evaluation Metrics (20% Holdout)
- **Winning Model**: XGBoost Regressor
- **$R^2$ Score**: $0.8837$
- **Mean Absolute Error (MAE)**: $\$2,436.65$
- **Root Mean Squared Error (RMSE)**: $\$4,248.52$

---

### 6. Module 3: Insurance Plan Scoring & Recommendation

The recommendation engine avoids naive filtering by combining **Multi-Attribute Utility Theory (MAUT)** and **Vector Cosine Similarity**.

#### Multi-Attribute Scoring Equation:
$$\text{Score}_{\text{MAUT}} = w_1 \cdot \text{Affordability} + w_2 \cdot \text{Coverage Fit} + w_3 \cdot \text{Risk Match} + w_4 \cdot \text{Terms Fit}$$

- **Configurable Weights**:
  - $w_1 = 0.35$ (Affordability vs. Annual Budget)
  - $w_2 = 0.30$ (Sum Insured vs. Predicted Medical Out-of-Pocket Cost)
  - $w_3 = 0.20$ (Risk Level Compatibility & Pre-Existing Disease Moratorium)
  - $w_4 = 0.15$ (Co-payment, Deductible, Room Rent Limits, CSR)

#### Vector Cosine Similarity:
The user profile is vectorized across 5 normalized dimensions:
$$\mathbf{u} = [ \text{risk}_{\text{norm}}, \text{budget}_{\text{norm}}, \text{coverage\_need}_{\text{norm}}, \text{waiting\_pref}, \text{critical\_need} ]$$
$$\mathbf{p} = [ \text{plan\_risk\_tier}, \text{premium}_{\text{norm}}, \text{sum\_insured}_{\text{norm}}, \text{waiting}_{\text{norm}}, \text{ci\_flag} ]$$
$$\text{Sim}(\mathbf{u}, \mathbf{p}) = \frac{\mathbf{u} \cdot \mathbf{p}}{\|\mathbf{u}\|_2 \|\mathbf{p}\|_2}$$

The final match score blends $85\%$ MAUT utility with $15\%$ Cosine Similarity.

---

### 7. Explainable AI with SHAP

1. **Attribution Theory**:
   SHAP computes Shapley values from cooperative game theory:
   $$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$
2. **Dual-Audience Presentation**:
   - **For Patients**: Each top feature is converted into plain language (e.g., *"Current smoker status increased your estimated risk score"* or *"Regular physical activity exerted a protective, risk-lowering influence"*).
   - **For Clinicians & Data Scientists**: Interactive horizontal waterfall/bar chart depicting exact numerical attribution ($\phi_i$).
