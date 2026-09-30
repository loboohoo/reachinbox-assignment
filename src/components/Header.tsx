import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
  onMobileMenuOpen: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuOpen, title = '' }) => {
  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center space-x-3">
        {/* Search Input Placeholder */}
        <div className="hidden sm:flex items-center relative">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00A859] w-48 transition-all"
            disabled
          />
        </div>

        {/* Notifications Icon */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00A859] rounded-full" />
        </button>
      </div>
    </header>
  );
};
