import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Filter,
  Search,
  Target,
  Star,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface CandidateMatchItem {
  id?: string | number;
  jobId?: string | number;
  candidateId?: string | number;
  candidate_id?: string | number;
  candidateName?: string;
  name?: string;
  full_name?: string;
  email?: string;
  headline?: string;
  location?: string;
  experience?: number | string;
  experience_years?: number;
  score?: number;
  match_score?: number;
  skillOverlap?: number;
  skill_overlap?: number;
  embeddingSimilarity?: number;
  embedding_sim?: number;
  matchedSkills?: string[];
  skills?: string[] | string;
  evidence?: string[] | string;
  status?: string;
  lastUpdated?: string;
  skill_dna_summary?: {
    verified_skills_count: number;
    total_skills_count: number;
    avg_confidence: number;
    top_skills: Array<{
      slug: string;
      name?: string;
      proficiency_tier: string;
      confidence: number;
      verification_status: string;
      verified: boolean;
    }>;
  };
}

const DEMO_MATCHES: CandidateMatchItem[] = [
  {
    id: 'demo-match-1',
    candidateId: 'cand-1',
    candidateName: 'Alex Chen',
    email: 'alex.chen@mit.edu',
    headline: 'Senior Frontend & Systems Engineer',
    location: 'San Francisco, CA',
    experience_years: 5,
    score: 95,
    skillOverlap: 92,
    embeddingSimilarity: 88,
    matchedSkills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Next.js'],
    evidence: [
      'Extensive React and TypeScript portfolio with verified GitHub production repositories.',
      'Demonstrated expertise in high-concurrency client state and responsive UI architecture.',
    ],
    status: 'pending',
    lastUpdated: '2026-03-20',
  },
  {
    id: 'demo-match-2',
    candidateId: 'cand-2',
    candidateName: 'Priya Patel',
    email: 'priya.patel@stanford.edu',
    headline: 'Full-Stack Software Engineer',
    location: 'San Jose, CA',
    experience_years: 4,
    score: 89,
    skillOverlap: 86,
    embeddingSimilarity: 84,
    matchedSkills: ['React', 'JavaScript', 'Redux', 'REST APIs', 'Node.js'],
    evidence: [
      'Strong state management and API integration skills with full test coverage.',
      'Verified academic benchmark in distributed systems and web architectures.',
    ],
    status: 'reviewed',
    lastUpdated: '2026-03-19',
  },
  {
    id: 'demo-match-3',
    candidateId: 'cand-3',
    candidateName: 'Marcus Vance',
    email: 'marcus.vance@berkeley.edu',
    headline: 'Backend & Data Platform Engineer',
    location: 'Austin, TX',
    experience_years: 3,
    score: 82,
    skillOverlap: 78,
    embeddingSimilarity: 80,
    matchedSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Python'],
    evidence: [
      'Proficient in robust TypeScript backend services with relational schema design.',
      'Demonstrated active skill growth via verified Skill DNA assessments.',
    ],
    status: 'pending',
    lastUpdated: '2026-03-18',
  },
  {
    id: 'demo-match-4',
    candidateId: 'cand-4',
    candidateName: 'Elena Rostova',
    email: 'elena.rostova@cmu.edu',
    headline: 'Junior Frontend Developer',
    location: 'Seattle, WA',
    experience_years: 2,
    score: 76,
    skillOverlap: 72,
    embeddingSimilarity: 70,
    matchedSkills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Git'],
    evidence: [
      'Solid component styling fundamentals and active open-source contribution stream.',
    ],
    status: 'contacted',
    lastUpdated: '2026-03-17',
  },
];

