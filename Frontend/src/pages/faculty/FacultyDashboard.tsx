// Frontend/src/pages/faculty/FacultyDashboard.tsx
import { useEffect, useState } from 'react';
import { 
  Users, 
  Award, 
  BookOpen, 
  TrendingUp, 
  FileCheck,
  Database,
  Sparkles,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function FacultyDashboard() {
  const { user, isDemoMode } = useAuth();
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (isDemoMode) return;
    async function loadFacultyData() {
      try {
        const [studentsRes, statsRes, analyticsRes] = await Promise.allSettled([
          api.get('/faculty/students'),
          api.get('/faculty/stats'),
          api.get('/analytics/faculty')
        ]);
        if (studentsRes.status === 'fulfilled') setAssignedStudents(studentsRes.value.students || []);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          setAnalytics(analyticsRes.value);
        }
      } catch (err) {
        console.warn('Failed to load faculty mentee data:', err);
      }
    }
    loadFacultyData();
  }, [isDemoMode]);

  const metrics = [
    { 
      label: 'Assigned Mentee Students', 
      value: isDemoMode ? '42' : String(analytics?.assigned_mentees_count ?? stats?.assigned_students_count ?? assignedStudents.length), 
      change: isDemoMode ? 'Across 2 Cohorts' : 'PostgreSQL Verified', 
      icon: Users, 
      color: 'from-blue-600 to-indigo-600' 
    },
    { 
      label: 'Pending Evidence Reviews', 
      value: isDemoMode ? '18' : String(analytics?.pending_reviews_count ?? 0), 
      change: 'Awaiting Endorsement', 
      icon: Award, 
      color: 'from-amber-600 to-orange-600' 
    },
    { 
      label: 'Decisions Logged', 
      value: isDemoMode ? '39' : `${analytics?.review_decisions?.total_reviewed ?? 0}`, 
      change: `${analytics?.review_decisions?.approved ?? 0} approved, ${analytics?.review_decisions?.rejected ?? 0} rejected`, 
      icon: FileCheck, 
      color: 'from-emerald-600 to-teal-600' 
    },
    { 
      label: 'Mentee Evidence Coverage', 
      value: isDemoMode ? '84.6%' : `${analytics?.mentee_metrics?.evidence_coverage_pct ?? 0}%`, 
      change: `${analytics?.mentee_metrics?.assessment_coverage_pct ?? 0}% benchmarked`, 
      icon: TrendingUp, 
      color: 'from-purple-600 to-indigo-600' 
    }
  ];

  const recentSubmissions = isDemoMode ? [
    { id: 'sub-1', student: 'Maya Lin', project: 'Distributed Raft Consensus Protocol', course: 'CS301', submitted: '25m ago', status: 'Needs Review' },
    { id: 'sub-2', student: 'Alex Chen', project: 'Vector Search Index with FAISS & FastAPI', course: 'ML204', submitted: '2h ago', status: 'Auto-Passed 94%' },
    { id: 'sub-3', student: 'Rohan Sharma', project: 'Zero-Knowledge Auth Microservice', course: 'CS301', submitted: '5h ago', status: 'Needs Review' },
    { id: 'sub-4', student: 'Chloe Bennett', project: 'Real-time WebSocket Chat with Redis', course: 'CS301', submitted: 'Yesterday', status: 'Approved' }
  ] : assignedStudents.map((s, idx) => ({
    id: `student-${s.user_id || idx}`,
    student: s.name,
    project: s.headline || 'Full-Stack Candidate Project',
    course: 'CS-DEPT',
    submitted: s.assigned_at ? new Date(s.assigned_at).toLocaleDateString() : 'Active',
    status: s.mentorship_status === 'active' ? 'Assigned' : 'Review'
  }));

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs mb-2">
            <BookOpen size={12} className="text-teal-300" />
            <span>Academic Mentorship Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Prof. Faculty Advisor'}
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Department of Distributed Systems & Cloud Computing. Authenticated mentorship roster loaded from PostgreSQL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/faculty/students"
            className="px-4 py-2 bg-white text-teal-900 hover:bg-gray-100 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FileCheck size={14} />
            <span>Mentee Roster ({assignedStudents.length})</span>
          </Link>
        </div>
      </div>

      {/* Demo Honesty Banner */}
      {isDemoMode ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-600 shrink-0" />
          <span>
            <strong>Mentorship Demonstration Model:</strong> Code submissions, review workflows, and mentee mastery levels reflect demonstration presets.
          </span>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Database size={14} className="text-emerald-600 shrink-0" />
          <span>
            <strong>PostgreSQL Mentorship Active:</strong> Real assigned mentees loaded from PostgreSQL. Unauthorized students outside your roster are strictly blocked.
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

      {/* Assigned Mentees Table */}
      <div className="bg-white dark:bg-gray-800/70 rounded-xl p-6 border border-gray-200/80 dark:border-gray-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Assigned Mentee Student Submissions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Students assigned to your academic advisory group in the institutional registry
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Specialization / Project</th>
                <th className="px-4 py-3 font-semibold">Course Code</th>
                <th className="px-4 py-3 font-semibold">Assignment Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentSubmissions.map((sub, i) => (
                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                  <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">{sub.student}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{sub.project}</td>
                  <td className="px-4 py-3.5 text-gray-500">{sub.course}</td>
                  <td className="px-4 py-3.5 text-gray-400">{sub.submitted}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mentee Skill Intelligence & Evidence Progress */}
      <div className="bg-white dark:bg-gray-800/70 rounded-xl p-6 border border-gray-200/80 dark:border-gray-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-teal-600 dark:text-teal-400" size={20} />
              Mentee Evidence & Assessment Competency
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Authoritative PostgreSQL evidence status for each student in your advisory group
            </p>
          </div>
          <Link
            to="/faculty/students"
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review Evidence ({analytics?.pending_reviews_count ?? 0})</span>
          </Link>
        </div>

        {analytics?.mentees_summary && analytics.mentees_summary.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student Candidate</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Verified Evidence</th>
                  <th className="px-4 py-3 font-semibold">Passed Benchmarks</th>
                  <th className="px-4 py-3 font-semibold">Pending Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {analytics.mentees_summary.map((m: any) => (
                  <tr key={m.student_user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> {m.verified_evidence_count} verified
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                        <Award size={12} /> {m.passed_assessments_count} passed
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.pending_reviews_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          <Clock size={10} /> {m.pending_reviews_count} pending
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">All Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            No mentees currently assigned to your advisory group in PostgreSQL.
          </div>
        )}
      </div>
    </div>
  );
}
