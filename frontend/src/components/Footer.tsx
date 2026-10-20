import React from 'react';
import { Activity, ShieldCheck, Heart, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-healthcare-600 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">
                HealthDecide AI Platform
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              An intelligent, transparent decision-support system synthesizing Health Risk Prediction, Expected Medical Cost Estimation, and Insurance Plan Optimization with explainable AI (SHAP).
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Academic Full-Stack Prototype &bull; CIE-2 Production Build</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">Module 1: Health Risk Classifier</span></li>
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">Module 2: Medical Cost Regressor</span></li>
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">Module 3: Insurance Plan Recommender</span></li>
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">SHAP Interpretability Engine</span></li>
            </ul>
          </div>

          {/* Ethics & Compliance */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Governance</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">Decision-Support Only</span></li>
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">No Diagnostic Claims</span></li>
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">Data Leakage Prevention</span></li>
              <li><span className="text-slate-600 hover:text-healthcare-600 transition">Open Model Metrics</span></li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 text-xs text-slate-500 mb-8">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mandatory Healthcare Disclaimer:</strong> This web application is an educational, research, and decision-support prototype. It does not provide medical diagnoses, clinical prescriptions, or guaranteed underwriting approval. Always consult licensed medical practitioners for health concerns and registered insurance brokers for formal policy issuance.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Intelligent Healthcare & Health Insurance Decision Platform.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> using React, FastAPI, XGBoost & SHAP.
          </p>
        </div>
      </div>
    </footer>
  );
};
