import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useSidebar } from '../hooks/useSidebar';
import { cn } from '../utils/cn';

export const MainLayout: React.FC = () => {
  const { isOpen, isCollapsed, toggleOpen, toggleCollapse, close } = useSidebar();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col font-sans antialiased">
      {/* Fixed 260px Width Sidebar Shell */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isOpen}
        onMobileClose={close}
      />

      {/* Main Content Area: 1180px Fill Width (1440px - 260px) */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-[260px]'
        )}
      >
        {/* Header Shell */}
        <Header onMobileMenuOpen={toggleOpen} />

        {/* Main Content Canvas Container (1180px Max Width) */}
        <main className="flex-1 p-4 sm:p-5 max-w-[1180px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
