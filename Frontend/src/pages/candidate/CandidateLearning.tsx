// Frontend/src/pages/candidate/CandidateLearning.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  FileCode,
  Play,
  Check,
  AlertCircle,
  HelpCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import StudentPilotConsentCard from '../../components/StudentPilotConsentCard';

const ROADMAP_ENGINE_VERSION = 'v2.0.0-ai-semantic-recommendation';

export interface RelevanceFeedback {
  id?: number;
  recommendation_id: number;
  rating: number;
  reason_category?: string | null;
  feedback_text?: string | null;
  updated_at?: string;
}

const REASON_CATEGORIES = [
  { key: 'relevant_to_goal', label: 'Directly aligns with my target goal' },
  { key: 'targets_needed_skill', label: 'Targets a skill I need to improve' },
  { key: 'too_easy', label: 'Too foundational / already know this' },
  { key: 'too_difficult', label: 'Too advanced / missing prerequisites' },
  { key: 'not_related', label: 'Not related to my career track' },
  { key: 'already_covered', label: 'Already completed elsewhere' }
];

interface RecommendationMetadata {
  is_ai_recommended?: boolean;
  ranking_score?: number;
  semantic_similarity?: number;
  scoring_breakdown?: {
    semantic_similarity: number;
    gap_urgency: number;
    difficulty_calibration: number;
    verification_payoff: number;
  };
  explanation?: {
    primary_driver: string;
    semantic_relevance_pct: number;
    gap_state: string;
    difficulty_calibration: string;
    verification_impact: string;
    rationale_text: string;
  };
  model_version?: string;
  retrieval_method?: string;
  advisory_type?: string;
  fallback_used?: boolean;
}

interface StudentGoal {
  id: number;
  goal_type: 'target_role' | 'target_job';
  target_title: string;
  target_job_id?: number | null;
  target_skills: string[];
  status: string;
  job_title?: string;
  company_name?: string;
}

interface GapItem {
  target_requirement: string;
  skill_id: number | null;
  skill_slug: string | null;
  skill_name: string;
  category: string;
  gap_state: 'evidence_supports_target' | 'development_indicated' | 'unassessed' | 'evidence_pending' | 'evidence_rejected' | 'requirement_unresolved';
  status_label: string;
  evidence_considered: string;
  missing_elements: string[];
  rationale: string;
  actionable_next_step: string;
  confidence_score: number;
  proficiency_tier: string;
  verification_status: string;
}

interface RoadmapRecommendation {
  id: number;
  roadmap_id: number;
  skill_id: number | null;
  skill_slug?: string;
  skill_name?: string;
  activity_id?: number | null;
  activity_title?: string;
  activity_type?: string;
  activity_difficulty?: string;
  estimated_minutes?: number;
  assessment_slug?: string;
  recommendation_key: string;
  recommendation_type: string;
  priority: number;
  title: string;
  action_text: string;
  rationale: string;
  status: 'active' | 'in_progress' | 'completed' | 'dismissed';
  completed_at?: string | null;
  recommendation_metadata?: RecommendationMetadata;
}

interface CareerPreset {
  role_key: string;
  title: string;
  description: string;
  skills: string[];
}

interface AvailableJob {
  id: number;
  title: string;
  location: string;
  company_name: string;
  skills: string[];
}

