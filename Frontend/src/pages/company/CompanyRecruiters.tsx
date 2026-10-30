// Frontend/src/pages/company/CompanyRecruiters.tsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const mockDemoRecruiters = [
  { id: 301, name: 'Rachel Green', email: 'rachel@nexus.io', company_role: 'recruiter', active_jobs_count: 5 },
  { id: 302, name: 'Marcus Vance', email: 'marcus@nexus.io', company_role: 'recruiter', active_jobs_count: 7 },
  { id: 303, name: 'Elena Rostova', email: 'elena@nexus.io', company_role: 'recruiter', active_jobs_count: 2 }
];

export default function CompanyRecruiters() {
  const { isDemoMode } = useAuth();
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  const loadRecruiters = async () => {
    if (isDemoMode) {
      setRecruiters(mockDemoRecruiters);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/companies/recruiters');
      if (res && res.success && Array.isArray(res.recruiters)) {
        setRecruiters(res.recruiters);
      } else {
        setRecruiters([]);
      }
    } catch (err) {
      console.warn('Failed to load company recruiters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecruiters();
  }, [isDemoMode]);

  const handleAddRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecruiterEmail) return;
    setFeedback(null);

    if (isDemoMode) {
      setRecruiters(prev => [
        ...prev,
        { id: Date.now(), name: 'Demo Recruiter', email: newRecruiterEmail, company_role: 'recruiter', active_jobs_count: 0 }
      ]);
      setNewRecruiterEmail('');
      setFeedback({ type: 'success', text: '(Demo Exploration) Recruiter added to browser roster.' });
      return;
    }

    try {
      setIsAdding(true);
      const res = await api.post('/companies/recruiters', { email: newRecruiterEmail });
      if (res && res.success) {
        setFeedback({ type: 'success', text: 'Recruiter added to company membership successfully!' });
        setNewRecruiterEmail('');
        await loadRecruiters();
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Failed to add recruiter' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error adding recruiter' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRecruiter = async (userId: number) => {
    if (isDemoMode) {
      setRecruiters(prev => prev.filter(r => r.id !== userId));
      setFeedback({ type: 'success', text: '(Demo Exploration) Recruiter removed.' });
      return;
    }

    try {
      const res = await api.delete(`/companies/recruiters/${userId}`);
      if (res && res.success) {
        setFeedback({ type: 'success', text: 'Recruiter removed from company membership.' });
        await loadRecruiters();
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Failed to remove recruiter' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error removing recruiter' });
    }
  };

  const filteredRecruiters = recruiters.filter(r =>
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg">
              <Users size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Corporate Recruiting Team
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Authorized recruiters permitted to post requisitions and evaluate candidate matches on behalf of your enterprise.
          </p>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing simulated recruiting team members. Authenticated recruiters are retrieved from PostgreSQL company memberships.
          </span>
        </div>
      )}

      {feedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Add Recruiter Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <UserPlus size={16} className="text-purple-600" />
          <span>Authorize Existing Recruiter to Company</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Enter the registered email of a recruiter account to grant them company requisition rights.
        </p>

        <form onSubmit={handleAddRecruiter} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="recruiter.name@company.com"
            value={newRecruiterEmail}
            onChange={(e) => setNewRecruiterEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0"
          >
            {isAdding ? 'Authorizing...' : 'Add Recruiter'}
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search recruiters by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Recruiters List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecruiters.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-base">
                  {r.name.charAt(0)}
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                  {r.company_role || 'Recruiter'}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {r.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Mail size={12} />
                <span>{r.email}</span>
              </p>

              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Active Requisitions
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  {r.active_jobs_count ?? 0} Jobs
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">
                UID #{r.id}
              </span>
              <button
                onClick={() => handleRemoveRecruiter(r.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRecruiters.length === 0 && !loading && (
        <div className="text-center py-12 text-sm text-gray-500">
          No recruiters found matching your search.
        </div>
      )}
    </div>
  );
}
