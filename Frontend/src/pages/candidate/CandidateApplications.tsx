// Frontend/src/pages/candidate/CandidateApplications.tsx
import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Briefcase, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const mockDemoApplications = [
  {
    id: 1,
    job_title: 'Senior Frontend Developer (React/TS)',
    company_name: 'TechCorp Enterprise',
    status: 'interviewing',
    created_at: '2026-10-15T10:00:00Z',
    job_location: 'San Francisco, CA / Remote'
  },
  {
    id: 2,
    job_title: 'Cloud Infrastructure & SRE Engineer',
    company_name: 'DataSystems Cloud',
    status: 'applied',
    created_at: '2026-10-20T14:30:00Z',
    job_location: 'Remote'
  },
  {
    id: 3,
    job_title: 'Full Stack Engineer (Node/Python)',
    company_name: 'Nexus Cybernetics',
    status: 'offered',
    created_at: '2026-10-05T09:15:00Z',
    job_location: 'New York, NY'
  }
];

export default function CandidateApplications() {
  const { isDemoMode } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setApplications(mockDemoApplications);
      return;
    }

    async function loadApplications() {
      try {
        setLoading(true);
        const res = await api.get('/candidates/me/applications');
        if (res && res.success && Array.isArray(res.applications)) {
          setApplications(res.applications);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.warn('Failed to load submitted applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, [isDemoMode]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Offer Extended</span>
          </span>
        );
      case 'interviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Clock size={13} className="text-purple-600" />
            <span>Interview Scheduled</span>
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock size={13} className="text-blue-600" />
            <span>Under Recruiter Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle size={13} className="text-rose-600" />
            <span>Not Selected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock size={13} className="text-amber-600" />
            <span>Application Submitted</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Job Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track status, interview stages, and recruiter feedback for positions you have applied to.
          </p>
        </div>
        <Link
          to="/student/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all self-start md:self-auto"
        >
          <Briefcase size={14} />
          <span>Browse Open Requisitions</span>
        </Link>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing simulated application lifecycle states. Authenticated applications are retrieved from the PostgreSQL applications table.
          </span>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading submitted applications...</div>
        ) : applications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/80">
            {applications.map((app) => (
              <div key={app.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/80 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                      {app.job_title}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} />
                      <span>{app.company_name || 'Verified Partner Organization'}</span>
                    </div>
                    {app.job_location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        <span>{app.job_location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs text-gray-400 font-mono">
                    APP-REF #{app.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No job applications submitted yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Explore available job requisitions in the platform and submit your verified skills to recruiters.
            </p>
            <Link
              to="/student/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors"
            >
              <span>Explore Available Jobs</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
