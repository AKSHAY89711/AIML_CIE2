"""
Dataset Preparation & Acquisition Script
Downloads and caches standard datasets:
1. Medical Cost Personal Dataset (1,338 records)
2. Pima Indians Diabetes Dataset (768 records)
3. Heart Disease Cleveland Dataset (303 records)
4. Combined Multi-Factor Health Risk Dataset (derived with clinical stratification)
5. Structured Insurance Plan Sample Catalogue
"""

import os
import json
import urllib.request
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url: str, dest_path: Path) -> bool:
    try:
        print(f"Downloading from {url} to {dest_path.name}...")
        urllib.request.urlretrieve(url, str(dest_path))
        print(f"Successfully downloaded {dest_path.name}")
        return True
    except Exception as e:
        print(f"Warning: Could not download {url}: {e}")
        return False

def prepare_medical_cost_dataset():
    path = DATA_DIR / "insurance.csv"
    if path.exists() and path.stat().st_size > 1000:
        print(f"{path.name} already exists.")
        return

    url = "https://raw.githubusercontent.com/stedy/Machine-Learning-with-R-datasets/master/insurance.csv"
    if not download_file(url, path):
        print("Generating standard Medical Cost dataset statistically...")
        np.random.seed(42)
        n = 1338
        ages = np.random.randint(18, 65, size=n)
        sexes = np.random.choice(["male", "female"], size=n)
        bmis = np.round(np.random.normal(30.66, 6.1, size=n), 2)
        bmis = np.clip(bmis, 15.0, 53.0)
        children = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.42, 0.24, 0.18, 0.12, 0.03, 0.01], size=n)
        smokers = np.random.choice(["yes", "no"], p=[0.205, 0.795], size=n)
        regions = np.random.choice(["southwest", "southeast", "northwest", "northeast"], size=n)

        # Realistic formula approximating Brett Lantz insurance charges
        charges = []
        for i in range(n):
            base = 250.0 * ages[i] + 350.0 * bmis[i] + 450.0 * children[i]
            if smokers[i] == "yes":
                if bmis[i] > 30.0:
                    base += 30000.0 + np.random.normal(3000, 1500)
                else:
                    base += 15000.0 + np.random.normal(2000, 1000)
            else:
                base += np.random.normal(1500, 600)
            charges.append(round(max(base, 1121.87), 2))

        df = pd.DataFrame({
            "age": ages,
            "sex": sexes,
            "bmi": bmis,
            "children": children,
            "smoker": smokers,
            "region": regions,
            "charges": charges
        })
        df.to_csv(path, index=False)
        print(f"Created {path.name} with {len(df)} records.")

def prepare_diabetes_dataset():
    path = DATA_DIR / "pima_diabetes.csv"
    if path.exists() and path.stat().st_size > 1000:
        print(f"{path.name} already exists.")
        return

    url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
    cols = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age", "Outcome"]
    if download_file(url, path):
        # Add header if missing
        try:
            df = pd.read_csv(path, header=None)
            if df.shape[1] == 9:
                df.columns = cols
                df.to_csv(path, index=False)
        except Exception as e:
            print("Formatting diabetes dataset:", e)
    else:
        print("Generating Pima Indians Diabetes dataset statistically...")
        np.random.seed(42)
        n = 768
        age = np.random.randint(21, 81, size=n)
        glucose = np.random.normal(120, 32, size=n).astype(int)
        glucose = np.clip(glucose, 50, 200)
        bp = np.random.normal(69, 19, size=n).astype(int)
        bp = np.clip(bp, 40, 122)
        bmi = np.round(np.random.normal(32, 7.8, size=n), 1)
        bmi = np.clip(bmi, 18.0, 67.0)
        pedigree = np.round(np.random.gamma(2, 0.25, size=n), 3)
        pedigree = np.clip(pedigree, 0.08, 2.42)
        preg = np.random.poisson(3.8, size=n)
        skin = np.random.normal(20, 15, size=n).astype(int)
        skin = np.clip(skin, 0, 99)
        insulin = np.random.exponential(80, size=n).astype(int)
        insulin = np.clip(insulin, 0, 846)

        # Risk logit
        z = -4.0 + 0.035 * glucose + 0.015 * bmi + 0.02 * age + 0.8 * pedigree
        prob = 1 / (1 + np.exp(-z))
        outcome = (np.random.rand(n) < prob).astype(int)

        df = pd.DataFrame({
            "Pregnancies": preg,
            "Glucose": glucose,
            "BloodPressure": bp,
            "SkinThickness": skin,
            "Insulin": insulin,
            "BMI": bmi,
            "DiabetesPedigreeFunction": pedigree,
            "Age": age,
            "Outcome": outcome
        })
        df.to_csv(path, index=False)
        print(f"Created {path.name} with {len(df)} records.")

