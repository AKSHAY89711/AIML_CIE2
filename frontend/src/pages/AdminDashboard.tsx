import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  FileText,
  Activity,
  Layers,
  RefreshCw,
  Database,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { InsurancePlan } from '../types';
import { authService, planService, performanceService } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [plansData, versionsData] = await Promise.all([
          planService.getPlans(),
          performanceService.getModelVersions(),
        ]);
        setPlans(plansData);
        setVersions(versionsData);
      } catch (e) {
        console.error('Error loading admin data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, [user, navigate]);

  const handleRetrain = async () => {
    if (!window.confirm('Trigger full model pipeline retraining?')) return;
    setRetraining(true);
    try {
      await performanceService.triggerRetrain();
      const updatedVersions = await performanceService.getModelVersions();
      setVersions(updatedVersions);
      alert('Models successfully retrained!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Retraining failed');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin &amp; Platform Governance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System health, active machine learning model versions, dataset provenance, and insurance catalogue management.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          {retraining ? 'Retraining Models...' : 'Retrain All Pipelines'}
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalogue Plans</span>
            <Layers className="w-4 h-4 text-healthcare-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{plans.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Active insurance plans</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Model Pipelines</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{versions.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Active serialized modules</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">System Status</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600">Online</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">FastAPI &bull; SQLite/Postgres</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Explainability</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-purple-600">SHAP</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Tree / Linear attributions</span>
        </div>
      </div>

      {/* Model Versions Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Registered Model Versions &amp; Serialized Artifacts</h3>
          <p className="text-xs text-slate-500">
            Joblib serialized models in active memory serving classification, regression, and recommendations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Module Type</th>
                <th className="px-6 py-3.5">Algorithm</th>
                <th className="px-6 py-3.5">Version Tag</th>
                <th className="px-6 py-3.5">Dataset Source</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {versions.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-semibold text-slate-900">{v.module_type}</td>
                  <td className="px-6 py-4 text-slate-700">{v.algorithm_name}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{v.version_tag}</td>
                  <td className="px-6 py-4 text-slate-500">{v.dataset_source}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[10px]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insurance Plan Catalogue Management */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Catalogue Plans Management</h3>
            <p className="text-xs text-slate-500">
              Insurance products available for scoring and multi-attribute recommendation.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total: {plans.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Plan Name &amp; ID</th>
                <th className="px-6 py-3.5">Insurer</th>
                <th className="px-6 py-3.5">Sum Insured</th>
                <th className="px-6 py-3.5">Annual Premium</th>
                <th className="px-6 py-3.5">Co-Pay / Waiting</th>
                <th className="px-6 py-3.5">CSR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900 block">{p.plan_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{p.plan_id}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{p.insurer_name}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    ₹{(p.sum_insured / 100000).toFixed(0)} Lakhs
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ₹{p.annual_premium.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {p.co_pay}% co-pay &bull; {p.waiting_period} mo wait
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-700">
                    {p.claim_settlement_ratio}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