export default function CandidateLearning() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Roadmap State
  const [goal, setGoal] = useState<StudentGoal | null>(null);
  const [roadmapId, setRoadmapId] = useState<number | null>(null);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [summary, setSummary] = useState<any>(null);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [recommendations, setRecommendations] = useState<RoadmapRecommendation[]>([]);
  const [careerPresets, setCareerPresets] = useState<CareerPreset[]>([]);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);

  // Feedback & Impression State
  const [feedbackMap, setFeedbackMap] = useState<Record<number, RelevanceFeedback>>({});
  const [activeFeedbackRecId, setActiveFeedbackRecId] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(4);
  const [feedbackReason, setFeedbackReason] = useState<string>('relevant_to_goal');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const presentationIdRef = useRef<string>(`pres_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  const impressionsSentRef = useRef<boolean>(false);
  const [isPilotParticipant, setIsPilotParticipant] = useState<boolean | null>(null);

  // Goal Selection Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTab, setGoalTab] = useState<'presets' | 'jobs'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<string>('distributed_systems_engineer');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  // Selected gap detail modal/drawer
  const [selectedGap, setSelectedGap] = useState<GapItem | null>(null);

  const fetchRoadmapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch goal options
      const goalRes = await api.get('/student/goal');
      if (goalRes && goalRes.success) {
        setGoal(goalRes.goal);
        setCareerPresets(goalRes.career_presets || []);
        setAvailableJobs(goalRes.available_jobs || []);
        if (goalRes.available_jobs?.length > 0 && !selectedJobId) {
          setSelectedJobId(goalRes.available_jobs[0].id);
        }
      }

      // 2. Fetch roadmap & gaps
      const roadmapRes = await api.get('/student/roadmap');
      if (roadmapRes && roadmapRes.success) {
        setRoadmapId(roadmapRes.roadmap_id || null);
        setReadinessScore(roadmapRes.readiness_score || 0);
        setSummary(roadmapRes.summary || null);
        setGaps(roadmapRes.gaps || []);
        setRecommendations(roadmapRes.recommendations || []);
      }

      // 3. Fetch student's explicit relevance feedback
      try {
        const fbRes = await api.get('/student/roadmap/feedback');
        if (fbRes && fbRes.success && Array.isArray(fbRes.feedback)) {
          const map: Record<number, RelevanceFeedback> = {};
          for (const item of fbRes.feedback) {
            map[item.recommendation_id] = item;
          }
          setFeedbackMap(map);
        }
      } catch (fbErr) {
        console.warn('Feedback fetch error:', fbErr);
      }
    } catch (err: any) {
      console.warn('Roadmap fetch error:', err);
      setError(err?.message || 'Could not load your personalized roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapData();
  }, [user]);

  // Record impressions only if student is an active consented research pilot participant
  useEffect(() => {
    if (recommendations.length > 0 && roadmapId && !impressionsSentRef.current && isPilotParticipant === true) {
      impressionsSentRef.current = true;
      api.post('/student/roadmap/impressions', {
        roadmap_id: roadmapId,
        presentation_id: presentationIdRef.current,
        surface: 'learning_roadmap',
        impressions: recommendations.map((rec, idx) => ({
          recommendation_id: rec.id,
          rank_position: idx + 1,
          engine_version: ROADMAP_ENGINE_VERSION,
          model_version: rec.recommendation_metadata?.model_version || 'all-MiniLM-L6-v2',
          ranking_score: rec.recommendation_metadata?.ranking_score || 0.0,
          score_breakdown: rec.recommendation_metadata?.scoring_breakdown || {}
        }))
      }).catch(err => {
        console.warn('Impressions logging notice:', err?.message);
      });
    }
  }, [recommendations, roadmapId, isPilotParticipant]);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setError(null);
      const res = await api.post('/student/roadmap/generate', {});
      if (res && res.success) {
        setRoadmapId(res.roadmap_id || null);
        setReadinessScore(res.readiness_score || 0);
        setSummary(res.summary || null);
        setGaps(res.gaps || []);
        setRecommendations(res.recommendations || []);

        // Refresh presentation ID for newly generated roadmap view
        presentationIdRef.current = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        impressionsSentRef.current = false;

        setSuccessMessage('Roadmap and skill gap intelligence successfully refreshed.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to regenerate roadmap.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveGoal = async () => {
    try {
      setSavingGoal(true);
      setError(null);

      let payload: any = {};
      if (goalTab === 'presets') {
        const preset = careerPresets.find(p => p.role_key === selectedPreset);
        payload = {
          goal_type: 'target_role',
          target_title: preset?.title || 'Distributed Systems & Cloud Engineer',
          target_skills: preset?.skills || []
        };
      } else {
        const job = availableJobs.find(j => j.id === selectedJobId);
        payload = {
          goal_type: 'target_job',
          target_job_id: selectedJobId,
          target_title: job?.title || 'Target Job',
          target_skills: job?.skills || []
        };
      }

      const res = await api.post('/student/goal', payload);
      if (res && res.success) {
        setGoal(res.goal);
        if (res.roadmap) {
          setRoadmapId(res.roadmap.roadmap_id || null);
          setReadinessScore(res.roadmap.readiness_score || 0);
          setSummary(res.roadmap.summary || null);
          setGaps(res.roadmap.gaps || []);
          setRecommendations(res.roadmap.recommendations || []);

          presentationIdRef.current = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          impressionsSentRef.current = false;
        }
        setShowGoalModal(false);
        setSuccessMessage(`Target goal updated to '${res.goal.target_title}'.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update target goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleRecordInteraction = async (
    recId: number,
    eventType: 'opened' | 'started' | 'progress_recorded' | 'completed' | 'dismissed',
    progressPct?: number,
    metadata?: any
  ) => {
    try {
      const idempotencyKey = `evt_${user?.id}_${recId}_${eventType}_${Date.now()}`;
      await api.post('/student/roadmap/interactions', {
        recommendation_id: recId,
        event_type: eventType,
        idempotency_key: idempotencyKey,
        presentation_id: presentationIdRef.current,
        progress_pct: progressPct,
        interaction_metadata: metadata || {}
      });

      if (eventType === 'started') {
        setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'in_progress' } : r));
        setSuccessMessage('Activity marked in progress.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (eventType === 'completed') {
        setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'completed' } : r));
        setSuccessMessage('Activity completed! Great progress toward your goal.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (eventType === 'dismissed') {
        setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'dismissed' } : r));
        setSuccessMessage('Recommendation dismissed from active action plan.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.warn(`Interaction ${eventType} error:`, err);
      setError(err?.message || `Failed to record ${eventType} action.`);
    }
  };

  const handleOpenFeedback = (recId: number) => {
    const existing = feedbackMap[recId];
    if (existing) {
      setFeedbackRating(existing.rating || 4);
      setFeedbackReason(existing.reason_category || 'relevant_to_goal');
      setFeedbackComment(existing.feedback_text || '');
    } else {
      setFeedbackRating(4);
      setFeedbackReason('relevant_to_goal');
      setFeedbackComment('');
    }
    setActiveFeedbackRecId(recId);
  };

  const handleSubmitFeedback = async (recId: number) => {
    try {
      setSubmittingFeedback(true);
      setError(null);
      const res = await api.post('/student/roadmap/feedback', {
        recommendation_id: recId,
        rating: feedbackRating,
        reason_category: feedbackReason,
        feedback_text: feedbackComment,
        presentation_id: presentationIdRef.current
      });

      if (res && res.success) {
        setFeedbackMap(prev => ({
          ...prev,
          [recId]: {
            recommendation_id: recId,
            rating: feedbackRating,
            reason_category: feedbackReason,
            feedback_text: feedbackComment,
            updated_at: new Date().toISOString()
          }
        }));
        setActiveFeedbackRecId(null);
        setSuccessMessage('Thank you! Your feedback has been recorded.');
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUpdateRecStatus = async (recId: number, newStatus: 'in_progress' | 'completed' | 'dismissed') => {
    const eventType = newStatus === 'in_progress' ? 'started' : newStatus === 'completed' ? 'completed' : 'dismissed';
    await handleRecordInteraction(recId, eventType);
  };

  const getGapStateBadge = (state: string) => {
    switch (state) {
      case 'evidence_supports_target':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={13} />
            Supported
          </span>
        );
      case 'development_indicated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert size={13} />
            Development Indicated
          </span>
        );
      case 'evidence_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock size={13} />
            Review Pending
          </span>
        );
      case 'evidence_rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800">
            <AlertTriangle size={13} />
            Evidence Rejected
          </span>
        );
      case 'requirement_unresolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <HelpCircle size={13} />
            Unresolved Requirement
          </span>
        );
      case 'unassessed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Sparkles size={13} />
            Unassessed Opportunity
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">Priority 1 • Urgent Gap</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">Priority 2 • Assessment Ready</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">Priority 3 • Mentorship Review</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">Priority 4 • Practice Project</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500 text-white">Priority 5 • Advanced Challenge</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Target Goal Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-500/30">
              <Target size={14} className="text-indigo-400" />
              <span>Personalized Development Roadmap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {goal ? goal.target_title : 'Set Your Target Career Goal'}
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl">
              {goal?.goal_type === 'target_job' && goal.company_name
                ? `Mapped directly to open requisition requirements at ${goal.company_name}.`
                : 'Actionable competency roadmaps derived deterministically from your PostgreSQL Skill DNA and empirical assessment benchmarks.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Target size={14} />
              {goal ? 'Change Goal' : 'Select Goal'}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating || !goal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm border border-white/10 transition-colors"
            >
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              Refresh Roadmap
            </button>
            <Link
              to="/student/skill-dna"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Brain size={14} />
              View Skill DNA
            </Link>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Controlled Student Pilot Participation & Voluntary Consent */}
      <StudentPilotConsentCard onStatusChange={(status) => setIsPilotParticipant(status.is_pilot_participant)} />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Target Goal Readiness</span>
            <Target size={18} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {summary?.is_insufficient_evidence ? (
              <span className="text-sm font-bold text-amber-500 dark:text-amber-400">Insufficient Evidence</span>
            ) : (
              `${readinessScore}%`
            )}
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${summary?.is_insufficient_evidence ? 'bg-amber-400' : 'bg-indigo-600'}`}
              style={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            {summary?.is_insufficient_evidence
              ? 'Complete a benchmark test to establish verified readiness.'
              : `${summary?.supported_count ?? 0} of ${summary?.total_target_skills ?? 0} target competencies verified`}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Evidence Supported</span>
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary?.supported_count ?? 0}
            <span className="text-sm font-normal text-gray-500 ml-1">skills</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <span>Verified via assessment or faculty review</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Development Indicated</span>
            <ShieldAlert size={18} className="text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {summary?.development_needed_count ?? 0}
            <span className="text-sm font-normal text-gray-500 ml-1">skills</span>
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-2">
            Benchmark attempted; score below passing threshold
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Unassessed Opportunities</span>
            <Sparkles size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {summary?.unassessed_count ?? 0}
            <span className="text-sm font-normal text-gray-500 ml-1">skills</span>
          </div>
          <div className="text-[11px] text-blue-500 mt-2">
            Lacks testing; not a proven weakness
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Evaluating skill gap matrix and generating personalized roadmap...</p>
        </div>
      ) : !goal ? (
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl text-center border border-gray-200 dark:border-gray-700">
          <Target size={48} className="mx-auto text-indigo-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configure Your Career Goal to Begin</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 mb-6">
            SkillVerse compares your verified PostgreSQL Skill DNA with target role requirements to highlight verified strengths, specific development needs, and unassessed opportunities.
          </p>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Select Target Role or Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Prioritized Actionable Recommendations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" />
                  Prioritized Development Roadmap
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Concrete in-platform activities prioritized to close target competency gaps.
                </p>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Engine: {ROADMAP_ENGINE_VERSION}
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-center">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">All Target Competencies Supported!</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  You have established verified Skill DNA evidence for all competencies required by this goal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      rec.status === 'completed'
                        ? 'bg-gray-50/60 dark:bg-gray-850/40 border-gray-200 dark:border-gray-800 opacity-75'
                        : rec.priority === 1
                          ? 'bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-900/60 shadow-sm'
                          : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getPriorityBadge(rec.priority)}
                          {rec.recommendation_metadata?.is_ai_recommended && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Sparkles size={11} className="text-indigo-500" />
                              AI Ranked • {Math.round((rec.recommendation_metadata.ranking_score || 0) * 100)}% Match
                            </span>
                          )}
                          {rec.skill_name && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {rec.skill_name}
                            </span>
                          )}
                          <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                            rec.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : rec.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {rec.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h3 className={`text-base font-bold ${
                          rec.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'
                        }`}>
                          {rec.title}
                        </h3>

                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {rec.action_text}
                        </p>

                        <p className="text-[11px] text-gray-400 italic">
                          Rationale: {rec.rationale}
                        </p>

                        {rec.recommendation_metadata?.explanation && (
                          <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] space-y-1.5">
                            <div className="flex items-center justify-between font-semibold text-indigo-950 dark:text-indigo-200">
                              <span className="flex items-center gap-1.5">
                                <Sparkles size={12} className="text-indigo-500" />
                                {rec.recommendation_metadata.explanation.primary_driver}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono">
                                Semantic Content Sim: {rec.recommendation_metadata.explanation.semantic_relevance_pct}%
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                              {rec.recommendation_metadata.explanation.rationale_text}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-gray-500 dark:text-gray-400">
                              <span>🎯 {rec.recommendation_metadata.explanation.difficulty_calibration}</span>
                              <span>•</span>
                              <span>🛡️ {rec.recommendation_metadata.explanation.verification_impact}</span>
                              {rec.estimated_minutes && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Clock size={10} /> {rec.estimated_minutes} mins</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {rec.assessment_slug && rec.status !== 'completed' && (
                          <Link
                            to="/student/assessments"
                            onClick={() => handleRecordInteraction(rec.id, 'opened')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-transform hover:scale-105"
                          >
                            <Play size={12} />
                            Launch Benchmark
                          </Link>
                        )}

                        {rec.recommendation_type === 'submit_evidence' && rec.status !== 'completed' && (
                          <Link
                            to="/student/skill-dna"
                            onClick={() => handleRecordInteraction(rec.id, 'opened')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                          >
                            <FileCode size={12} />
                            Submit Code
                          </Link>
                        )}

                        {rec.status === 'active' && (
                          <button
                            onClick={() => handleUpdateRecStatus(rec.id, 'in_progress')}
                            className="text-[11px] text-amber-600 hover:underline flex items-center gap-1"
                          >
                            Mark In Progress
                          </button>
                        )}

                        {rec.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateRecStatus(rec.id, 'completed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 dark:text-gray-300 text-[11px] transition-colors"
                          >
                            <Check size={12} />
                            Mark Complete
                          </button>
                        )}

                        {rec.status !== 'dismissed' && rec.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateRecStatus(rec.id, 'dismissed')}
                            className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Feedback summary / Trigger */}
                    {feedbackMap[rec.id] ? (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={12} />
                          <span>
                            You rated: <strong>{feedbackMap[rec.id].rating}/5 ★</strong>
                            {feedbackMap[rec.id].reason_category && (
                              <span className="ml-1 text-gray-500 dark:text-gray-400">
                                ({REASON_CATEGORIES.find(r => r.key === feedbackMap[rec.id].reason_category)?.label || feedbackMap[rec.id].reason_category})
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenFeedback(rec.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-[11px]"
                        >
                          Edit Feedback
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => handleOpenFeedback(rec.id)}
                          className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <Star size={11} className="text-amber-500" />
                          <span>Rate Relevance (Optional)</span>
                        </button>
                      </div>
                    )}

                    {/* Expandable Feedback Form */}
                    {activeFeedbackRecId === rec.id && (
                      <div className="mt-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/90 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-indigo-500" />
                            Relevance Feedback for This Activity
                          </span>
                          <button
                            onClick={() => setActiveFeedbackRecId(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Rating Stars 1-5 */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                            How relevant is this activity to your current target goal?
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => setFeedbackRating(starVal)}
                                className={`p-1.5 px-2.5 rounded-lg border flex items-center gap-1 text-xs font-semibold transition-all ${
                                  feedbackRating === starVal
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                                }`}
                              >
                                <Star size={12} className={feedbackRating >= starVal ? 'fill-current' : ''} />
                                <span>{starVal}</span>
                              </button>
                            ))}
                            <span className="text-[11px] text-gray-500 italic ml-1">
                              {feedbackRating === 1 && 'Not relevant'}
                              {feedbackRating === 2 && 'Weak match'}
                              {feedbackRating === 3 && 'Relevant'}
                              {feedbackRating === 4 && 'Very relevant'}
                              {feedbackRating === 5 && 'Essential to goal'}
                            </span>
                          </div>
                        </div>

                        {/* Reason categories */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                            Primary Reason (Optional):
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {REASON_CATEGORIES.map((cat) => (
                              <button
                                key={cat.key}
                                type="button"
                                onClick={() => setFeedbackReason(cat.key)}
                                className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                                  feedbackReason === cat.key
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                            Additional Notes (Optional, max 500 chars):
                          </label>
                          <textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value.slice(0, 500))}
                            placeholder="What would make this learning action more helpful for your track?"
                            rows={2}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* Transparency notice */}
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                          This feedback is completely optional and private. It is used solely to evaluate curriculum recommendation quality and has zero effect on your grades, Skill DNA scores, or employability.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveFeedbackRecId(null)}
                            className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingFeedback}
                            onClick={() => handleSubmitFeedback(rec.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                          >
                            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200 text-xs flex items-start gap-2.5">
              <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong>Evidence-Aware AI Recommendations:</strong> Ranked using local sentence-transformers (<code>all-MiniLM-L6-v2</code>) semantic retrieval combined with skill-gap urgency and verification payoff. Semantic relevance indicates curricular alignment with your goal, while Skill DNA evaluates demonstrated proof.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Integrity Safeguard:</strong> Marking a roadmap activity completed records your progress in your roadmap, but does not manufacture passing benchmark scores or verified Skill DNA. Official evidence verification requires passing technical benchmarks or assigned faculty code approval.
              </span>
            </div>
          </div>

          {/* Right Col: Target Skill Gap Matrix */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target size={18} className="text-indigo-500" />
                Target Skill Gap Matrix
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Evaluation of required competencies against your Skill DNA.
              </p>
            </div>

            <div className="space-y-2.5">
              {gaps.map((gap, gIdx) => (
                <div
                  key={gIdx}
                  onClick={() => setSelectedGap(gap)}
                  className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {gap.skill_name || gap.target_requirement}
                    </span>
                    {getGapStateBadge(gap.gap_state)}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                    {gap.rationale}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                    <span>Proficiency: {gap.proficiency_tier}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                      Explain <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Goal Selection Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Configure Career or Job Target
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Select a standardized career role profile or align directly with an active persisted job.
                </p>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setGoalTab('presets')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  goalTab === 'presets' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Standard Career Roles
              </button>
              <button
                onClick={() => setGoalTab('jobs')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  goalTab === 'jobs' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Target Persisted Job ({availableJobs.length})
              </button>
            </div>

            {/* Presets List */}
            {goalTab === 'presets' ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {careerPresets.map(preset => (
                  <label
                    key={preset.role_key}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPreset === preset.role_key
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="preset"
                        checked={selectedPreset === preset.role_key}
                        onChange={() => setSelectedPreset(preset.role_key)}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-gray-900 dark:text-white">
                          {preset.title}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {preset.description}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {preset.skills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-700 dark:text-gray-300 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {availableJobs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No active jobs found in the platform.</p>
                ) : (
                  availableJobs.map(job => (
                    <label
                      key={job.id}
                      className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedJobId === job.id
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="job"
                          checked={selectedJobId === job.id}
                          onChange={() => setSelectedJobId(job.id)}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center justify-between">
                            <span>{job.title}</span>
                            <span className="text-[10px] text-gray-400">{job.location}</span>
                          </div>
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                            {job.company_name}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.skills.map(s => (
                              <span key={s} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-700 dark:text-gray-300 font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowGoalModal(false)}
                className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={savingGoal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30"
              >
                {savingGoal ? 'Saving Goal...' : 'Activate Target Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gap Explanation Detail Modal */}
      {selectedGap && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-gray-400 uppercase font-mono tracking-wider">Gap Diagnostics</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {selectedGap.skill_name || selectedGap.target_requirement}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGap(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-gray-500">Status Classification:</span>
                <div className="mt-1">{getGapStateBadge(selectedGap.gap_state)}</div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Diagnostic Rationale:</span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedGap.rationale}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-500">Evidence Considered:</span>
                <p className="text-gray-800 dark:text-gray-200 mt-0.5">{selectedGap.evidence_considered}</p>
              </div>

              {selectedGap.missing_elements.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500">Missing Elements:</span>
                  <ul className="list-disc pl-4 text-gray-700 dark:text-gray-300 mt-0.5 space-y-0.5">
                    {selectedGap.missing_elements.map((m, mIdx) => (
                      <li key={mIdx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="font-bold text-indigo-950 dark:text-indigo-200">Recommended Action:</span>
                <p className="text-indigo-800 dark:text-indigo-300 mt-1">{selectedGap.actionable_next_step}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedGap(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