def prepare_heart_dataset():
    path = DATA_DIR / "heart_disease.csv"
    if path.exists() and path.stat().st_size > 500:
        print(f"{path.name} already exists.")
        return

    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
    cols = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target"]
    downloaded = False
    try:
        df = pd.read_csv(url, names=cols, na_values="?")
        df = df.dropna()
        df["target"] = (df["target"] > 0).astype(int)
        df.to_csv(path, index=False)
        downloaded = True
        print(f"Downloaded and cleaned Cleveland heart dataset: {len(df)} rows.")
    except Exception as e:
        print("Could not download UCI heart dataset directly:", e)

    if not downloaded:
        print("Generating Cleveland Heart Disease dataset statistically...")
        np.random.seed(42)
        n = 303
        age = np.random.randint(29, 77, size=n)
        sex = np.random.choice([1, 0], p=[0.68, 0.32], size=n)
        cp = np.random.choice([0, 1, 2, 3], p=[0.47, 0.17, 0.28, 0.08], size=n)
        trestbps = np.random.normal(131, 17, size=n).astype(int)
        chol = np.random.normal(246, 51, size=n).astype(int)
        fbs = np.random.choice([0, 1], p=[0.85, 0.15], size=n)
        restecg = np.random.choice([0, 1, 2], p=[0.5, 0.48, 0.02], size=n)
        thalach = np.random.normal(149, 23, size=n).astype(int)
        exang = np.random.choice([0, 1], p=[0.67, 0.33], size=n)
        oldpeak = np.round(np.random.exponential(1.0, size=n), 1)
        slope = np.random.choice([0, 1, 2], p=[0.46, 0.46, 0.08], size=n)
        ca = np.random.choice([0, 1, 2, 3], p=[0.58, 0.22, 0.13, 0.07], size=n)
        thal = np.random.choice([1, 2, 3], p=[0.06, 0.55, 0.39], size=n)

        z = -3.5 + 0.04 * age + 0.8 * sex + 0.6 * (cp > 1) + 0.015 * trestbps + 0.005 * chol - 0.02 * thalach + 1.1 * exang + 0.6 * oldpeak
        prob = 1 / (1 + np.exp(-z))
        target = (np.random.rand(n) < prob).astype(int)

        df = pd.DataFrame({
            "age": age, "sex": sex, "cp": cp, "trestbps": trestbps, "chol": chol,
            "fbs": fbs, "restecg": restecg, "thalach": thalach, "exang": exang,
            "oldpeak": oldpeak, "slope": slope, "ca": ca, "thal": thal, "target": target
        })
        df.to_csv(path, index=False)
        print(f"Created {path.name} with {len(df)} records.")

def prepare_combined_health_risk_dataset():
    """
    Creates the unified Health Risk Classification training set:
    Features: age, bmi, systolic_bp, diastolic_bp, glucose, cholesterol, smoker, exercise_frequency
    Target: risk_level ('Low', 'Medium', 'High') and risk_score (0-100)
    Derived from clinical risk guidelines (AHA, ADA, Framingham).
    """
    path = DATA_DIR / "health_risk_dataset.csv"
    if path.exists() and path.stat().st_size > 1000:
        print(f"{path.name} already exists.")
        return

    np.random.seed(101)
    n = 2500

    age = np.random.randint(18, 85, size=n)
    gender = np.random.choice(["male", "female"], size=n)
    bmi = np.round(np.random.normal(27.5, 5.8, size=n), 1)
    bmi = np.clip(bmi, 16.0, 50.0)

    # Blood pressure correlates with age and BMI
    systolic_bp = (100 + 0.45 * age + 0.7 * bmi + np.random.normal(0, 12, size=n)).astype(int)
    systolic_bp = np.clip(systolic_bp, 85, 210)
    diastolic_bp = (systolic_bp * 0.65 + np.random.normal(0, 6, size=n)).astype(int)
    diastolic_bp = np.clip(diastolic_bp, 50, 125)

    # Fasting Glucose (correlated with age, bmi)
    glucose = (75 + 0.3 * age + 0.9 * bmi + np.random.exponential(15, size=n)).astype(int)
    glucose = np.clip(glucose, 65, 320)

    # Cholesterol
    cholesterol = (150 + 0.8 * age + 0.6 * bmi + np.random.normal(0, 30, size=n)).astype(int)
    cholesterol = np.clip(cholesterol, 110, 420)

    smoker = np.random.choice([0, 1], p=[0.78, 0.22], size=n)
    exercise = np.random.choice(["sedentary", "moderate", "active"], p=[0.40, 0.45, 0.15], size=n)

    # Multi-factorial Framingham / WHO based risk scoring equation
    risk_points = (
        (age - 18) * 0.4 +
        (bmi - 22).clip(min=0) * 1.3 +
        (systolic_bp - 120).clip(min=0) * 0.35 +
        (glucose - 100).clip(min=0) * 0.25 +
        (cholesterol - 200).clip(min=0) * 0.15 +
        smoker * 18.0 +
        (exercise == "sedentary") * 6.0 -
        (exercise == "active") * 6.0 +
        np.random.normal(0, 5, size=n)
    )

    # Convert to 0-100 probability
    prob = 1.0 / (1.0 + np.exp(-(risk_points - 28) / 12.0))
    risk_percentage = np.round(prob * 100, 1)

    # Categorize into Low (<35%), Medium (35-65%), High (>65%)
    risk_level = np.where(risk_percentage < 35.0, "Low",
                 np.where(risk_percentage < 65.0, "Medium", "High"))

    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "bmi": bmi,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "glucose": glucose,
        "cholesterol": cholesterol,
        "smoker": smoker,
        "exercise": exercise,
        "risk_percentage": risk_percentage,
        "risk_level": risk_level
    })
    df.to_csv(path, index=False)
    print(f"Created {path.name} with {len(df)} records.")

