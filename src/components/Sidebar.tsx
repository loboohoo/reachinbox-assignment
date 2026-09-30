import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Clock, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  LogOut,
  MessageSquareShare
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) => {
  const { user, scheduledEmails, sentEmails, slackStatus, logout, disconnectSlack } = useApp();

  const displayName = user?.name || 'Oliver Brown';
  const displayEmail = user?.email || 'oliver.brown@domain.io';
  const displayAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  const navItems = [
    {
      id: 'scheduled',
      label: 'Scheduled',
      path: '/scheduled',
      icon: Clock,
      badge: scheduledEmails.length,
    },
    {
      id: 'sent',
      label: 'Sent',
      path: '/sent',
      icon: Send,
      badge: sentEmails.length,
    },
  ];

  const handleSlackConnect = () => {
    window.location.href = api.slack.connectUrl;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container Shell (Figma Specs: 260px Width) */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 ease-in-out font-sans',
          isCollapsed ? 'w-20' : 'w-[260px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#F3F4F6]">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-2xl tracking-tighter text-[#111827] font-mono">
              ONB
            </span>
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Profile Card Section */}
        <div className="pt-5 px-4 pb-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-[#F1F5F9] transition-colors cursor-pointer group">
              <div className="flex items-center space-x-2.5 min-w-0">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-[#CBD5E1] shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[#111827] truncate">{displayName}</span>
                  <span className="text-[11px] text-[#6B7280] truncate">{displayEmail}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-2">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-[#CBD5E1]"
                title={`${displayName} (${displayEmail})`}
              />
            </div>
          )}
        </div>

        {/* Primary Action Button: Compose Button */}
        <div className="px-4 py-2">
          <NavLink
            to="/compose"
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center gap-2 w-full py-2 px-4 rounded-full font-semibold text-xs transition-all duration-200 border cursor-pointer',
                isActive
                  ? 'bg-[#00A859] text-white border-[#00A859] shadow-xs'
                  : 'btn-outline-green'
              )
            }
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Compose</span>}
          </NavLink>
        </div>

        {/* CORE Section Heading */}
        {!isCollapsed && (
          <div className="px-5 pt-4 pb-1">
            <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase">
              CORE
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-[#E6F4EA] text-[#00A859] font-semibold'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  )
                }
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <IconComponent className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && (
                  <span className="text-[11px] font-normal text-[#9CA3AF]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Slack Integration Section */}
          <div className="pt-3">
            {!isCollapsed && (
              <div className="px-2 pb-1">
                <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase">
                  INTEGRATIONS
                </span>
              </div>
            )}
            {!isCollapsed ? (
              slackStatus.isConnected ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-emerald-800 font-medium truncate">
                      {slackStatus.teamName || 'Slack Connected'}
                    </span>
                  </div>
                  <button
                    onClick={disconnectSlack}
                    className="text-[10px] text-emerald-700 hover:text-red-600 underline font-semibold ml-1 cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSlackConnect}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquareShare className="w-4 h-4 text-purple-600" />
                    <span>Connect Slack</span>
                  </div>
                </button>
              )
            ) : (
              <button
                onClick={handleSlackConnect}
                className="w-full flex justify-center p-2 rounded-xl text-purple-600 hover:bg-purple-50"
                title={slackStatus.isConnected ? 'Slack Connected' : 'Connect Slack'}
              >
                <MessageSquareShare className="w-4 h-4" />
              </button>
            )}
          </div>
        </nav>

        {/* Logout Control at bottom */}
        <div className="p-3 border-t border-[#F3F4F6]">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
