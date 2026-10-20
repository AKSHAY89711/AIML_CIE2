import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layers, Check, X, ShieldAlert, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { InsurancePlan } from '../types';
import { planService } from '../services/api';

export const PlanComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [allPlans, setAllPlans] = useState<InsurancePlan[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const plans = await planService.getPlans();
        setAllPlans(plans);

        const urlParam = searchParams.get('plans');
        if (urlParam) {
          const ids = urlParam.split(',').map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
          setSelectedPlanIds(ids.slice(0, 3));
        } else if (plans.length > 0) {
          // Default: first 3 plans
          setSelectedPlanIds(plans.slice(0, 3).map((p) => p.id));
        }
      } catch (e) {
        console.error('Error fetching plans for comparison:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [searchParams]);

  const togglePlan = (id: number) => {
    if (selectedPlanIds.includes(id)) {
      if (selectedPlanIds.length > 1) {
        setSelectedPlanIds(selectedPlanIds.filter((p) => p !== id));
      }
    } else {
      if (selectedPlanIds.length < 3) {
        setSelectedPlanIds([...selectedPlanIds, id]);
      } else {
        alert('You can compare a maximum of 3 plans simultaneously.');
      }
    }
  };

  const comparedPlans = allPlans.filter((p) => selectedPlanIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-healthcare-50 text-healthcare-700">
              <Layers className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Side-by-Side Plan Comparison</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare premiums, coverage limits, pre-existing moratoriums, and room rent sub-limits side-by-side.
          </p>
        </div>

        <Link
          to="/assessment"
          className="px-4 py-2 bg-healthcare-600 hover:bg-healthcare-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" /> Run Assessment Match
        </Link>
      </div>

      {/* Plan Selection Chips */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
          Select Up to 3 Plans to Compare:
        </span>
        <div className="flex flex-wrap gap-2">
          {allPlans.map((p) => {
            const isSelected = selectedPlanIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlan(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-healthcare-600 text-white border-healthcare-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{p.plan_name}</span>
                {isSelected && <span className="font-bold text-[10px]">&times;</span>}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-healthcare-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading plan specifications...</p>
        </div>
      ) : comparedPlans.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Please select at least one plan to view the comparison table.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] w-1/4">
                    Plan Feature / Attribute
                  </th>
                  {comparedPlans.map((p) => (
                    <th key={p.id} className="p-4 font-bold text-slate-900 text-sm w-1/4 border-l border-slate-200">
                      <span className="text-[10px] font-semibold text-healthcare-600 uppercase block tracking-wider">
                        {p.insurer_name}
                      </span>
                      <div className="font-extrabold text-base mt-0.5">{p.plan_name}</div>
                      <span className="text-[11px] text-slate-400 font-normal">{p.plan_type}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Annual Premium */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Annual Premium</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 font-bold text-slate-900 text-sm">
                      ₹{p.annual_premium.toLocaleString('en-IN')}
                      <span className="text-[11px] text-slate-500 font-normal block">
                        ≈ ₹{Math.round(p.annual_premium / 12).toLocaleString('en-IN')}/mo
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Sum Insured */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Sum Insured (Coverage)</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 font-bold text-slate-800">
                      ₹{(p.sum_insured / 100000).toFixed(0)} Lakhs
                    </td>
                  ))}
                </tr>

                {/* Co-Payment */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Mandatory Co-Payment</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100">
                      {p.co_pay === 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[11px]">
                          Zero Co-Pay (100% Covered)
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">{p.co_pay}% co-pay</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Deductible */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Deductible</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 text-slate-800">
                      {p.deductible === 0 ? '₹0 (No Deductible)' : `₹${p.deductible.toLocaleString('en-IN')}`}
                    </td>
                  ))}
                </tr>

                {/* Waiting Period */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Pre-Existing Condition Waiting Period</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 text-slate-800 font-medium">
                      {p.waiting_period} Months
                    </td>
                  ))}
                </tr>

                {/* Room Rent Limit */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Room Rent Sub-Limit</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 text-slate-800">
                      {p.room_rent_limit}
                    </td>
                  ))}
                </tr>

                {/* Network Hospitals */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Cashless Network Hospitals</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 text-slate-800">
                      {p.network_hospital_count.toLocaleString()}+ Facilities
                    </td>
                  ))}
                </tr>

                {/* Critical Illness Cover */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Critical Illness Protection</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100">
                      {p.critical_illness_coverage ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <Check className="w-4 h-4" /> Included
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-4 h-4" /> Not Included
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Maternity Cover */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Maternity Benefit</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100">
                      {p.maternity_coverage ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <Check className="w-4 h-4" /> Included
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-4 h-4" /> Not Included
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Outpatient (OPD) */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Outpatient (OPD) Consultations</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100">
                      {p.outpatient_coverage ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <Check className="w-4 h-4" /> Included
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-4 h-4" /> Not Included
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Claim Settlement Ratio */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-700">Claim Settlement Ratio (CSR)</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-100 font-bold text-slate-800">
                      {p.claim_settlement_ratio}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advisory note */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-500">
        <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>
          Plan terms, waiting periods, and room rent stipulations are illustrative representations from public insurance brochures. Always refer to the official Policy Wording document before purchasing any insurance product.
        </span>
      </div>
    </div>
  );
};
