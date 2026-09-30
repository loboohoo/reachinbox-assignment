import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import type { Email } from '../types';

interface EmailCardProps {
  email: Email;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email }) => {
  const isScheduled = email.status === 'scheduled';
  const [isStarred, setIsStarred] = useState(false);

  return (
    <div className="group flex items-center justify-between py-3 px-4 hover:bg-slate-50 border-b border-slate-100 transition-colors text-xs font-sans">
      {/* Left: Recipient Name */}
      <div className="w-36 shrink-0 font-semibold text-slate-900 truncate">
        To: {email.recipientEmail}
      </div>

      {/* Middle Status Pill Tag */}
      <div className="mx-3 shrink-0">
        {isScheduled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]/50">
            <Clock className="w-3 h-3" />
            {email.scheduledAt || 'Scheduled'}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Sent
          </span>
        )}
      </div>

      {/* Center: Subject & Snippet */}
      <Link
        to={`/email/${email.id}`}
        className="flex-1 min-w-0 mx-3 text-slate-700 hover:text-slate-900 truncate"
      >
        <span className="font-semibold text-slate-900">{email.subject}</span>
        <span className="text-slate-400 mx-1.5">-</span>
        <span className="text-slate-500 font-normal">{email.snippet}</span>
      </Link>

      {/* Far Right: Star Icon */}
      <button
        onClick={() => setIsStarred(!isStarred)}
        className="p-1 text-slate-300 hover:text-amber-400 transition-colors shrink-0"
        title="Star email"
      >
        <Star
          className={`w-4 h-4 ${
            isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
          }`}
        />
      </button>
    </div>
  );
};
