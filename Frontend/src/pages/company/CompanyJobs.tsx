// Frontend/src/pages/company/CompanyJobs.tsx
import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const mockDemoCompanyJobs = [
  {
    id: 401,
    title: 'Senior ML Infrastructure Engineer',
    recruiter_name: 'Rachel Green',
    recruiter_email: 'rachel@nexus.io',
    location: 'San Francisco, CA / Remote',
    experience_min: 4,
    experience_max: 8,
    status: 'open',
    created_at: '2026-10-18T10:00:00Z',
    parsed_json: { skills: ['PyTorch', 'Kubernetes', 'Docker', 'MLOps'] }
  },
  {
    id: 402,
    title: 'Staff Security Engineer (Zero-Trust)',
    recruiter_name: 'Marcus Vance',
    recruiter_email: 'marcus@nexus.io',
    location: 'Austin, TX',
    experience_min: 5,
    experience_max: 10,
    status: 'open',
    created_at: '2026-10-22T14:00:00Z',
    parsed_json: { skills: ['Go', 'Cryptography', 'Kubernetes', 'OAuth'] }
  }
];

export default function CompanyJobs() {
  const { isDemoMode } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setJobs(mockDemoCompanyJobs);
      return;
    }

    async function loadJobs() {
      try {
        setLoading(true);
        const res = await api.get('/companies/jobs');
        if (res && res.success && Array.isArray(res.jobs)) {
          setJobs(res.jobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.warn('Failed to load company jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [isDemoMode]);

  const filteredJobs = jobs.filter(j =>
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.recruiter_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
              <Briefcase size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Corporate Job Requisitions
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enterprise overview of all open and fulfilled hiring requisitions published by your recruitment team.
          </p>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing simulated corporate requisitions. Live jobs are scoped to your company in PostgreSQL.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search company requisitions by title, owner recruiter, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((j) => {
          let skills: string[] = [];
          if (Array.isArray(j.skills)) {
            skills = j.skills;
          } else if (j.parsed_json?.skills) {
            skills = j.parsed_json.skills;
          } else if (Array.isArray(j.required_skills)) {
            skills = j.required_skills;
          }

          return (
            <div
              key={j.id}
              className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {j.title}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    j.status === 'open'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {j.status || 'Active'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    <span>{j.location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={13} />
                    <span>{j.experience_min ?? 0}-{j.experience_max ?? 5} yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>{j.created_at ? new Date(j.created_at).toLocaleDateString() : 'Active'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 mb-4 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium block">
                    Owner Recruiter:
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {j.recruiter_name || 'Assigned Recruiter'} ({j.recruiter_email || 'recruiter@company.com'})
                  </span>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/60"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">
                  REQ-ID #{j.id}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  PostgreSQL Persisted
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="text-center py-12 text-sm text-gray-500">
          No corporate job requisitions found.
        </div>
      )}
    </div>
  );
}