export default function CandidateMatches() {
  const { id } = useParams();
  const { isDemoMode } = useAuth();
  const [matches, setMatches] = useState<CandidateMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    skillMatch: 0,
    experienceMatch: false,
    sortBy: 'score',
  });

  const fetchMatches = async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    if (isDemoMode) {
      // Simulate realistic network delay and load demo fixtures
      await new Promise((resolve) => setTimeout(resolve, 350));
      setMatches(DEMO_MATCHES);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/jobs/${id}/matches`);
      const data = response.data;
      const rawMatches: CandidateMatchItem[] = data?.matches || data?.results || [];

      // Normalize match score numbers (e.g., if match_score is 0.85 -> 85)
      const normalizedMatches = rawMatches.map((m, idx) => {
        let score = m.score;
        if (score == null && m.match_score != null) {
          score = m.match_score <= 1.0 ? Math.round(m.match_score * 100) : Math.round(m.match_score);
        }
        let skillOverlap = m.skillOverlap;
        if (skillOverlap == null && m.skill_overlap != null) {
          skillOverlap = m.skill_overlap <= 1.0 ? Math.round(m.skill_overlap * 100) : Math.round(m.skill_overlap);
        }
        let embeddingSimilarity = m.embeddingSimilarity;
        if (embeddingSimilarity == null && m.embedding_sim != null) {
          embeddingSimilarity = m.embedding_sim <= 1.0 ? Math.round(m.embedding_sim * 100) : Math.round(m.embedding_sim);
        }

        let matchedSkills: string[] = [];
        if (Array.isArray(m.matchedSkills)) {
          matchedSkills = m.matchedSkills;
        } else if (Array.isArray(m.skills)) {
          matchedSkills = m.skills;
        } else if (typeof m.skills === 'string') {
          try {
            matchedSkills = JSON.parse(m.skills);
          } catch {
            matchedSkills = m.skills.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }

        let evidenceArr: string[] = [];
        if (Array.isArray(m.evidence)) {
          evidenceArr = m.evidence;
        } else if (typeof m.evidence === 'string') {
          evidenceArr = [m.evidence];
        } else {
          evidenceArr = [`Algorithmic match score calculated based on ${skillOverlap ?? 0}% skill overlap and semantic resume alignment.`];
        }

        return {
          ...m,
          id: m.id || `match-${idx}`,
          candidateId: m.candidateId || m.candidate_id || `cand-${idx}`,
          candidateName: m.candidateName || m.full_name || m.name || `Candidate #${idx + 1}`,
          score: score ?? 0,
          skillOverlap: skillOverlap ?? 0,
          embeddingSimilarity: embeddingSimilarity ?? 0,
          matchedSkills,
          evidence: evidenceArr,
          status: m.status || 'pending',
          lastUpdated: m.lastUpdated || new Date().toISOString().split('T')[0],
        };
      });

      setMatches(normalizedMatches);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Failed to fetch candidate matches';
      setErrorStatus(status || 500);
      setErrorMessage(msg);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [id, isDemoMode]);

  const filteredMatches = matches
    .filter((match) => {
      const name = match.candidateName || match.full_name || match.name || '';
      const headline = match.headline || '';
      const q = searchQuery.toLowerCase();
      if (q && !name.toLowerCase().includes(q) && !headline.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.skillMatch > 0 && (match.skillOverlap ?? 0) < filters.skillMatch) {
        return false;
      }
      if (filters.experienceMatch && (match.score ?? 0) < 80) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'score') {
        return (b.score ?? 0) - (a.score ?? 0);
      } else if (filters.sortBy === 'skillOverlap') {
        return (b.skillOverlap ?? 0) - (a.skillOverlap ?? 0);
      } else {
        return (b.embeddingSimilarity ?? 0) - (a.embeddingSimilarity ?? 0);
      }
    });

  const totalMatchesCount = matches.length;
  const avgScore =
    totalMatchesCount > 0
      ? Math.round(matches.reduce((acc, m) => acc + (m.score ?? 0), 0) / totalMatchesCount)
      : 0;
  const topScore =
    totalMatchesCount > 0 ? Math.max(...matches.map((m) => m.score ?? 0)) : 0;

  return (
    <div className="space-y-6 page-transition">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={id ? `/recruiter/job/${id}` : '/recruiter/jobs'}
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            <ArrowLeft className="mr-1.5" size={16} />
            Back to Job Details
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              AI Candidate Matches
            </h1>
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Sparkles size={12} />
                Demo Benchmark
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Algorithmic ranking across candidate skill vectors and resume semantic embeddings
            {id ? ` for Requisition #${id}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              Simulated Candidate Matches (Demonstration Model)
            </div>
            <div className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
              Operating in local demo mode. Candidate scores and skill overlaps displayed below represent pre-computed demonstration benchmarks.
            </div>
          </div>
        </div>
      )}

      {/* Error Banners */}
      {!isDemoMode && errorStatus === 503 && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base">
              AI Matching Microservice Unavailable (HTTP 503)
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              The FastAPI ML inference microservice is currently unreachable on port 8000. Real AI matching requires the Python ML microservice to be running.
            </p>
            <div className="mt-2 text-xs font-mono bg-amber-100 dark:bg-amber-900/60 p-2 rounded text-amber-900 dark:text-amber-200">
              Command: cd Backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
            </div>
            <div className="pt-2">
              <button
                onClick={fetchMatches}
                className="text-xs font-semibold text-amber-900 dark:text-amber-100 underline hover:no-underline"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {!isDemoMode && errorStatus === 403 && (
        <div className="p-5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-xl flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900 dark:text-red-200 text-base">
              Permission Denied (HTTP 403)
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300">
              You do not have permission to view matches for this requisition. Candidate matching telemetry is restricted to the owning recruiter and Super Administrators.
            </p>
          </div>
        </div>
      )}

      {!isDemoMode && errorStatus && errorStatus !== 503 && errorStatus !== 403 && (
        <div className="p-5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900 dark:text-red-200 text-base">
              Error Fetching Matches ({errorStatus})
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300">
              {errorMessage || 'An unexpected error occurred while querying the matching pipeline.'}
            </p>
            <div className="pt-2">
              <button
                onClick={fetchMatches}
                className="text-xs font-semibold text-red-900 dark:text-red-100 underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Ranked Candidates
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {loading ? '...' : totalMatchesCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Indexed vector matches
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Mean Match Score
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Target size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {loading ? '...' : `${avgScore}%`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Composite hybrid rank
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Top Compatibility
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Star size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {loading ? '...' : `${topScore}%`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Highest ranking profile
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800/80 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by candidate name or headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filters.skillMatch}
                onChange={(e) => setFilters((prev) => ({ ...prev, skillMatch: parseInt(e.target.value, 10) }))}
                className="text-xs py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">All Skill Overlaps</option>
                <option value="70">&ge; 70% Skill Overlap</option>
                <option value="80">&ge; 80% Skill Overlap</option>
                <option value="90">&ge; 90% Skill Overlap</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.experienceMatch}
                onChange={(e) => setFilters((prev) => ({ ...prev, experienceMatch: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>High Confidence (&ge; 80%)</span>
            </label>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="text-xs py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Sort: Match Score</option>
              <option value="skillOverlap">Sort: Skill Overlap</option>
              <option value="embeddingSimilarity">Sort: Semantic Embedding</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Querying vector matching pipeline...
          </p>
        </div>
      )}

      {/* Matches List */}
      {!loading && filteredMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <span>Showing {filteredMatches.length} candidate {filteredMatches.length === 1 ? 'match' : 'matches'}</span>
            <span>Sorted by {filters.sortBy === 'score' ? 'Composite Match Score' : filters.sortBy === 'skillOverlap' ? 'Skill Overlap' : 'Embedding Similarity'}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMatches.map((match) => {
              const name = match.candidateName || match.full_name || match.name || 'Candidate';
              const expYears = match.experience_years ?? match.experience;
              return (
                <div
                  key={match.id}
                  className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <Briefcase size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                              {name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              {match.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={12} />
                                  {match.location}
                                </span>
                              )}
                              {expYears != null && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar size={12} />
                                  {expYears} yrs exp
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {match.headline || 'Software Engineering Candidate'}
                          </p>
                          {match.email && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {match.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scores Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-gray-500 dark:text-gray-400">Overall Match</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {match.score}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, match.score || 0))}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-gray-500 dark:text-gray-400">Skill Overlap</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {match.skillOverlap}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, match.skillOverlap || 0))}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-gray-500 dark:text-gray-400">Semantic Sim</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {match.embeddingSimilarity}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, match.embeddingSimilarity || 0))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Skill DNA Competency Intelligence */}
                      {match.skill_dna_summary && (
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              Skill DNA Intelligence ({match.skill_dna_summary.verified_skills_count} Verified / {match.skill_dna_summary.total_skills_count} Tracked)
                            </span>
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              Avg Confidence: {match.skill_dna_summary.avg_confidence}%
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {match.skill_dna_summary.top_skills.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className={`px-2 py-0.5 text-[11px] font-medium rounded-md border flex items-center gap-1 ${
                                  s.verified
                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {s.verified && <CheckCircle2 size={10} className="text-emerald-600" />}
                                <span>{s.name || s.slug}</span>
                                <span className="opacity-70 text-[9px]">({s.confidence}%)</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matched Skills */}
                      {match.matchedSkills && match.matchedSkills.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Intersecting Candidate Competencies:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchedSkills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Match Evidence / Reasoning */}
                      {match.evidence && match.evidence.length > 0 && (
                        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          <div className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <HelpCircle size={13} />
                            Algorithmic Match Evidence:
                          </div>
                          {Array.isArray(match.evidence) ? (
                            match.evidence.map((ev, eIdx) => <p key={eIdx}>{ev}</p>)
                          ) : (
                            <p>{match.evidence}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="lg:w-44 flex flex-col justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                      <div className="space-y-2">
                        <Link
                          to={`/recruiter/candidate/${match.candidateId || match.id}`}
                          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                        >
                          <Eye size={14} />
                          <span>View Profile</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => alert(`Interview outreach initiated for ${name} (demo simulated workflow).`)}
                          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-xl transition-colors"
                        >
                          <MessageSquare size={14} />
                          <span>Contact</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div>Status: <span className="font-medium text-gray-600 dark:text-gray-300">{match.status || 'pending'}</span></div>
                        {match.lastUpdated && <div className="mt-0.5">Updated: {match.lastUpdated}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genuine Empty State (0 results from DB/ML) */}
      {!loading && !errorStatus && matches.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
            <Target size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No Candidate Matches Found (0 Results)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are currently no candidates indexed in the database matching this requisition. As new students register and populate their skill profiles, they will automatically be scored and ranked.
          </p>
          <div className="pt-2">
            <Link
              to="/recruiter/candidates"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Browse All Registered Candidates &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Filter Cleared State */}
      {!loading && matches.length > 0 && filteredMatches.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No matches meet the active search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({ skillMatch: 0, experienceMatch: false, sortBy: 'score' });
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
