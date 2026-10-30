// Frontend/src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../types/roles';
import { getNavigationForRole } from '../config/navigation';

export default function Sidebar() {
  const location = useLocation();
  const { isOpen, closeSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const { user, logout, isDemoMode } = useAuth();
  
  if (!user) return null;

  const currentRole = user.role;
  const navItems = getNavigationForRole(currentRole);

  const getRoleIcon = () => {
    switch (currentRole) {
      case 'student':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'recruiter':
        return <Briefcase className="h-4 w-4 text-purple-500" />;
      case 'super_admin':
        return <Shield className="h-4 w-4 text-emerald-500" />;
      case 'college_admin':
      case 'faculty':
      case 'company_admin':
        return <Building className="h-4 w-4 text-indigo-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const isActive = (path: string) => {
    if (path === '/student/dashboard' || path === '/recruiter/dashboard' || path === '/admin') {
      return location.pathname === path || (path === '/student/dashboard' && location.pathname === '/candidate/dashboard');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-800
          transition-all duration-300 z-50 flex flex-col justify-between
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
          w-[260px]
        `}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/80 dark:border-gray-800">
            <Link 
              to="/" 
              className={`flex items-center gap-2.5 overflow-hidden transition-all ${isCollapsed ? 'lg:justify-center w-full' : ''}`}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                SV
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white leading-none">
                    Skill<span className="text-blue-600 dark:text-blue-400">Verse</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-0.5">
                    Intelligence OS
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop collapse toggle button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* User Role Card */}
          <div className={`p-3 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30 ${isCollapsed ? 'lg:p-2 lg:text-center' : ''}`}>
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'lg:justify-center' : ''}`}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {getRoleIcon()}
                    <span className="truncate">{ROLE_LABELS[currentRole]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Demo Mode Badge */}
            {isDemoMode && !isCollapsed && (
              <div className="mt-2 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-md px-2 py-0.5 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500 shrink-0" />
                <span className="truncate">Simulated Demo Session</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-2 py-3 overflow-y-auto max-h-[calc(100vh-220px)] space-y-1">
            <div className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 ${isCollapsed ? 'lg:hidden' : ''}`}>
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={closeSidebar}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                    ${active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                    }
                    ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                  `}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${
                      active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-gray-200/80 dark:border-gray-800">
          <button
            type="button"
            onClick={() => void logout()}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors
              ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
            `}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>{isDemoMode ? 'Exit Demo Session' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
