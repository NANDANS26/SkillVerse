// Frontend/src/components/layout/Topbar.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { CANONICAL_ROLES, ROLE_LABELS, UserRole, getRoleDashboardPath } from '../../types/roles';
import { MOCK_NOTIFICATIONS } from '../../data/mockFixtures';

export default function Topbar() {
  const { user, logout, isDemoMode, switchDemoRole, exitDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (demoRef.current && !demoRef.current.contains(e.target as Node)) {
        setIsDemoMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const currentRole = user.role;
  const notifications = MOCK_NOTIFICATIONS[currentRole] || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Compute breadcrumb segments
  const pathParts = location.pathname.split('/').filter(Boolean);
  const rolePrefix = pathParts[0] || '';
  const currentSection = pathParts[1] ? pathParts[1].replace(/-/g, ' ') : 'Dashboard';

  const handleRoleSwitch = (newRole: UserRole) => {
    switchDemoRole(newRole);
    setIsDemoMenuOpen(false);
    navigate(getRoleDashboardPath(newRole));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Link
            to={getRoleDashboardPath(currentRole)}
            className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors capitalize"
          >
            {ROLE_LABELS[currentRole] || rolePrefix}
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-white capitalize">
            {currentSection}
          </span>
        </nav>
      </div>

      {/* Middle: Global Search Input */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${ROLE_LABELS[currentRole]} workspace...`}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Demo Switcher, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Mode Banner / Role Switcher Pill */}
        {isDemoMode && (
          <div className="relative" ref={demoRef}>
            <button
              type="button"
              onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600/40 hover:bg-amber-500/20 transition-all"
              title="Click to switch simulated demo role"
            >
              <Sparkles size={12} className="text-amber-500" />
              <span className="hidden sm:inline">DEMO:</span>
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
              <ChevronDown size={12} />
            </button>

            {isDemoMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                  Switch Simulated Role
                </div>
                <div className="py-1">
                  {CANONICAL_ROLES.map((r) => {
                    const isSelected = r === currentRole;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleSwitch(r)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          isSelected ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <span>{ROLE_LABELS[r]}</span>
                        {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 px-2">
                  <button
                    type="button"
                    onClick={() => {
                      exitDemoMode();
                      navigate('/login');
                    }}
                    className="w-full text-center py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium"
                  >
                    Exit Demo Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Notifications ({notifications.length})
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.length === 0 ? (
                  <div className="p-4 text-xs text-center text-gray-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-600" />}
        </button>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden xl:inline text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
              {user.name}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  <ShieldCheck size={12} />
                  <span>{ROLE_LABELS[currentRole]}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to={getRoleDashboardPath(currentRole)}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <UserIcon size={14} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to={`/${currentRole === 'super_admin' ? 'admin' : currentRole === 'student' ? 'student' : currentRole.split('_')[0]}/settings`}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>Settings & Privacy</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium text-left"
                >
                  <LogOut size={14} />
                  <span>{isDemoMode ? 'Exit Demo Session' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
