import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Props {
  riskLevel: 'Low' | 'Medium' | 'High' | string;
  probability: number;
  className?: string;
}

export const RiskGauge: React.FC<Props> = ({ riskLevel, probability, className = '' }) => {
  const getBadgeStyle = () => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-500',
          barColor: 'bg-emerald-500',
          icon: ShieldCheck,
          label: 'Low Health Risk'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-500',
          barColor: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Moderate Health Risk'
        };
      case 'high':
      default:
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-500',
          barColor: 'bg-rose-500',
          icon: AlertOctagon,
          label: 'Elevated Health Risk'
        };
    }
  };

  const style = getBadgeStyle();
  const IconComponent = style.icon;

  return (
    <div className={`p-6 rounded-2xl border ${style.border} ${style.bg} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl text-white ${style.badge}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Predicted Health Risk</span>
            <h3 className={`text-xl font-bold ${style.text}`}>{style.label}</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-extrabold text-slate-900">{probability}%</span>
          <span className="text-[11px] text-slate-500 block">Estimated Probability</span>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${style.barColor}`}
            style={{ width: `${Math.min(100, Math.max(5, probability))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
          <span>0% Low</span>
          <span>35% Moderate</span>
          <span>65% High</span>
          <span>100%</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
        Based on statistical classification algorithms. Decision-support estimate only — not a clinical disease diagnosis.
      </p>
    </div>
  );
};
