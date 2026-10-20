import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface Props {
  variant?: 'banner' | 'card' | 'inline' | 'clinical-alert';
  message?: string;
  className?: string;
}

export const DisclaimerBanner: React.FC<Props> = ({
  variant = 'banner',
  message,
  className = '',
}) => {
  if (variant === 'clinical-alert') {
    return (
      <div className={`p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-amber-900 flex items-start gap-3 shadow-sm ${className}`}>
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800">Clinical Safety Advisory</p>
          <p className="mt-0.5 text-amber-900 leading-relaxed">
            {message || "Some entered health vitals are outside standard clinical reference ranges. Please consult a qualified healthcare professional. This platform is strictly a decision-support estimate."}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-slate-500 flex items-center gap-1.5 ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor.</span>
      </p>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs leading-relaxed flex items-start gap-3 ${className}`}>
        <ShieldAlert className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 block mb-1">Important Healthcare & Insurance Scope Notice</span>
          {message || "This platform estimates health risk, expected medical costs, and recommends insurance plans based on statistical models and provided profiles. It does not provide medical diagnoses, treatment plans, or guarantees of insurance coverage or pricing."}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-center gap-2 text-center ${className}`}>
      <ShieldAlert className="w-4 h-4 text-healthcare-400 flex-shrink-0" />
      <span>
        <strong>Decision-Support Notice:</strong> Decision-support only — not a medical diagnosis or replacement for a doctor or insurance advisor.
      </span>
    </div>
  );
};
