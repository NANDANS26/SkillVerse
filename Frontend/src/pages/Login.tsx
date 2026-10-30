// Frontend/src/pages/Login.tsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  Sparkles, 
  Info, 
  Github, 
  X,
  GraduationCap,
  Building2,
  Users,
  Briefcase,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CANONICAL_ROLES, ROLE_LABELS, UserRole, getRoleDashboardPath } from '../types/roles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [oauthModalOpen, setOauthModalOpen] = useState<string | null>(null);

  const { login, isLoading, startDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your registered email and password.');
      return;
    }

    const result = await login(email, password);
    if (result.success && result.user) {
      const destination = from || getRoleDashboardPath(result.user.role);
      navigate(destination, { replace: true });
    } else {
      setError(result.message || 'Invalid credentials or authentication failed.');
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    startDemoMode(role);
    navigate(getRoleDashboardPath(role));
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'student': return <GraduationCap size={16} className="text-blue-500" />;
      case 'college_admin': return <Building2 size={16} className="text-indigo-500" />;
      case 'faculty': return <Users size={16} className="text-teal-500" />;
      case 'company_admin': return <Building2 size={16} className="text-purple-500" />;
      case 'recruiter': return <Briefcase size={16} className="text-pink-500" />;
      case 'super_admin': return <Shield size={16} className="text-emerald-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/20">
              SV
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Skill<span className="text-blue-500">Verse</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sign in to Skill Intelligence OS
          </h1>
          <p className="text-xs text-slate-400">
            Access your multi-tenant workspace across student, campus, or corporate platforms
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Real Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work or Academic Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.edu or domain.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Account Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Authenticate to Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Informational OAuth Social Logins */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Or Single Sign-On
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOauthModalOpen('Google Workspace')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => setOauthModalOpen('GitHub Enterprise')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 transition-colors"
              >
                <Github size={15} />
                <span>GitHub</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Mode Persona Selector */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles size={13} />
                Simulated Demo Mode (No DB Needed)
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-mono">Instant Access</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Instantly explore the full six-role application shell with verified preloaded fixtures:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CANONICAL_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleQuickDemoLogin(r)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all hover:border-slate-700 group"
                >
                  {getRoleIcon(r)}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">
                      {ROLE_LABELS[r]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/auth/signup" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>

      {/* Informative OAuth Modal */}
      {oauthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Info size={16} className="text-blue-400" />
                <span>{oauthModalOpen} SSO Notice</span>
              </div>
              <button
                type="button"
                onClick={() => setOauthModalOpen(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enterprise single sign-on via <strong>{oauthModalOpen}</strong> is scheduled for rollout in Phase 5 SAML 2.0 / OIDC integrations.
            </p>
            <p className="text-xs text-slate-400">
              For local evaluation, please use email authentication or the <strong>Simulated Demo Mode</strong> buttons below.
            </p>

            <button
              type="button"
              onClick={() => setOauthModalOpen(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
