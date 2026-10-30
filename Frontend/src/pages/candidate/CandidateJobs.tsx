// Frontend/src/pages/candidate/CandidateJobs.tsx
import { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api, ApiError } from '../../services/api';

const mockJobs = [
  {
    id: 1001,
    title: 'Frontend Developer (React/TS)',
    company: 'TechCorp Innovations',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$120k - $150k',
    type: 'Full-time',
    posted: '2 days ago',
    matchScore: 95,
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    description: 'Build enterprise-grade SaaS web applications with responsive user interfaces and modern state architecture.'
  },
  {
    id: 1002,
    title: 'Distributed Systems Engineer',
    company: 'DataSystems Cloud',
    location: 'Remote',
    salary: '$135k - $165k',
    type: 'Full-time',
    posted: '1 week ago',
    matchScore: 88,
    skills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
    description: 'Design and optimize scalable distributed microservices, consensus replication, and event streaming backends.'
  },
  {
    id: 1003,
    title: 'Full Stack Engineer',
    company: 'Nexus Software',
    location: 'New York, NY',
    salary: '$115k - $145k',
    type: 'Full-time',
    posted: '3 days ago',
    matchScore: 92,
    skills: ['React', 'Node.js', 'PostgreSQL', 'GraphQL'],
    description: 'Join an agile engineering team delivering mission-critical applications across cloud infrastructure.'
  }
];

export default function CandidateJobs() {
  const { isDemoMode } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string; jobId?: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setJobs(mockJobs);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.allSettled([
          api.get('/jobs'),
          api.get('/candidates/me/applications')
        ]);

        if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.jobs)) {
          setJobs(jobsRes.value.jobs);
        } else {
          setJobs([]);
        }

        if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value?.applications)) {
          const ids = appsRes.value.applications.map((a: any) => a.job_id);
          setAppliedJobIds(ids);
        }
      } catch (err) {
        console.warn('Failed to load live jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isDemoMode]);

  const handleApply = async (jobId: number) => {
    setStatusFeedback(null);
    if (isDemoMode) {
      setAppliedJobIds(prev => [...prev, jobId]);
      setStatusFeedback({
        type: 'success',
        jobId,
        text: '(Demo Exploration) Job application recorded in browser session.'
      });
      return;
    }

    try {
      setApplyingJobId(jobId);
      const res = await api.post(`/jobs/${jobId}/apply`);
      if (res && res.success) {
        setAppliedJobIds(prev => [...prev, jobId]);
        setStatusFeedback({
          type: 'success',
          jobId,
          text: 'Application submitted successfully to recruiter requisition!'
        });
      } else {
        setStatusFeedback({
          type: 'error',
          jobId,
          text: res?.message || 'Failed to submit application.'
        });
      }
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : 'Error submitting application to backend.';
      setStatusFeedback({
        type: 'error',
        jobId,
        text: errorMsg
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const titleMatch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    let skillMatch = false;
    if (Array.isArray(job.skills)) {
      skillMatch = job.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (job.parsed_json?.skills) {
      skillMatch = job.parsed_json.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return titleMatch || locationMatch || skillMatch;
  });

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Available Job Requisitions
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Browse active positions persisted in PostgreSQL and submit your verified candidate profile.
          </p>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing sample job requisitions. Live PostgreSQL jobs will be queried when operating in an authenticated student session.
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by role title, location, or required skill (e.g., Python, PostgreSQL, React)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Global Status Message */}
      {statusFeedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
          statusFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {statusFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusFeedback.text}</span>
        </div>
      )}

      {/* Job Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map(job => {
          let skills: string[] = [];
          if (Array.isArray(job.skills)) {
            skills = job.skills;
          } else if (job.parsed_json?.skills) {
            skills = job.parsed_json.skills;
          } else if (Array.isArray(job.required_skills)) {
            skills = job.required_skills;
          }

          const isApplied = appliedJobIds.includes(job.id);
          const isApplying = applyingJobId === job.id;

          return (
            <div
              key={job.id}
              className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {job.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <Building2 size={13} />
                      <span>{job.company || (isDemoMode ? 'TechCorp' : 'Verified Partner Requisition')}</span>
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {job.status === 'open' ? 'Actively Hiring' : (job.status || 'Active')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-gray-400" />
                    <span>{job.experience_min ?? 0}-{job.experience_max ?? 5} yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                  {job.raw_text || job.description || 'Job requisition details.'}
                </p>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Authoritative Requisition #{job.id}
                </span>

                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied || isApplying}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isApplied
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : isApplying
                      ? 'bg-gray-200 text-gray-500 cursor-wait'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xs'
                  }`}
                >
                  {isApplied ? 'Application Submitted ✓' : isApplying ? 'Submitting...' : 'Apply Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="text-center py-16 bg-white dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No matching job requisitions found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or check back as recruiters publish new positions to PostgreSQL.
          </p>
        </div>
      )}
    </div>
  );
}
