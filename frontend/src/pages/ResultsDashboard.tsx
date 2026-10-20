import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  DollarSign,
  ShieldCheck,
  Share2,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { AssessmentDetail } from '../types';
import { assessmentService, authService } from '../services/api';
import { RiskGauge } from '../components/RiskGauge';
import { ShapFeatureChart } from '../components/ShapFeatureChart';
import { PlanCard } from '../components/PlanCard';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ResultsDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparedPlanIds, setComparedPlanIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchAssessment = async () => {
      setLoading(true);
      setError(null);
      try {
        if (id === 'guest') {
          const raw = sessionStorage.getItem('guest_assessment');
          if (raw) {
            setData(JSON.parse(raw));
          } else {
            setError('No recent assessment data found. Please complete an assessment.');
          }
        } else if (id) {
          const res = await assessmentService.getAssessment(parseInt(id));
          setData(res);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to load assessment report.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  const handleCompareToggle = (planId: number) => {
    if (comparedPlanIds.includes(planId)) {
      setComparedPlanIds(comparedPlanIds.filter((p) => p !== planId));
    } else {
      setComparedPlanIds([...comparedPlanIds, planId]);
    }
  };

  const handleGoToCompare = () => {
    navigate(`/compare?plans=${comparedPlanIds.join(',')}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-healthcare-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Generating unified decision report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Assessment Report Unavailable</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error || 'Unable to locate requested assessment.'}</p>
        <Link
          to="/assessment"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-healthcare-600 text-white rounded-xl text-xs font-semibold"
        >
          <RotateCcw className="w-4 h-4" /> Start New Assessment
        </Link>
      </div>
    );
  }

  const { risk, cost, recommendations, profile } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-healthcare-600 uppercase tracking-wider">
              Decision Support Report
            </span>
            {data.is_demo && (
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wider">
                DEMO PATIENT RUN
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Health &amp; Insurance Decision Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated on {new Date(data.created_at).toLocaleDateString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} &bull; Profile: {profile.age} yrs, {profile.gender}, BMI {profile.bmi}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {comparedPlanIds.length > 0 && (
            <button
              onClick={handleGoToCompare}
              className="px-4 py-2 bg-healthcare-600 hover:bg-healthcare-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Layers className="w-4 h-4" /> Compare Selected ({comparedPlanIds.length})
            </button>
          )}
          <Link
            to="/assessment"
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" /> New Run
          </Link>
        </div>
      </div>

      {/* Safety Alert Banner if present */}
      {risk.clinical_alert && (
        <DisclaimerBanner variant="clinical-alert" message={risk.clinical_alert_message} />
      )}

      {/* Primary KPI Grid: Risk Card & Cost Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1: Health Risk Card */}
        <RiskGauge riskLevel={risk.risk_level} probability={risk.risk_probability} />

        {/* Module 2: Medical Cost Estimation Card */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Predicted Out-of-Pocket Expense
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Estimated Medical Cost</h3>
                </div>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                {cost.confidence_tier} Confidence
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 my-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900">
                  ₹{cost.estimated_annual_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / year expected</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-slate-700">
                  ≈ ₹{cost.estimated_monthly_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[11px] text-slate-400 block">/ month</span>
              </div>
            </div>

            {/* Cost Drivers */}
            <div className="space-y-1.5 mb-2">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Key Cost Multipliers:
              </span>
              <ul className="text-xs text-slate-600 space-y-1">
                {cost.key_cost_drivers.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            Note: Estimated out-of-pocket medical expenditure is strictly separate from your insurance premium quote.
          </p>
        </div>
      </div>

      {/* SHAP Explainable AI Section */}
      <section>
        <ShapFeatureChart
          contributions={risk.shap_top_features}
          plainExplanations={risk.natural_language_explanation}
        />
      </section>

      {/* Module 3: Recommended Insurance Plans */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Recommended Insurance Plans
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Top 3 ranked matches scored via Multi-Attribute Utility (Affordability: 35%, Coverage Fit: 30%, Risk Match: 20%, Terms: 15%) and Cosine Similarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((item) => (
            <PlanCard
              key={item.plan.id}
              item={item}
              onCompareToggle={handleCompareToggle}
              isCompared={comparedPlanIds.includes(item.plan.id)}
            />
          ))}
        </div>
      </section>

      {/* Persistent Disclaimer at Bottom */}
      <DisclaimerBanner variant="card" />
    </div>
  );
};