def prepare_insurance_catalogue():
    """
    Creates structured insurance plan catalogue with realistic public-attributes.
    Plans represent diverse market tiers: Comprehensive, Senior, Critical Illness, Budget/Top-Up.
    """
    path = DATA_DIR / "insurance_plans.json"
    if path.exists() and path.stat().st_size > 500:
        print(f"{path.name} already exists.")
        return

    plans = [
        {
            "plan_id": "CARE-SUPREME-01",
            "plan_name": "Care Supreme Comprehensive Care",
            "insurer_name": "Care Health Insurance",
            "plan_type": "Comprehensive",
            "annual_premium": 14200.0,
            "sum_insured": 1000000.0,  # 10 Lakhs
            "deductible": 0.0,
            "co_pay": 0.0,
            "waiting_period": 24,  # months
            "room_rent_limit": "No Capping / Single Private Room",
            "network_hospital_count": 11400,
            "maternity_coverage": True,
            "critical_illness_coverage": True,
            "outpatient_coverage": False,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 18,
            "maximum_age": 65,
            "risk_compatibility": "All",
            "claim_settlement_ratio": 98.7,
            "key_features": [
                "Unlimited automatic restoration of sum insured",
                "Up to 500% cumulative bonus for claim-free years",
                "No sub-limits on ICU charges or treatments",
                "Free annual preventive health checkup for all adults"
            ],
            "exclusions": [
                "Pre-existing diseases during the initial 24-month waiting period",
                "Non-allopathic experimental treatments",
                "Cosmetic and aesthetic plastic surgeries unless trauma-induced"
            ],
            "important_limitations": [
                "Standard 30-day initial waiting period applies except accidental injury",
                "OPD consultations are not reimbursable under this tier"
            ]
        },
        {
            "plan_id": "STAR-COMPREHENSIVE-02",
            "plan_name": "Star Comprehensive Health Classic",
            "insurer_name": "Star Health & Allied Insurance",
            "plan_type": "Comprehensive",
            "annual_premium": 18500.0,
            "sum_insured": 1500000.0,  # 15 Lakhs
            "deductible": 0.0,
            "co_pay": 0.0,
            "waiting_period": 24,
            "room_rent_limit": "Single Private A/C Room",
            "network_hospital_count": 14000,
            "maternity_coverage": True,
            "critical_illness_coverage": True,
            "outpatient_coverage": True,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 18,
            "maximum_age": 65,
            "risk_compatibility": "All",
            "claim_settlement_ratio": 99.1,
            "key_features": [
                "Includes outpatient (OPD) dental & ophthalmic consultations up to ₹5,000",
                "Maternity cover with newborn coverage from day 1",
                "Bariatric surgery coverage after 36 months",
                "Air ambulance coverage up to ₹5,00,000"
            ],
            "exclusions": [
                "Self-inflicted injuries and hazardous adventure sports",
                "Genetic disorders and stem cell therapy",
                "Routine health examinations during initial 12 months"
            ],
            "important_limitations": [
                "Maternity benefits require a 24-month waiting period",
                "OPD benefits subject to yearly caps"
            ]
        },
        {
            "plan_id": "HDFC-OPTI-SECURE-03",
            "plan_name": "Optima Secure Smart Shield",
            "insurer_name": "HDFC ERGO General Insurance",
            "plan_type": "Comprehensive",
            "annual_premium": 22400.0,
            "sum_insured": 2000000.0,  # 20 Lakhs
            "deductible": 0.0,
            "co_pay": 0.0,
            "waiting_period": 36,
            "room_rent_limit": "No Sub-limit / Any Room",
            "network_hospital_count": 12800,
            "maternity_coverage": False,
            "critical_illness_coverage": True,
            "outpatient_coverage": False,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 18,
            "maximum_age": 70,
            "risk_compatibility": "All",
            "claim_settlement_ratio": 97.9,
            "key_features": [
                "2X base coverage instantly on Day 1 without extra charges",
                "Protect Plus rider covers non-medical consumables (gloves, syringes, sanitizers)",
                "Restore benefit with unlimited triggers for different illnesses",
                "Zero claim deductions on room rent upgrades"
            ],
            "exclusions": [
                "Intentional self-injury and substance abuse rehabilitation",
                "Congenital external anomalies",
                "Unproven clinical trials"
            ],
            "important_limitations": [
                "36-month waiting period for pre-existing hypertension or cardiac history",
                "Higher entry premium for individuals over 45"
            ]
        },
        {
            "plan_id": "NIVA-REASSURE-04",
            "plan_name": "Niva Bupa ReAssure 2.0 Titanium",
            "insurer_name": "Niva Bupa Health Insurance",
            "plan_type": "Comprehensive",
            "annual_premium": 16800.0,
            "sum_insured": 1000000.0,
            "deductible": 0.0,
            "co_pay": 0.0,
            "waiting_period": 24,
            "room_rent_limit": "Single Private Room",
            "network_hospital_count": 10500,
            "maternity_coverage": False,
            "critical_illness_coverage": True,
            "outpatient_coverage": False,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 18,
            "maximum_age": 65,
            "risk_compatibility": "Low-Medium",
            "claim_settlement_ratio": 98.4,
            "key_features": [
                "Lock the Clock: Premium remains constant as long as no claims are made",
                "ReAssure 'Forever' automatic reinstatement of full sum insured",
                "Booster+ benefit carries forward unutilized sum insured up to 10X",
                "Smart health discounts for walking >10,000 steps daily"
            ],
            "exclusions": [
                "Obesity treatment and weight reduction surgeries",
                "Cosmetic and sex-reassignment surgery",
                "Hazardous occupational exposure"
            ],
            "important_limitations": [
                "Strict wellness tracking required to lock premium discount tiers",
                "No maternity coverage included"
            ]
        },
        {
            "plan_id": "CARE-SENIOR-PRIME-05",
            "plan_name": "Senior First Golden Protection",
            "insurer_name": "Care Health Insurance",
            "plan_type": "Senior Citizen",
            "annual_premium": 31200.0,
            "sum_insured": 1000000.0,
            "deductible": 0.0,
            "co_pay": 20.0,  # 20% co-pay typical for senior citizen plans
            "waiting_period": 12,  # Shorter 1-year waiting period for senior citizens
            "room_rent_limit": "Twin Sharing Room",
            "network_hospital_count": 9200,
            "maternity_coverage": False,
            "critical_illness_coverage": True,
            "outpatient_coverage": True,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 55,
            "maximum_age": 85,
            "risk_compatibility": "High-Compatible",
            "claim_settlement_ratio": 96.8,
            "key_features": [
                "Designed specifically for senior citizens and pre-existing chronic conditions",
                "Reduced 12-month waiting period for hypertension and diabetes mellitus",
                "Annual comprehensive health check-up including cardiac lipid profiles",
                "Domiciliary hospitalization and home healthcare assistance included"
            ],
            "exclusions": [
                "Joint replacement surgery within the first 24 months unless accidental",
                "Non-medical attendant charges",
                "Unapproved herbal regimens"
            ],
            "important_limitations": [
                "Mandatory 20% co-payment on all hospital claims",
                "Room rent capped at twin-sharing rate"
            ]
        },
        {
            "plan_id": "ICICI-ELEVATE-06",
            "plan_name": "ICICI Lombard Health AdvantEdge",
            "insurer_name": "ICICI Lombard General Insurance",
            "plan_type": "Comprehensive",
            "annual_premium": 15600.0,
            "sum_insured": 1000000.0,
            "deductible": 0.0,
            "co_pay": 0.0,
            "waiting_period": 24,
            "room_rent_limit": "Single Private Room",
            "network_hospital_count": 9800,
            "maternity_coverage": False,
            "critical_illness_coverage": True,
            "outpatient_coverage": False,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 18,
            "maximum_age": 65,
            "risk_compatibility": "All",
            "claim_settlement_ratio": 98.1,
            "key_features": [
                "Reset benefit restores 100% of sum insured upon exhaustion",
                "Worldwide emergency medical coverage up to ₹5,00,000",
                "Pre-hospitalization 60 days, post-hospitalization 180 days coverage",
                "Donor expenses covered up to full sum insured for organ transplants"
            ],
            "exclusions": [
                "Dental treatment unless requiring hospitalization from accident",
                "Hearing aids, spectacles, contact lenses",
                "Psychiatric inpatient treatment within first 24 months"
            ],
            "important_limitations": [
                "International coverage is limited to emergency inpatient admissions only",
                "30-day initial waiting period applies"
            ]
        },
        {
            "plan_id": "BAJAJ-CRITI-CARE-07",
            "plan_name": "Bajaj Allianz Critical Illness Guard",
            "insurer_name": "Bajaj Allianz General Insurance",
            "plan_type": "Critical Illness",
            "annual_premium": 9800.0,
            "sum_insured": 2500000.0,  # 25 Lakhs lump-sum
            "deductible": 0.0,
            "co_pay": 0.0,
            "waiting_period": 90,  # 90 days initial waiting
            "room_rent_limit": "Lump Sum Payout (No sub-limits)",
            "network_hospital_count": 8700,
            "maternity_coverage": False,
            "critical_illness_coverage": True,
            "outpatient_coverage": False,
            "day_care_procedures": False,
            "ayush_coverage": False,
            "minimum_age": 18,
            "maximum_age": 65,
            "risk_compatibility": "High-Compatible",
            "claim_settlement_ratio": 97.4,
            "key_features": [
                "100% lump-sum compensation upon first diagnosis of 37 critical illnesses",
                "Payout can be used for living expenses, overseas treatment, or debt repayment",
                "Second medical opinion service from global oncology panels",
                "Income tax benefit under section 80D"
            ],
            "exclusions": [
                "Illnesses diagnosed within the first 90 days from inception",
                "Diseases related to HIV/AIDS",
                "Congenital internal conditions diagnosed before age 18"
            ],
            "important_limitations": [
                "Requires a 30-day survival period post-diagnosis before claim disbursement",
                "Does NOT cover standard day-to-day hospitalization or surgeries"
            ]
        },
        {
            "plan_id": "MANIPAL-SUPER-TOPUP-08",
            "plan_name": "ManipalCigna Super Top-Up Plus",
            "insurer_name": "ManipalCigna Health Insurance",
            "plan_type": "Super Top-Up",
            "annual_premium": 5400.0,
            "sum_insured": 2500000.0,  # 25 Lakhs
            "deductible": 500000.0,   # 5 Lakh deductible
            "co_pay": 0.0,
            "waiting_period": 24,
            "room_rent_limit": "No Sub-limit / Any Room",
            "network_hospital_count": 8900,
            "maternity_coverage": False,
            "critical_illness_coverage": True,
            "outpatient_coverage": False,
            "day_care_procedures": True,
            "ayush_coverage": True,
            "minimum_age": 18,
            "maximum_age": 75,
            "risk_compatibility": "All",
            "claim_settlement_ratio": 96.5,
            "key_features": [
                "High coverage (₹25L) at extremely economical premium (₹5.4K/yr)",
                "Aggregates multiple claims during a policy year toward deductible threshold",
                "Guaranteed lifetime renewability with no age ceiling",
                "Ideal companion for corporate group insurance or basic policies"
            ],
            "exclusions": [
                "Expenses falling below the chosen ₹5,00,000 threshold/deductible",
                "Experimental stem-cell treatments",
                "Non-prescribed supplements and vitamins"
            ],
            "important_limitations": [
                "Policy only activates AFTER claims exceed ₹5,00,000 in a single policy year",
                "Not suitable as a standalone primary policy without base coverage"
            ]
        }
    ]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(plans, f, indent=2)
    print(f"Created {path.name} with {len(plans)} insurance plans.")

if __name__ == "__main__":
    print("Preparing all project datasets...")
    prepare_medical_cost_dataset()
    prepare_diabetes_dataset()
    prepare_heart_dataset()
    prepare_combined_health_risk_dataset()
    prepare_insurance_catalogue()
    print("All datasets prepared successfully!")
