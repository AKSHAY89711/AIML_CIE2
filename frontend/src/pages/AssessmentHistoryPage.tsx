import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  Activity,
  Calendar,
  ChevronRight,
  Trash2,
  Plus,
  AlertCircle,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { AssessmentSummary } from '../types';
import { assessmentService, authService } from '../services/api';

export const AssessmentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const list = await assessmentService.listAssessments();
        setAssessments(list);
      } catch (err: any) {
        setError('Failed to load assessment history.');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [navigate]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this assessment record?')) return;

    try {
      await assessmentService.deleteAssessment(id);
      setAssessments(assessments.filter((a) => a.id !== id));
    } catch (e) {
      alert('Failed to delete assessment');
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'high':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-healthcare-50 text-healthcare-700">
              <History className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessment History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review past health risk evaluations, projected medical expenditures, and matched insurance policies.
          </p>
        </div>

        <Link
          to="/assessment"
          className="px-4 py-2 bg-healthcare-600 hover:bg-healthcare-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-healthcare-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading your history records...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Assessment Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't completed any assessments yet. Run your first health &amp; insurance assessment to generate predictive reports.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-healthcare-600 text-white rounded-xl text-xs font-semibold"
          >
            Start Assessment Now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Assessment Title &amp; Date</th>
                  <th className="px-6 py-3.5">Predicted Risk</th>
                  <th className="px-6 py-3.5">Est. Annual Cost</th>
                  <th className="px-6 py-3.5">Top Recommended Plan</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{a.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(a.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {a.is_demo && (
                          <span className="ml-1 text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1 rounded">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-xs border ${getRiskBadge(
                          a.risk_level
                        )}`}
                      >
                        {a.risk_level} ({a.risk_probability}%)
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ₹{a.estimated_annual_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      <span className="text-[10px] text-slate-400 font-normal block">/ year</span>
                    </td>

                    <td className="px-6 py-4">
                      {a.top_plan_name ? (
                        <div>
                          <span className="font-medium text-slate-900 block">{a.top_plan_name}</span>
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            {a.top_plan_match}% match score
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDelete(a.id, e)}
                          title="Delete record"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="text-healthcare-600 font-semibold hover:underline flex items-center gap-0.5 text-xs">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
