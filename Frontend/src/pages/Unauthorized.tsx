// Frontend/src/pages/Unauthorized.tsx
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS, getRoleDashboardPath } from '../types/roles';

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const currentRole = user?.role;
  const userDashboard = currentRole ? getRoleDashboardPath(currentRole) : '/login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-400">
            You do not possess the required RBAC permissions to access this workspace module.
          </p>
        </div>

        {user && currentRole && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 text-left space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500">Active Identity</div>
            <div className="font-semibold text-white">{user.name} ({user.email})</div>
            <div className="text-slate-400">Role: <span className="text-blue-400 font-medium">{ROLE_LABELS[currentRole]}</span></div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to={userDashboard}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Return to My Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
