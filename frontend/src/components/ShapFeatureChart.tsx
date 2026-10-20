import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { Info, HelpCircle, TrendingUp, TrendingDown, Eye, SlidersHorizontal } from 'lucide-react';
import { ShapContribution } from '../types';

interface Props {
  contributions: ShapContribution[];
  plainExplanations: string[];
  className?: string;
}

export const ShapFeatureChart: React.FC<Props> = ({
  contributions,
  plainExplanations,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'plain' | 'technical'>('plain');

  // Format data for Recharts horizontal bar chart
  const chartData = contributions.slice(0, 7).map((c) => ({
    name: c.feature_name,
    value: c.shap_value,
    displayValue: c.feature_value,
    direction: c.direction,
    plain: c.plain_explanation,
  }));

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-healthcare-50 text-healthcare-700">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">Explainable AI: Why This Risk Score?</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            SHAP (SHapley Additive exPlanations) attribution attributing feature contributions to the ML model output.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('plain')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'plain'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient Summary
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'technical'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical SHAP Chart
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'plain' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contributions.slice(0, 4).map((c) => {
                const isIncrease = c.direction === 'increases_risk';
                return (
                  <div
                    key={c.feature_name}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                      isIncrease
                        ? 'bg-rose-50/50 border-rose-100 text-rose-950'
                        : 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg text-white flex-shrink-0 mt-0.5 ${
                        isIncrease ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    >
                      {isIncrease ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{c.feature_name}</span>
                        <span className="text-xs bg-white/80 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                          {c.feature_value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {c.plain_explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Natural language summary box */}
            {plainExplanations.length > 0 && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-healthcare-600" />
                  Key Clinical Observations
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {plainExplanations.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-healthcare-500 mt-1.5 flex-shrink-0" />
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span>Feature Impact on Risk Probability: <span className="text-rose-600 font-medium">&#9646; Increases Risk</span> &nbsp;|&nbsp; <span className="text-emerald-600 font-medium">&#9646; Decreases / Protective</span></span>
              <span>Base attribution (SHAP $\phi_i$)</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-xs space-y-1">
                            <p className="font-semibold text-healthcare-300">{data.name}</p>
                            <p className="text-slate-300">Entered Value: <span className="font-mono text-white">{data.displayValue}</span></p>
                            <p className="text-slate-300">SHAP Value: <span className="font-mono text-white">{data.value.toFixed(4)}</span></p>
                            <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-700">{data.plain}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.value > 0 ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Positive values push the model toward a higher risk classification; negative values push toward a lower risk classification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
