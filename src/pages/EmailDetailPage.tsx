import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Folder, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import { AttachmentCard } from '../components/email/AttachmentCard';
import { HighlightCallout } from '../components/email/HighlightCallout';
import { useApp } from '../context/AppContext';

export const EmailDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEmailById, user } = useApp();
  const [isStarred, setIsStarred] = useState(false);

  const email = id ? getEmailById(id) : undefined;

  const displayAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  if (!email) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 space-y-4 font-sans min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <h2 className="text-base font-bold text-slate-900">Email Not Found</h2>
        <p className="text-xs text-slate-500 text-center max-w-sm">
          The requested email record could not be found or has been removed.
        </p>
        <button
          onClick={() => navigate('/scheduled')}
          className="mt-2 px-4 py-2 bg-[#00A859] text-white text-xs font-semibold rounded-full hover:bg-emerald-600 transition-colors"
        >
          Back to Scheduled Emails
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 font-sans min-h-[calc(100vh-6rem)]">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Back to email list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-slate-900 truncate">
            {email.subject}
          </h1>
        </div>

        {/* Right Side Action Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Star email"
          >
            <Star
              className={`w-4 h-4 ${
                isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
              }`}
            />
          </button>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Archive"
          >
            <Folder className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <img
            src={displayAvatar}
            alt={user?.name || 'User'}
            className="w-7 h-7 rounded-full object-cover border border-slate-200 ml-1"
          />
        </div>
      </div>

      {/* Sender Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#00A859] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {email.senderName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                {email.senderName}
              </span>
              <span className="text-xs text-slate-400">
                &lt;{email.senderEmail}&gt;
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-500 cursor-pointer hover:text-slate-800">
              <span>to {email.recipientEmail}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">
          {email.sentAt || email.scheduledAt}
        </span>
      </div>

      {/* Email Body Content */}
      <div className="space-y-4 pt-2 text-xs leading-relaxed text-slate-800">
        <div className="whitespace-pre-wrap font-sans">{email.body}</div>

        {/* Yellow Highlight Banner Callout Box from Figma */}
        <HighlightCallout
          title="Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment"
          description='To explore securing your private transformation, simply reply right now with "FLY OUT FIX".'
        />

        {/* Attachments Section */}
        <div className="pt-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Attachments (2)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AttachmentCard
              fileName="Tennis_Coach_Profile.png"
              fileSize="1.2 MB"
              imageUrl="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=400&q=80"
            />
            <AttachmentCard
              fileName="Tennis_Coach_Profile2.png"
              fileSize="1.2 MB"
              imageUrl="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=400&q=80"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
