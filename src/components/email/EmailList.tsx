import React from 'react';
import { Clock, Inbox } from 'lucide-react';
import { EmailRow } from './EmailRow';
import type { Email } from '../../types';

interface EmailListProps {
  emails: Email[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  isLoading = false,
  emptyMessage = 'No scheduled emails found.',
}) => {
  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="flex items-center justify-between py-3.5 px-4 animate-pulse">
            <div className="w-32 h-4 bg-slate-200 rounded-md" />
            <div className="w-28 h-5 bg-amber-100 rounded-full mx-3" />
            <div className="flex-1 h-4 bg-slate-100 rounded-md mx-3" />
            <div className="w-4 h-4 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (emails.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-xs text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // Normal Populated State
  return (
    <div className="divide-y divide-slate-100">
      {emails.map((email) => (
        <EmailRow key={email.id} email={email} />
      ))}
    </div>
  );
};
