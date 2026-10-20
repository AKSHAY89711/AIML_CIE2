import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Hospital, Clock, Building } from 'lucide-react';
import { RecommendedPlanItem } from '../types';

interface Props {
  item: RecommendedPlanItem;
  onCompareToggle?: (planId: number) => void;
  isCompared?: boolean;
}

export const PlanCard: React.FC<Props> = ({ item, onCompareToggle, isCompared = false }) => {
  const [expanded, setExpanded] = useState(false);
  const plan = item.plan;

  const isTopRank = item.rank === 1;

  return (
    <div
      className={`rounded-2xl border transition duration-200 overflow-hidden bg-white ${
        isTopRank
          ? 'border-healthcare-400 ring-2 ring-healthcare-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Top Banner for Rank */}
      <div
        className={`px-5 py-2.5 flex items-center justify-between text-xs font-semibold ${
          isTopRank
            ? 'bg-healthcare-600 text-white'
            : 'bg-slate-100 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold">
            #{item.rank}
          </span>
          <span>{isTopRank ? 'Top Recommended Match' : `Option ${item.rank}`}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Match Score:</span>
          <span className="font-extrabold text-sm">{item.match_score}%</span>
        </div>
      </div>

      <div className="p-6">
        {/* Plan Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-healthcare-600 bg-healthcare-50 px-2.5 py-0.5 rounded-md">
              {plan.insurer_name}
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-1">{plan.plan_name}</h4>
            <span className="text-xs text-slate-500">{plan.plan_type} Policy &bull; Plan ID: {plan.plan_id}</span>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-2xl font-black text-slate-900">
              ₹{plan.annual_premium.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-slate-500"> /year</span>
            </div>
            <span className="text-xs text-slate-500 block">
              ≈ ₹{Math.round(plan.annual_premium / 12).toLocaleString('en-IN')} /month
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Sum Insured</span>
            <span className="text-sm font-bold text-slate-800">
              ₹{(plan.sum_insured / 100000).toFixed(0)} Lakhs
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Co-Payment</span>
            <span className="text-sm font-bold text-slate-800">
              {plan.co_pay === 0 ? 'Zero Co-Pay' : `${plan.co_pay}%`}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Waiting Period</span>
            <span className="text-sm font-bold text-slate-800">
              {plan.waiting_period} Months
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Network Hospitals</span>
            <span className="text-sm font-bold text-slate-800">
              {plan.network_hospital_count.toLocaleString()}+
            </span>
          </div>
        </div>

        {/* Why Recommended */}
        <div className="space-y-2 mb-4">
          <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
            Why Recommended For You:
          </span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {item.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Important Limitations / Caveats */}
        {item.limitations.length > 0 && (
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900 mb-4">
            <span className="font-semibold block mb-1 flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Important Limitations & Moratoriums:
            </span>
            <ul className="space-y-1 text-[11px] text-amber-800/90 pl-5 list-disc">
              {item.limitations.map((limit, idx) => (
                <li key={idx}>{limit}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-3">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Room Rent Conditions:</span>
              <p className="text-slate-600">{plan.room_rent_limit}</p>
            </div>

            {plan.key_features && plan.key_features.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Key Policy Features:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  {plan.key_features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan.exclusions && plan.exclusions.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Key Exclusions:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  {plan.exclusions.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-healthcare-600 hover:text-healthcare-700 font-medium flex items-center gap-1 transition"
          >
            {expanded ? (
              <>
                Less Details <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                More Plan Details <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {onCompareToggle && (
            <button
              onClick={() => onCompareToggle(plan.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                isCompared
                  ? 'bg-healthcare-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isCompared ? 'Added to Compare' : '+ Compare Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
