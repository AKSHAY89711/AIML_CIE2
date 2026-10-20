import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Award,
  Database,
  CheckCircle,
  Cpu,
  Layers,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { ModelPerformanceData } from '../types';
import { performanceService, authService } from '../services/api';

export const ModelPerformancePage: React.FC = () => {
  const [data, setData] = useState<ModelPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = authService.getCurrentUser();

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await performanceService.getModelPerformance();
      setData(res);
    } catch (err: any) {
      setError(
        err.response?.status === 503
          ? 'Model training required: No trained models found on disk.'
          : 'Failed to retrieve model performance data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleRetrain = async () => {
    if (!window.confirm('Trigger full model pipeline retraining?')) return;
    setRetraining(true);
    try {
      await performanceService.triggerRetrain();
      await fetchPerformance();
      alert('Models successfully retrained and reloaded into active memory!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Retraining failed');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-healthcare-50 text-healthcare-700">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ML Model Performance &amp; Evaluation
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical benchmark metrics evaluated on 20% stratified test sets with 5-fold cross-validation.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining Pipelines...' : 'Trigger Pipeline Retrain'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-healthcare-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Retrieving model metrics and evaluation matrices...</p>
        </div>
      ) : error || !data ? (
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-amber-900">{error || 'Model metrics unavailable'}</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            Please run the training pipeline (`python ml/training/train_risk.py` &amp; `python ml/training/train_cost.py`) to generate authentic metrics.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Module 1: Classification Comparison Table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Module 1</span>
                <h3 className="text-lg font-bold text-slate-900">Health Risk Classification Benchmarks</h3>
                <p className="text-xs text-slate-500">
                  Target: Low, Medium, High Risk &bull; Test Set: 500 samples (20% Stratified) &bull; Scaler fitted strictly on train data
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-healthcare-700 bg-healthcare-50 border border-healthcare-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                <Award className="w-4 h-4 text-healthcare-600" />
                Active Model: {data.winning_risk_model}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Algorithm</th>
                    <th className="px-6 py-3.5">Accuracy</th>
                    <th className="px-6 py-3.5">Precision (Weighted)</th>
                    <th className="px-6 py-3.5">Recall (Weighted)</th>
                    <th className="px-6 py-3.5">F1-Score (Weighted)</th>
                    <th className="px-6 py-3.5">ROC-AUC (OVR)</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(data.risk_classification).map(([name, m]) => {
                    const isWinner = name === data.winning_risk_model;
                    return (
                      <tr key={name} className={isWinner ? 'bg-healthcare-50/40 font-medium' : 'hover:bg-slate-50/60'}>
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                          {isWinner && <Award className="w-4 h-4 text-healthcare-600 flex-shrink-0" />}
                          {m.algorithm}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">
                          {(m.accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {m.precision.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {m.recall.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {m.f1_score.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {m.roc_auc.toFixed(4)}
                        </td>
                        <td className="px-6 py-4">
                          {isWinner ? (
                            <span className="px-2 py-0.5 bg-healthcare-600 text-white rounded text-[10px] font-bold">
                              WINNER / ACTIVE
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Evaluated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Module 2: Regression Comparison Table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 2</span>
                <h3 className="text-lg font-bold text-slate-900">Medical Cost Regression Benchmarks</h3>
                <p className="text-xs text-slate-500">
                  Target: Yearly Medical Charges ($) &bull; Test Set: 268 records &bull; Brett Lantz Dataset
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                <Award className="w-4 h-4 text-blue-600" />
                Active Model: {data.winning_cost_model}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Algorithm</th>
                    <th className="px-6 py-3.5">Mean Absolute Error (MAE)</th>
                    <th className="px-6 py-3.5">Root Mean Squared Error (RMSE)</th>
                    <th className="px-6 py-3.5">R&sup2; Score</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(data.cost_regression).map(([name, m]) => {
                    const isWinner = name === data.winning_cost_model;
                    return (
                      <tr key={name} className={isWinner ? 'bg-blue-50/40 font-medium' : 'hover:bg-slate-50/60'}>
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                          {isWinner && <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                          {m.algorithm}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          ${m.mae.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          ${m.rmse.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-slate-900 text-sm">
                          {m.r2_score.toFixed(4)}
                        </td>
                        <td className="px-6 py-4">
                          {isWinner ? (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                              WINNER / ACTIVE
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Evaluated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Module 3: Recommendation Engine & Methodology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Module 3</span>
              <h3 className="text-lg font-bold text-slate-900">Recommendation Engine Metrics</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Top-3 Hit Rate</span>
                  <span className="text-xl font-black text-emerald-600">
                    {(data.recommendation.top3_hit_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Catalog Coverage</span>
                  <span className="text-xl font-black text-slate-900">
                    {(data.recommendation.catalog_coverage * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2">Configured Weight Distribution:</span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Affordability Weight (w1):</span>
                    <span className="font-mono font-semibold">{data.recommendation.weights.affordability * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage Fit Weight (w2):</span>
                    <span className="font-mono font-semibold">{data.recommendation.weights.coverage_fit * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Match Weight (w3):</span>
                    <span className="font-mono font-semibold">{data.recommendation.weights.risk_match * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terms &amp; Moratorium Weight (w4):</span>
                    <span className="font-mono font-semibold">{data.recommendation.weights.terms_fit * 100}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset Provenance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-healthcare-600" />
                <h3 className="text-lg font-bold text-slate-900">CIE-1 Dataset Provenance</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-semibold text-slate-800">Medical Cost Personal Dataset</div>
                  <span className="text-[11px] text-slate-500">1,338 records &bull; Age, BMI, Children, Smoker, Charges</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-semibold text-slate-800">Pima Indians Diabetes Dataset</div>
                  <span className="text-[11px] text-slate-500">768 records &bull; Glucose, BP, Insulin, BMI, Outcome</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-semibold text-slate-800">Heart Disease Cleveland Dataset</div>
                  <span className="text-[11px] text-slate-500">297 records &bull; Age, Sex, Trestbps, Chol, Chest Pain</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-semibold text-slate-800">Insurance Plan Catalogue</div>
                  <span className="text-[11px] text-slate-500">Structured sample catalogue seeded in relational schema</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
