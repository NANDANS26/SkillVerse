// Frontend/src/pages/candidate/CandidateDashboard.tsx
import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Briefcase, 
  Target, 
  Star, 
  FileText, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Brain,
  Award,
  BarChart3,
  Activity,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import SkillRadar from '../../components/SkillRadar';
import { candidates } from '../../data/candidates';

export default function CandidateDashboard() {
  const { user, isDemoMode } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    async function loadStudentData() {
      try {
        setLoading(true);
        const [profRes, jobsRes, analyticsRes] = await Promise.allSettled([
          api.get('/candidates/me'),
          api.get('/jobs'),
          api.get('/analytics/student')
        ]);

        if (profRes.status === 'fulfilled' && profRes.value?.candidate) {
          setProfile(profRes.value.candidate);
        }
        if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.jobs)) {
          setOpenJobs(jobsRes.value.jobs);
        }
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          setAnalytics(analyticsRes.value);
        }
      } catch (err) {
        console.warn('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [isDemoMode]);

  // Demo fallback
  const demoCandidate = candidates[0];

  // Calculate completeness based on authoritative fields
  const calculateCompleteness = (p: any): number => {
    if (!p) return 0;
    let score = 0;
    if (p.full_name) score += 15;
    if (p.email) score += 15;
    if (p.headline) score += 20;
    if (p.experience_years !== undefined && p.experience_years !== null) score += 15;
    if (Array.isArray(p.skill_json) && p.skill_json.length > 0) score += 20;
    if (p.resume_text && p.resume_text.trim().length > 20) score += 15;
    return Math.min(score, 100);
  };

  const completeness = isDemoMode ? 95 : calculateCompleteness(profile);

  // Parse skills
  let studentSkills: string[] = [];
  if (isDemoMode) {
    studentSkills = Object.keys(demoCandidate.skills);
  } else if (profile?.skill_json) {
    studentSkills = Array.isArray(profile.skill_json)
      ? profile.skill_json
      : typeof profile.skill_json === 'string'
      ? JSON.parse(profile.skill_json)
      : [];
  }

  // Indexing status indicators
  const getIndexingPill = () => {
    if (isDemoMode) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <Sparkles size={12} />
          <span>Demo Benchmark Model</span>
        </span>
      );
    }

    if (loading) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <Clock size={12} className="animate-spin" />
          <span>Checking Indexing Status...</span>
        </span>
      );
    }

    if (!profile) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <Clock size={12} />
          <span>Profile Incomplete</span>
        </span>
      );
    }

    switch (profile.indexing_status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Profile Indexed & AI-Searchable</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock size={12} className="text-amber-600 animate-spin" />
            <span>Vector Indexing in Progress</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle size={12} className="text-rose-600" />
            <span>Indexing Deferred (Retrying)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock size={12} />
            <span>Unindexed Profile</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name || profile?.full_name || 'Student Candidate'}!
            </h1>
            {getIndexingPill()}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Personalized workforce dashboard with PostgreSQL-persisted profile data and active recruiter job requisitions.
          </p>
        </div>
        <div>
          <Link
            to="/student/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all"
          >
            <FileText size={16} />
            <span>{profile ? 'Edit Profile & Skills' : 'Build Profile'}</span>
          </Link>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>Demonstration Preview (Sample Skill DNA):</strong> Showing Simulated student cohort competencies and benchmark matching vectors. Log in with an authenticated student account to load your authoritative PostgreSQL profile.
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            icon: Briefcase, 
            label: 'Applied Jobs', 
            value: isDemoMode ? '12' : String(profile?.applications_count ?? 0), 
            change: isDemoMode ? '+2 this month' : 'PostgreSQL Tracked', 
            color: 'from-blue-500 to-cyan-500' 
          },
          { 
            icon: Target, 
            label: 'Open Requisitions', 
            value: isDemoMode ? '24' : String(openJobs.length), 
            change: 'Active in Platform', 
            color: 'from-purple-500 to-pink-500' 
          },
          { 
            icon: Star, 
            label: 'Profile Completeness', 
            value: `${completeness}%`, 
            change: completeness >= 80 ? 'Placement Ready' : 'Needs Details', 
            color: 'from-green-500 to-emerald-500' 
          },
          { 
            icon: Users, 
            label: 'Technical Skills', 
            value: String(studentSkills.length), 
            change: 'Vector Encoded', 
            color: 'from-orange-500 to-red-500' 
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                <TrendingUp className="mr-1 text-green-500" size={14} />
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Summary & Skills */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Summary Card */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-purple-50/70 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-7 border border-blue-100 dark:border-gray-700 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Status & Completeness
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {profile?.headline || (isDemoMode ? demoCandidate.title : 'No headline set yet')}
                </p>
              </div>
              <span className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold tracking-wide self-start sm:self-auto">
                {isDemoMode ? demoCandidate.experience : `${profile?.experience_years ?? 0} Years Experience`}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5 font-medium">
                  <span className="text-gray-700 dark:text-gray-300">Calculated Completion</span>
                  <span className={`font-bold ${completeness >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {completeness}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      completeness >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {profile?.resume_text ? (
                <div className="mt-4 pt-4 border-t border-blue-100/80 dark:border-gray-700/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Persisted Resume & Bio Summary
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-3 leading-relaxed">
                    {profile.resume_text}
                  </p>
                </div>
              ) : !isDemoMode && (
                <div className="mt-4 p-3.5 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-blue-200/60 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Add resume details to improve your AI match ranking score.
                  </span>
                  <Link to="/student/profile" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                    Complete Profile <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Technical Skills Card */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-7 border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Persisted Technical Skills
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Vector-embedded skills matched against recruiter requirements
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                {studentSkills.length} Verified Skills
              </span>
            </div>

            {studentSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {studentSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No technical skills added yet.
                </p>
                <Link
                  to="/student/profile"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Add Skills Now <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {/* Radar representation for demo or comparative visualization */}
            {isDemoMode && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mb-3">
                  Illustrative Skill Radar (Demo Mode Only):
                </span>
                <div className="h-64">
                  <SkillRadar skills={demoCandidate.skills} />
                </div>
              </div>
            )}
          </div>

          {/* Skill Intelligence & Development Analytics Card */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-7 border border-gray-200 dark:border-gray-700 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="text-blue-600 dark:text-blue-400" size={22} />
                  Skill Intelligence & Progress Analytics
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Explainable evidence verification, assessment trajectory, and roadmap lifecycle telemetry
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg self-start sm:self-auto">
                PostgreSQL Derived
              </span>
            </div>

            {/* Target Requirement Coverage Delta */}
            {analytics?.target_coverage && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-gray-800/80 dark:to-gray-800/50 border border-blue-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Target Role Requirement Coverage
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {analytics.target_coverage.target_role || 'General SWE'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center my-3">
                  <div className="bg-white/80 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Initial Coverage</div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {analytics.target_coverage.initial_coverage_pct}%
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Current Coverage</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {analytics.target_coverage.current_coverage_pct}%
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Coverage Delta</div>
                    <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
                      analytics.target_coverage.coverage_delta_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}>
                      <TrendingUp size={14} />
                      {analytics.target_coverage.coverage_delta_pct >= 0 ? `+${analytics.target_coverage.coverage_delta_pct}%` : `${analytics.target_coverage.coverage_delta_pct}%`}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(analytics.target_coverage.current_coverage_pct, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Evidence & Assessment Status Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  <span>Assessed Skills</span>
                  <Award size={14} />
                </div>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  {analytics?.verified_skills?.length ?? 0}
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                  Passed standardized benchmarks
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  <span>Faculty Approved</span>
                  <CheckCircle2 size={14} />
                </div>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-200">
                  {analytics?.faculty_reviewed_skills?.length ?? 0}
                </div>
                <div className="text-[10px] text-blue-700/80 dark:text-blue-400 mt-0.5">
                  Mentor-verified evidence
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  <span>Pending Review</span>
                  <Clock size={14} />
                </div>
                <div className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  {analytics?.pending_reviews_count ?? 0}
                </div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                  Awaiting faculty endorsement
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">
                  <span>Activities Done</span>
                  <Activity size={14} />
                </div>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-200">
                  {analytics?.completed_activities_count ?? 0} / {analytics?.total_activities_count ?? 0}
                </div>
                <div className="text-[10px] text-purple-700/80 dark:text-purple-400 mt-0.5">
                  Roadmap actions finished
                </div>
              </div>
            </div>

            {/* Assessment History Over Time */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2.5 flex items-center justify-between">
                <span>Standardized Assessment Attempt History</span>
                <span className="text-xs font-normal text-gray-500">
                  {analytics?.assessment_history?.length ?? 0} Attempts Recorded
                </span>
              </h3>

              {analytics?.assessment_history && analytics.assessment_history.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        <th className="px-3.5 py-2.5">Assessment Title</th>
                        <th className="px-3.5 py-2.5">Target Skill</th>
                        <th className="px-3.5 py-2.5">Score</th>
                        <th className="px-3.5 py-2.5">Outcome</th>
                        <th className="px-3.5 py-2.5">Recorded At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {analytics.assessment_history.map((att: any) => (
                        <tr key={att.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                          <td className="px-3.5 py-2.5 font-semibold text-gray-800 dark:text-gray-200">{att.assessment_title}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[10px]">
                              {att.skill_name || 'Technical Benchmark'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">
                            {att.score_pct}%
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {att.passed ? 'Passed (>=70%)' : 'Did Not Pass (<70%)'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-gray-500 text-[11px]">
                            {att.completed_at ? new Date(att.completed_at).toLocaleDateString() : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Insufficient Assessment Evidence:</span> You have not yet completed any standardized technical benchmarks. Complete benchmarks to convert self-reported skills into verified, high-confidence Skill DNA markers.
                    <div className="mt-2">
                      <Link to="/student/assessments" className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                        Take Standardized Assessment <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Roadmap Recommendations Lifecycle Distribution */}
            {analytics?.recommendations_lifecycle && (
              <div className="border-t border-gray-100 dark:border-gray-700/60 pt-4">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                  Roadmap Recommendations Lifecycle Distribution
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(analytics.recommendations_lifecycle).map(([status, cnt]) => (
                    <div key={status} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{status.replace('_', ' ')}</div>
                      <div className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{String(cnt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Open Jobs & Quick Links */}
        <div className="space-y-8">
          {/* Open Requisitions in PostgreSQL */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Active Job Requisitions
              </h2>
              <Link to="/student/jobs" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3.5">
              {openJobs.length > 0 ? (
                openJobs.slice(0, 4).map((job) => {
                  let requiredSkills: string[] = [];
                  if (job.parsed_json?.skills) {
                    requiredSkills = job.parsed_json.skills;
                  } else if (Array.isArray(job.required_skills)) {
                    requiredSkills = job.required_skills;
                  }

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                          {job.title}
                        </h3>
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                          {job.status || 'Open'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                        <span>{job.location || 'Remote'}</span>
                        <span className="mx-1.5">•</span>
                        <span>{job.experience_min ?? 0}-{job.experience_max ?? 5} yrs exp</span>
                      </div>
                      {requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {requiredSkills.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        to="/student/jobs"
                        className="w-full text-center block py-1.5 px-3 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        View & Apply
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="p-5 text-center text-xs text-gray-500 dark:text-gray-400 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
                  No active recruiter job postings in PostgreSQL yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Student Navigation
            </h2>
            <div className="space-y-2.5">
              <Link
                to="/student/skill-dna"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-xs font-semibold transition-colors border border-blue-200/50 dark:border-blue-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <Brain size={16} className="text-blue-600" />
                  <span>Skill DNA Intelligence & Proof</span>
                </div>
                <ArrowRight size={14} className="text-blue-500" />
              </Link>
              <Link
                to="/student/assessments"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-200 text-xs font-semibold transition-colors border border-purple-200/50 dark:border-purple-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-purple-600" />
                  <span>Take Technical Benchmark</span>
                </div>
                <ArrowRight size={14} className="text-purple-500" />
              </Link>
              <Link
                to="/student/profile"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-blue-600" />
                  <span>Update Profile & Skills</span>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
              <Link
                to="/student/jobs"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase size={16} className="text-indigo-600" />
                  <span>Explore Open Jobs</span>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
              <Link
                to="/student/applications"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Track Submitted Applications</span>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
