import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md">
        The route you are looking for does not exist or has been moved in the ReachInbox workspace setup.
      </p>

      <Link
        to="/scheduled"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
      >
        <Home className="w-4 h-4" /> Return to Scheduled Emails
      </Link>
    </div>
  );
};
