import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Email } from '../../types';

interface EmailRowProps {
  email: Email;
}

export const EmailRow: React.FC<EmailRowProps> = ({ email }) => {
  const navigate = useNavigate();
  const [isStarred, setIsStarred] = useState(false);

  const handleRowClick = () => {
    navigate(`/email/${email.id}`);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
  };

  return (
    <div
      onClick={handleRowClick}
      className="group flex items-center justify-between py-3 px-4 hover:bg-slate-50 border-b border-slate-100 transition-colors text-xs font-sans cursor-pointer"
    >
      {/* Recipient */}
      <div className="w-36 shrink-0 font-semibold text-slate-900 truncate">
        To: {email.recipientEmail}
      </div>

      {/* Status Badge (Scheduled / Sent) */}
      <div className="mx-3 shrink-0">
        <StatusBadge status={email.status} scheduledAt={email.scheduledAt} />
      </div>

      {/* Subject & Preview Text */}
      <div className="flex-1 min-w-0 mx-3 text-slate-700 hover:text-slate-900 truncate flex items-center">
        <span className="font-semibold text-slate-900 truncate">{email.subject}</span>
        <span className="text-slate-400 mx-1.5 shrink-0">-</span>
        <span className="text-slate-500 font-normal truncate">{email.snippet}</span>
      </div>

      {/* Star Action Icon */}
      <button
        type="button"
        onClick={handleStarClick}
        className="p-1 text-slate-300 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
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
