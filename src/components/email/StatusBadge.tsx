import React from 'react';
import { Clock, Send, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: 'scheduled' | 'sent' | 'draft';
  scheduledAt?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  scheduledAt,
  className,
}) => {
  if (status === 'scheduled') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]/50 shrink-0',
          className
        )}
      >
        <Clock className="w-3 h-3" />
        <span>{scheduledAt || 'Scheduled'}</span>
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0',
          className
        )}
      >
        <Send className="w-3 h-3" />
        <span>Sent</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 shrink-0',
        className
      )}
    >
      <FileText className="w-3 h-3" />
      <span>Draft</span>
    </span>
  );
};
