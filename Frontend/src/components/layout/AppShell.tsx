// Frontend/src/components/layout/AppShell.tsx
import React from 'react';
import Sidebar from '../Sidebar';
import Topbar from './Topbar';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Info } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isCollapsed } = useSidebar();
  const { isDemoMode, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Topbar navigation & controls */}
        <Topbar />

        {/* Demo Mode Notification Banner */}
        {isDemoMode && user && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 sm:px-6 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <span>
                <strong>Simulated Exploration Mode:</strong> You are browsing as <strong>{user.name}</strong> ({user.role.replace('_', ' ')}). State changes are stored in session memory and do not affect live systems.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Info size={12} />
              <span>Phase 4 Architecture Baseline</span>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="app-shell-content flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
