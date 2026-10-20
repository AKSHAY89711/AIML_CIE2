import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  Lock,
  ChevronRight,
  Database,
  ArrowRight,
  Stethoscope,
  DollarSign,
  FileCheck2,
  Users
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 bg-gradient-to-b from-healthcare-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-healthcare-100 text-healthcare-800 text-xs font-semibold tracking-wide">
              <Activity className="w-3.5 h-3.5 text-healthcare-600" />
              Machine Learning Driven Healthcare & Insurance Decision Support
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Intelligent Healthcare &amp; <br />
              <span className="text-healthcare-600">Health Insurance</span> Decision Platform
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              A unified, transparent decision-support system that predicts health risk, projects expected yearly medical expenses, and recommends optimal insurance plans using explainable AI.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/assessment"
                className="w-full sm:w-auto px-7 py-3.5 bg-healthcare-600 hover:bg-healthcare-700 text-white rounded-xl font-semibold shadow-lg shadow-healthcare-600/25 transition flex items-center justify-center gap-2"
              >
                Start Health Assessment
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/assessment?demo=true"
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-semibold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-healthcare-600" />
                Explore Demo Patients
              </Link>
            </div>

            <div className="pt-6">
              <DisclaimerBanner variant="card" className="text-left max-w-2xl mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Core Modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-healthcare-600">Integrated Pipeline</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Three Decisions Connected in One Workflow
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            No more fragmented evaluations. Connect health vitals, financial exposure, and policy terms into a single transparent report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Module 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Module 1</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Health Risk Prediction</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Multi-class machine learning classification (Low, Medium, High risk) assessing cardiovascular, glycemic, and lifestyle factors with calibrated probabilities.
            </p>
            <div className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Algorithms: Logistic Regression &bull; Random Forest &bull; XGBoost
            </div>
          </div>

          {/* Module 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 2</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Medical Cost Estimation</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Regression modeling trained on Brett Lantz Medical Cost records estimating out-of-pocket medical expenditure, monthly equivalents, and cost driver attributions.
            </p>
            <div className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Algorithms: Linear Reg &bull; Random Forest &bull; XGBoost Regressor
            </div>
          </div>

          {/* Module 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Module 3</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Insurance Plan Recommendation</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Multi-attribute utility scoring and cosine-similarity matching against a structured insurance plan catalogue based on Affordability, Coverage, Risk compatibility, and Terms.
            </p>
            <div className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Method: Multi-Attribute Utility &bull; Cosine Similarity &bull; Constraint Filtering
            </div>
          </div>
        </div>
      </section>

      {/* Explainable AI Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 lg:p-14 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-healthcare-300 text-xs font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5 text-healthcare-400" />
                SHAP Interpretability Engine
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                No Black-Box Predictions. Complete Explainability.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Traditional AI systems output numbers without reasoning. Our platform integrates Shapley Additive exPlanations (SHAP) to isolate precisely how your age, BMI, blood pressure, glucose, and smoking status influenced the risk probability.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-healthcare-600/40 text-healthcare-300 flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-xs text-slate-300">Plain-language translations for everyday patients and families.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-healthcare-600/40 text-healthcare-300 flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-xs text-slate-300">Technical SHAP attribution charts for clinicians and data scientists.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-healthcare-600/40 text-healthcare-300 flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-xs text-slate-300">Strict separation between clinical risk drivers and insurance matching logic.</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
              <span className="text-xs font-semibold text-healthcare-400 uppercase tracking-wider block">Sample Live SHAP Attribution</span>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-900/40 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">Tobacco Smoking Status</span>
                    <span className="text-[11px] text-rose-400">Current Smoker (+1.52 SHAP impact)</span>
                  </div>
                  <span className="px-2 py-1 bg-rose-950 text-rose-300 rounded font-mono text-[11px]">+High Risk</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-900/40 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">Body Mass Index (BMI: 31.0)</span>
                    <span className="text-[11px] text-rose-400">Elevated adiposity marker (+0.84 SHAP impact)</span>
                  </div>
                  <span className="px-2 py-1 bg-rose-950 text-rose-300 rounded font-mono text-[11px]">+High Risk</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-900/40 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">Physical Activity</span>
                    <span className="text-[11px] text-emerald-400">Moderate exercise routine (-0.32 SHAP impact)</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-950 text-emerald-300 rounded font-mono text-[11px]">-Protective</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rigorous ML Methodology */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold text-healthcare-600 uppercase tracking-wider">Academic Integrity &amp; Transparency</span>
              <h3 className="text-xl font-bold text-slate-900">Zero Fabricated Predictions. Real Trained Models.</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All models are trained using 80/20 stratified splits, 5-fold cross-validation, and leak-free preprocessing pipelines. View genuine ROC-AUC, F1-scores, MAE, and confusion matrices directly on our Model Performance dashboard.
              </p>
            </div>
            <Link
              to="/model-performance"
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-2 self-start md:self-auto"
            >
              <Database className="w-4 h-4 text-healthcare-600" />
              View Model Performance Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900">Ready to evaluate your healthcare decision profile?</h2>
          <p className="text-sm text-slate-600">
            Takes less than 2 minutes. Receive an instant risk forecast, expected medical budget estimation, and tailored insurance recommendations.
          </p>
          <div className="pt-2">
            <Link
              to="/assessment"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-healthcare-600 hover:bg-healthcare-700 text-white rounded-xl font-semibold shadow-md shadow-healthcare-600/30 transition"
            >
              Start Free Assessment Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
