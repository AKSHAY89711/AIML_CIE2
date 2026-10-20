import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Heart,
  Activity,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { HealthProfile, DemoProfileItem } from '../types';
import { assessmentService, demoService, authService } from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const AssessmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoProfiles, setDemoProfiles] = useState<DemoProfileItem[]>([]);
  const [isDemoActive, setIsDemoActive] = useState(false);

  // Form State
  const [formData, setFormData] = useState<HealthProfile>({
    age: 35,
    gender: 'male',
    height_cm: 172.0,
    weight_kg: 72.0,
    bmi: 24.3,
    systolic_bp: 120,
    diastolic_bp: 80,
    glucose: 95,
    cholesterol: 185,
    smoker: false,
    smoking_status: 'never',
    exercise_frequency: 'moderate',
    alcohol_frequency: 'moderate',
    family_history_heart: false,
    family_history_diabetes: false,
    pre_existing_conditions: [],
    dependents: 1,
    annual_income: 750000.0,
    insurance_budget_annual: 22000.0,
    preferred_coverage_type: 'comprehensive',
    region: 'southeast',
  });

  const [disclaimerChecked, setDisclaimerChecked] = useState(true);

  // Auto-calculate BMI whenever height or weight changes
  useEffect(() => {
    if (formData.height_cm && formData.weight_kg && formData.height_cm > 0) {
      const h_m = formData.height_cm / 100.0;
      const calculatedBmi = Number((formData.weight_kg / (h_m * h_m)).toFixed(1));
      setFormData((prev) => ({ ...prev, bmi: calculatedBmi }));
    }
  }, [formData.height_cm, formData.weight_kg]);

  // Load demo profiles
  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const demos = await demoService.getDemoProfiles();
        setDemoProfiles(demos);

        // If URL has ?demo=true or ?profile=xxx, auto load first demo
        if (searchParams.get('demo') === 'true' && demos.length > 0) {
          loadDemo(demos[0]);
        }
      } catch (e) {
        console.error('Error fetching demo profiles:', e);
      }
    };
    fetchDemos();
  }, [searchParams]);

  const loadDemo = (demo: DemoProfileItem) => {
    setFormData({ ...demo.profile });
    setIsDemoActive(true);
    setError(null);
  };

  const handleNext = () => {
    setError(null);
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleCondition = (condition: string) => {
    const current = formData.pre_existing_conditions;
    if (current.includes(condition)) {
      setFormData({
        ...formData,
        pre_existing_conditions: current.filter((c) => c !== condition),
      });
    } else {
      setFormData({
        ...formData,
        pre_existing_conditions: [...current, condition],
      });
    }
  };

  const handleSubmit = async () => {
    if (!disclaimerChecked) {
      setError('Please acknowledge the decision-support notice to proceed.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (authService.isAuthenticated()) {
        result = await assessmentService.createAssessment({
          title: isDemoActive ? 'Demo Health & Insurance Assessment' : 'Personal Health & Insurance Assessment',
          is_demo: isDemoActive,
          profile: formData,
        });
      } else {
        // Unauthenticated demo evaluation
        const risk = await assessmentService.predictRisk(formData);
        const cost = await assessmentService.predictCost(formData);
        const recs = await assessmentService.getRecommendations(formData);

        result = {
          id: 0,
          user_id: 0,
          title: 'Guest Health & Insurance Assessment',
          created_at: new Date().toISOString(),
          is_demo: isDemoActive,
          profile: formData,
          risk: risk,
          cost: cost,
          recommendations: recs.recommendations,
          disclaimer: 'Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor.'
        };
        // Store guest assessment in session storage
        sessionStorage.setItem('guest_assessment', JSON.stringify(result));
      }

      navigate(authService.isAuthenticated() ? `/results/${result.id}` : '/results/guest');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error executing assessment analysis. Please check values.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Personal Profile', icon: User },
    { num: 2, title: 'Clinical Vitals', icon: Heart },
    { num: 3, title: 'Lifestyle & History', icon: Activity },
    { num: 4, title: 'Budget & Coverage', icon: DollarSign },
    { num: 5, title: 'Review & Analyze', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Demo Selector Bar */}
      <div className="bg-gradient-to-r from-healthcare-50 via-white to-healthcare-50 border border-healthcare-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-healthcare-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
              College Demo Mode
            </span>
            <span className="text-[11px] text-slate-500">
              Load realistic patient scenarios to test the ML classification, regression &amp; recommendation engine.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {demoProfiles.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => loadDemo(d)}
              className="px-3 py-1.5 bg-white hover:bg-healthcare-100/60 border border-healthcare-200 text-healthcare-800 rounded-lg text-xs font-medium transition shadow-xs flex items-center gap-1.5"
            >
              <span>{d.badge}</span>
            </button>
          ))}
          {isDemoActive && (
            <button
              type="button"
              onClick={() => {
                setIsDemoActive(false);
                setFormData({
                  age: 35,
                  gender: 'male',
                  height_cm: 172.0,
                  weight_kg: 72.0,
                  bmi: 24.3,
                  systolic_bp: 120,
                  diastolic_bp: 80,
                  glucose: 95,
                  cholesterol: 185,
                  smoker: false,
                  smoking_status: 'never',
                  exercise_frequency: 'moderate',
                  alcohol_frequency: 'moderate',
                  family_history_heart: false,
                  family_history_diabetes: false,
                  pre_existing_conditions: [],
                  dependents: 1,
                  annual_income: 750000.0,
                  insurance_budget_annual: 22000.0,
                  preferred_coverage_type: 'comprehensive',
                  region: 'southeast',
                });
              }}
              title="Reset"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isDemoActive && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between">
          <span>
            <strong>Demo Profile Loaded:</strong> Values will be processed in real-time by the trained XGBoost and Regressor models.
          </span>
          <span className="font-mono text-[10px] bg-blue-200/60 px-2 py-0.5 rounded">DEMO MODE ACTIVE</span>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            const IconComponent = s.icon;

            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`cursor-pointer text-center group flex flex-col items-center`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition mb-1.5 ${
                    isCurrent
                      ? 'bg-healthcare-600 text-white shadow-md shadow-healthcare-600/30'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:block ${
                    isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        {/* Step 1: Personal Profile */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Step 1: Personal Demographics</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter foundational demographic measurements. BMI is automatically computed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Age (Years)</label>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Valid range: 18 - 100 years</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 170 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 70 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
              </div>

              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">Calculated Body Mass Index (BMI)</span>
                  <span className="text-xs text-slate-500">Weight (kg) &divide; (Height (m))&sup2;</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{formData.bmi}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {formData.bmi < 18.5
                      ? 'Underweight'
                      : formData.bmi < 25
                      ? 'Normal weight'
                      : formData.bmi < 30
                      ? 'Overweight'
                      : 'Obese'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Clinical Vitals */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Step 2: Clinical Vitals</h3>
              <p className="text-xs text-slate-500 mt-1">
                Standard biometric vitals commonly reviewed in underwriting and health assessments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Systolic Blood Pressure (mmHg)
                </label>
                <input
                  type="number"
                  min={70}
                  max={240}
                  value={formData.systolic_bp}
                  onChange={(e) => setFormData({ ...formData, systolic_bp: parseInt(e.target.value) || 120 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Normal: 90 - 120 mmHg</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Diastolic Blood Pressure (mmHg)
                </label>
                <input
                  type="number"
                  min={40}
                  max={140}
                  value={formData.diastolic_bp}
                  onChange={(e) => setFormData({ ...formData, diastolic_bp: parseInt(e.target.value) || 80 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Normal: 60 - 80 mmHg</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Fasting Blood Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  min={50}
                  max={400}
                  value={formData.glucose}
                  onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || 90 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Normal fasting: 70 - 99 mg/dL</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Total Serum Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  min={100}
                  max={450}
                  value={formData.cholesterol}
                  onChange={(e) => setFormData({ ...formData, cholesterol: parseInt(e.target.value) || 180 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Desirable: &lt; 200 mg/dL</span>
              </div>
            </div>

            {/* Abnormal values banner */}
            {(formData.systolic_bp >= 160 || formData.glucose >= 200) && (
              <DisclaimerBanner
                variant="clinical-alert"
                message="Entered vitals reflect elevated biometric thresholds. Safety guardrails are enabled and will advise medical consultation."
              />
            )}
          </div>
        )}

        {/* Step 3: Lifestyle & Medical History */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Step 3: Lifestyle &amp; Medical History</h3>
              <p className="text-xs text-slate-500 mt-1">
                Smoking and physical activity are heavily weighted factors in medical cost and risk modeling.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tobacco Smoking Status</label>
                <select
                  value={formData.smoking_status}
                  onChange={(e) => {
                    const status = e.target.value as any;
                    setFormData({
                      ...formData,
                      smoking_status: status,
                      smoker: status === 'current',
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                >
                  <option value="never">Non-Smoker (Never)</option>
                  <option value="former">Former Smoker</option>
                  <option value="current">Current Smoker</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Physical Activity Level</label>
                <select
                  value={formData.exercise_frequency}
                  onChange={(e) => setFormData({ ...formData, exercise_frequency: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                >
                  <option value="sedentary">Sedentary (&lt; 1 hr/week)</option>
                  <option value="moderate">Moderate (2-3 hrs/week)</option>
                  <option value="active">Active (4+ hrs/week)</option>
                </select>
              </div>
            </div>

            {/* Family History */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 block">Family Clinical History</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={formData.family_history_heart}
                    onChange={(e) => setFormData({ ...formData, family_history_heart: e.target.checked })}
                    className="w-4 h-4 text-healthcare-600 rounded"
                  />
                  <span className="text-xs text-slate-700 font-medium">Family History of Cardiac Disease</span>
                </label>

                <label className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={formData.family_history_diabetes}
                    onChange={(e) => setFormData({ ...formData, family_history_diabetes: e.target.checked })}
                    className="w-4 h-4 text-healthcare-600 rounded"
                  />
                  <span className="text-xs text-slate-700 font-medium">Family History of Type-2 Diabetes</span>
                </label>
              </div>
            </div>

            {/* Pre-existing conditions */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Pre-Existing Conditions (Affects Waiting Periods &amp; Exclusions)
              </label>
              <div className="flex flex-wrap gap-2">
                {['hypertension', 'diabetes', 'asthma', 'thyroid', 'cholesterol', 'cardiac history'].map((item) => {
                  const isSelected = formData.pre_existing_conditions.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleCondition(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition border ${
                        isSelected
                          ? 'bg-healthcare-600 text-white border-healthcare-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Budget & Coverage Preferences */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Step 4: Insurance Budget &amp; Preferences</h3>
              <p className="text-xs text-slate-500 mt-1">
                Used by the recommendation engine to calculate Affordability and Coverage Fit scores.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Target Annual Insurance Budget (₹)
                </label>
                <input
                  type="number"
                  min={3000}
                  step={1000}
                  value={formData.insurance_budget_annual}
                  onChange={(e) => setFormData({ ...formData, insurance_budget_annual: parseFloat(e.target.value) || 20000 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Approx ₹{Math.round(formData.insurance_budget_annual / 12).toLocaleString('en-IN')}/month
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Number of Dependents / Children
                </label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={formData.dependents}
                  onChange={(e) => setFormData({ ...formData, dependents: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Preferred Coverage Type</label>
                <select
                  value={formData.preferred_coverage_type}
                  onChange={(e) => setFormData({ ...formData, preferred_coverage_type: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                >
                  <option value="comprehensive">Comprehensive Health Shield</option>
                  <option value="basic">Standard Essential</option>
                  <option value="critical_illness">Critical Illness Focused</option>
                  <option value="family_floater">Family Floater</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Geographic Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500/20"
                >
                  <option value="southeast">Southeast</option>
                  <option value="southwest">Southwest</option>
                  <option value="northeast">Northeast</option>
                  <option value="northwest">Northwest</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Analyze */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Step 5: Review Profile &amp; Execute ML Pipeline</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify input parameters before triggering the multi-module decision support engine.
              </p>
            </div>

            {/* Profile Summary Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-800 border-b border-slate-200">
                Input Profile Summary
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-700">
                <div>
                  <span className="text-[11px] text-slate-400 block">Demographics</span>
                  <span className="font-semibold">{formData.age} yrs &bull; {formData.gender}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">BMI</span>
                  <span className="font-semibold">{formData.bmi} kg/m²</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Blood Pressure</span>
                  <span className="font-semibold">{formData.systolic_bp} / {formData.diastolic_bp} mmHg</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Fasting Glucose</span>
                  <span className="font-semibold">{formData.glucose} mg/dL</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Cholesterol</span>
                  <span className="font-semibold">{formData.cholesterol} mg/dL</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Smoking Status</span>
                  <span className="font-semibold">{formData.smoker ? 'Current Smoker' : 'Non-Smoker'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Physical Activity</span>
                  <span className="font-semibold capitalize">{formData.exercise_frequency}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Target Budget</span>
                  <span className="font-semibold">₹{formData.insurance_budget_annual.toLocaleString('en-IN')}/yr</span>
                </div>
              </div>
            </div>

            {/* Legal / Ethical Disclaimer Checkbox */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclaimerChecked}
                  onChange={(e) => setDisclaimerChecked(e.target.checked)}
                  className="w-4 h-4 text-healthcare-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I understand that this platform is strictly for <strong>decision-support and statistical estimation</strong>. It does not provide medical diagnoses, treatment advice, or guarantees of insurance underwriting and premiums.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Step
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-healthcare-600 hover:bg-healthcare-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-healthcare-600/25 transition"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !disclaimerChecked}
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl bg-healthcare-600 hover:bg-healthcare-700 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-healthcare-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running ML Decision Engine...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Health &amp; Match Plans
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
