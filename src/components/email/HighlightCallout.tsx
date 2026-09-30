import React from 'react';
import { Zap } from 'lucide-react';

interface HighlightCalloutProps {
  title: string;
  description: string;
}

export const HighlightCallout: React.FC<HighlightCalloutProps> = ({
  title,
  description,
}) => {
  return (
    <div className="bg-[#FEF9C3] border border-[#FDE047] rounded-xl p-4 space-y-1.5 text-slate-900 my-4 shadow-2xs">
      <div className="flex items-center gap-1.5 font-bold text-xs">
        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>{title}</span>
        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      </div>
      <p className="text-xs font-medium text-slate-800 pl-5">
        {description}
      </p>
    </div>
  );
};
