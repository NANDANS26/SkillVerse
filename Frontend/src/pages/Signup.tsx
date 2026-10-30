// Frontend/src/pages/Signup.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Briefcase, 
  GraduationCap, 
    ShieldCheck, 
  Check, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, getRoleDashboardPath } from '../types/roles';

export default function Signup() {
  const [step, setStep] = useState<'form' | 'role'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState('');

  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setStep('role');
  };

  const handleRoleSelectAndRegister = async (role: 'student' | 'recruiter') => {
    setSelectedRole(role);
    setError('');

    const result = await signup(name, email, password, role);
    if (result.success && result.user) {
      navigate(getRoleDashboardPath(result.user.role), { replace: true });
    } else {
      setError(result.message || 'Registration failed. This email may already be in use.');
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">
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
            Create your SkillVerse account
          </h1>
          <p className="text-xs text-slate-400">
            {step === 'form' 
              ? 'Join the intelligent skill verification and matching ecosystem'
              : 'Choose your account type to customize your workspace'
            }
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

          {step === 'form' ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <span>Continue to Role Selection</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 font-semibold mb-2">
                Select your primary account role:
              </div>

              {/* Public Role Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRoleSelectAndRegister('student')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                    selectedRole === 'student'
                      ? 'bg-blue-950/40 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <GraduationCap size={20} />
                    </div>
                    {selectedRole === 'student' && <Check size={16} className="text-blue-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Student / Candidate</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Build verified Skill DNA, take coding benchmarks, and discover AI job matches.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRoleSelectAndRegister('recruiter')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                    selectedRole === 'recruiter'
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Briefcase size={20} />
                    </div>
                    {selectedRole === 'recruiter' && <Check size={16} className="text-purple-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Recruiter / Talent Partner</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Post requisitions, query FAISS vector talent pool, and coordinate interviews.
                    </div>
                  </div>
                </button>
              </div>

              {/* Administrative Access Explanatory Notice */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-300">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <span>Administrative & Institutional Portals</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Looking for <strong>College Admin</strong>, <strong>Faculty</strong>, <strong>Company Admin</strong>, or <strong>Super Admin</strong> access? Institutional accounts require verified domain identity and are provisioned via administrative invitation.
                </p>
                <div className="text-[11px] text-slate-500">
                  To explore these roles immediately in simulated environment, click{' '}
                  <Link to="/login" className="text-amber-400 hover:underline font-semibold">
                    Explore in Demo Mode
                  </Link>.
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to details
                </button>
                <span className="text-[11px] text-slate-500">
                  Click a role card above to complete registration
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
