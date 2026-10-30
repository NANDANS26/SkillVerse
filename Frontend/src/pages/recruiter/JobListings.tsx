import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MapPin, 
  Briefcase, 
  Calendar, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api, ApiError } from '../../services/api';
import { jobs as mockJobsData } from '../../data/jobs';

export type JobStatus = 'active' | 'draft' | 'closed';

export interface DisplayJob {
  id: string;
  title: string;
  company?: string;
  location: string;
  status: JobStatus;
  experience?: string;
  experience_min?: number;
  experience_max?: number;
  candidatesCount: number;
  matchesCount: number;
  created_at?: string;
  requiredSkills: string[];
}

export default function JobListings() {
  const { isDemoMode } = useAuth();

  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    // If demo mode is active, load deterministic mock jobs
    if (isDemoMode) {
      setTimeout(() => {
        const formatted: DisplayJob[] = (mockJobsData as any[]).map(j => ({
          id: String(j.id),
          title: j.title,
          company: j.company || 'TechCorp Global',
          location: j.location,
          status: (j.status as JobStatus) || 'active',
          experience: j.experience,
          candidatesCount: 14,
          matchesCount: 6,
          created_at: j.createdAt || '2026-03-01',
          requiredSkills: j.requiredSkills || ['React', 'TypeScript', 'Node.js']
        }));
        setJobs(formatted);
        setLoading(false);
      }, 300);
      return;
    }

    // Real API integration
    try {
      const res = await api.get('/jobs');
      if (res && res.success) {
        const apiJobs: DisplayJob[] = (res.jobs || []).map((j: any) => ({
          id: String(j.id),
          title: j.title,
          company: 'NovaTech Enterprises',
          location: j.location || 'Remote',
          status: (j.status === 'open' ? 'active' : j.status) || 'active',
          experience: `${j.experience_min || 0}-${j.experience_max || 5} years`,
          experience_min: j.experience_min,
          experience_max: j.experience_max,
          candidatesCount: 0,
          matchesCount: 0,
          created_at: j.created_at,
          requiredSkills: j.parsed_json?.skills || []
        }));
        setJobs(apiJobs);
      } else {
        setError(res?.message || 'Failed to retrieve job listings.');
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Error connecting to jobs service.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = jobs
    .filter(job => filter === 'all' || job.status === filter)
    .filter(job => {
      const term = searchTerm.toLowerCase();
      return (
        job.title.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.requiredSkills.some(s => s.toLowerCase().includes(term))
      );
    });

  const activeJobsCount = jobs.filter(j => j.status === 'active').length;
  const totalCandidates = jobs.reduce((acc, j) => acc + j.candidatesCount, 0);
  const totalMatches = jobs.reduce((acc, j) => acc + j.matchesCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <span>Requisition Listings</span>
            {isDemoMode && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                <Sparkles size={11} />
                Simulated Requisitions (Demo Mode)
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage your organization's open requisitions and review AI-matched candidates.
          </p>
        </div>

        <Link
          to="/recruiter/create-job"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Requisition</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requisitions', value: jobs.length },
          { label: 'Active Openings', value: activeJobsCount },
          { label: 'Candidate Pipeline', value: totalCandidates },
          { label: 'AI Matches', value: totalMatches }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/60 shadow-xs">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'draft', 'closed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, location, or skill..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadJobs}
            className="text-xs font-bold underline hover:no-underline shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Content State */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading requisitions...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-center space-y-3">
          <Briefcase size={32} className="mx-auto text-gray-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            No Requisitions Found
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm || filter !== 'all'
              ? 'No requisitions matched your current search criteria.'
              : 'You have not posted any job requisitions yet. Create a new posting to begin vector candidate discovery.'
            }
          </p>
          <Link
            to="/recruiter/create-job"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Post First Requisition</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-xl bg-white dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/60 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/recruiter/job/${job.id}`}
                    className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {job.title}
                  </Link>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    job.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : job.status === 'draft'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    <span>{job.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={13} />
                    <span>{job.experience || '2+ years'}</span>
                  </span>
                  {job.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      <span>{job.created_at.slice(0, 10)}</span>
                    </span>
                  )}
                </div>

                {job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.slice(0, 5).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-700 dark:text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="text-[11px] text-gray-400 self-center">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <Link
                  to={`/recruiter/job/${job.id}/matches`}
                  className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles size={13} />
                  <span>AI Matches</span>
                </Link>

                <Link
                  to={`/recruiter/job/${job.id}`}
                  className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Inspect
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
