// Frontend/src/pages/company/CompanyAdminDashboard.tsx
import { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  Briefcase, 
  TrendingUp, 
  ShieldCheck, 
  UserPlus,
  Database,
  Sparkles,
  BarChart3,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function CompanyAdminDashboard() {
  const { user, isDemoMode } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (isDemoMode) return;
    async function loadCompanyData() {
      try {
        const [statsRes, jobsRes, recruitersRes, analyticsRes] = await Promise.allSettled([
          api.get('/companies/stats'),
          api.get('/companies/jobs'),
          api.get('/companies/recruiters'),
          api.get('/analytics/company')
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.jobs || []);
        if (recruitersRes.status === 'fulfilled') setRecruiters(recruitersRes.value.recruiters || []);
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          setAnalytics(analyticsRes.value);
        }
      } catch (err) {
        console.warn('Failed to load company data:', err);
      }
    }
    loadCompanyData();
  }, [isDemoMode]);

  const metrics = [
    { 
      label: 'Open Requisitions', 
      value: isDemoMode ? '14' : String(analytics?.requisitions?.open ?? stats?.open_requisitions ?? jobs.length), 
      change: `${analytics?.requisitions?.closed ?? 0} closed, ${analytics?.requisitions?.draft ?? 0} draft`, 
      icon: Briefcase, 
      color: 'from-blue-600 to-indigo-600' 
    },
    { 
      label: 'Recruiting Team', 
      value: isDemoMode ? '8' : String(analytics?.total_recruiters ?? stats?.total_recruiters ?? recruiters.length), 
      change: 'Authorized Talent Partners', 
      icon: Users, 
      color: 'from-purple-600 to-pink-600' 
    },
    { 
      label: 'Total Requisitions', 
      value: isDemoMode ? '18' : String(analytics?.requisitions?.total ?? stats?.total_requisitions ?? jobs.length), 
      change: 'Corporate Scope', 
      icon: TrendingUp, 
      color: 'from-emerald-600 to-teal-600' 
    },
    { 
      label: 'Total Applications', 
      value: isDemoMode ? '127' : String(analytics?.total_applications ?? 0), 
      change: 'Candidate Pipeline', 
      icon: ShieldCheck, 
      color: 'from-amber-600 to-orange-600' 
    }
  ];

  const requisitionSummary = isDemoMode ? [
    { id: 'req-1', title: 'Senior ML Infrastructure Engineer', department: 'Applied AI', location: 'San Francisco, CA / Remote', applicants: 38, matches: 12, status: 'Active' },
    { id: 'req-2', title: 'Lead Full Stack Architect (FastAPI/React)', department: 'Core Product', location: 'New York, NY / Hybrid', applicants: 44, matches: 16, status: 'Active' },
    { id: 'req-3', title: 'Distributed Systems & SRE Lead', department: 'Cloud Platform', location: 'Austin, TX', applicants: 26, matches: 7, status: 'Interviewing' },
    { id: 'req-4', title: 'Staff Security Engineer (Zero-Trust)', department: 'InfoSec', location: 'Remote', applicants: 19, matches: 4, status: 'Active' }
  ] : jobs.map((j, idx) => ({
    id: `req-${j.id || idx}`,
    title: j.title,
    department: 'Engineering',
    location: j.location || 'Remote',
    applicants: 1,
    matches: 1,
    status: j.status === 'open' ? 'Active' : 'Closed'
  }));

  return (
    <div className="space-y-6">
      {/* Company Executive Hero */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs mb-2">
            <Building2 size={12} className="text-blue-400" />
            <span>Enterprise Talent Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {stats?.company_name || 'Nexus Innovations'}
          </h1>
          <p className="text-blue-200 text-sm mt-1 max-w-xl">
            Logged in as {user?.name || 'Enterprise Lead'} ({stats?.industry || 'Software & AI'}). Corporate requisitions and recruiting permissions verified.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/company/jobs"
            className="px-4 py-2 bg-white text-slate-900 hover:bg-gray-100 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Briefcase size={14} />
            <span>Manage Requisitions ({jobs.length})</span>
          </Link>
          <Link
            to="/company/recruiters"
            className="px-4 py-2 bg-blue-800/80 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            <span>Hiring Team ({recruiters.length})</span>
          </Link>
        </div>
      </div>

      {/* Demo Honesty Banner */}
      {isDemoMode ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-600 shrink-0" />
          <span>
            <strong>Enterprise Demonstration Model:</strong> Requisition velocity, hiring team rosters, and interview funnels reflect demonstration fixtures.
          </span>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Database size={14} className="text-emerald-600 shrink-0" />
          <span>
            <strong>PostgreSQL Company Scope Active:</strong> Requisitions and recruiting staff scoped to {stats?.company_name || 'Nexus Innovations'}. Cross-company access is strictly denied.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800/70 rounded-xl p-5 border border-gray-200/80 dark:border-gray-700/60 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-r ${item.color} text-white`}>
                <item.icon size={18} />
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {item.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Application Pipeline Funnel & Requisitions Status Breakdown */}
      <div className="bg-white dark:bg-gray-800/70 rounded-xl p-6 border border-gray-200/80 dark:border-gray-700/60 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
              Application Pipeline Stages & Requisition Status Breakdown
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live funnel stages (applied &rarr; reviewing &rarr; shortlisted &rarr; interviewing &rarr; offered &rarr; hired) scoped to {stats?.company_name || 'your company'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              Open: {analytics?.requisitions?.open ?? 0}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
              Closed: {analytics?.requisitions?.closed ?? 0}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
              Draft: {analytics?.requisitions?.draft ?? 0}
            </span>
          </div>
        </div>

        {/* Pipeline Stage Cards */}
        <div>
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Filter size={14} className="text-blue-500" />
            <span>Candidate Application Funnel</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {[
              { stage: 'Applied', key: 'applied', color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
              { stage: 'Reviewing', key: 'reviewing', color: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
              { stage: 'Shortlisted', key: 'shortlisted', color: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800' },
              { stage: 'Interviewing', key: 'interviewing', color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
              { stage: 'Offered', key: 'offered', color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
              { stage: 'Hired', key: 'hired', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
              { stage: 'Rejected', key: 'rejected', color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' }
            ].map((col) => {
              const count = analytics?.application_pipeline?.[col.key] ?? 0;
              return (
                <div key={col.key} className={`p-3 rounded-xl border text-center ${col.color}`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider">{col.stage}</div>
                  <div className="text-xl font-extrabold mt-1">{count}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Candidates</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-white dark:bg-gray-800/70 rounded-xl p-6 border border-gray-200/80 dark:border-gray-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Company Scoped Requisitions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active engineering requisitions managed by your authorized talent acquisition team
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Job Title</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {requisitionSummary.map((req, i) => (
                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                  <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">{req.title}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{req.department}</td>
                  <td className="px-4 py-3.5 text-gray-500">{req.location}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
