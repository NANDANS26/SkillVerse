// Frontend/src/components/RecommendationEffectivenessDashboard.tsx
import { useEffect, useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Building2,
  Eye,
  ThumbsUp,
  Database,
  Users,
  Info
} from 'lucide-react';
import { api } from '../services/api';

interface FunnelStep {
  step: number;
  id: string;
  label: string;
  count: number;
  rate: number;
  rate_label: string;
  formula: string;
  description: string;
}

interface EvaluationReport {
  evaluation_status: 'INSUFFICIENT_REAL_WORLD_DATA' | 'READY_FOR_EXPLORATORY_ANALYSIS' | 'EVALUATION_AVAILABLE' | 'EVALUATION_BLOCKED_BY_DATA_QUALITY' | 'TENANT_NOT_FOUND';
  status_notice: string;
  active_engine_version: string;
  active_model_version: string;
  evaluated_at: string;
  institution_id: number | null;
  institution_name: string;
  date_range: {
    start_date: string | null;
    end_date: string | null;
  };
  minimum_group_size_safeguard: boolean;
  safeguard_notice: string | null;
  ranking_weights: {
    semantic_similarity: number;
    gap_urgency: number;
    verification_payoff: number;
    difficulty_alignment: number;
  };
  online_retraining_enabled: boolean;
  disclaimers: string[];
  funnel_metrics: FunnelStep[];
  provenance_filter?: string;
  pilot_participation?: {
    active_programs_count: number;
    enrolled_students_count: number;
    active_opted_in_students_count: number;
    withdrawn_students_count: number;
  };
  provenance_partitions?: {
    partition_a_explicit_judgments: {
      total_ratings: number;
      unique_students: number;
      mean_rating: number | null;
      mean_rating_label?: string;
      is_privacy_suppressed?: boolean;
      rating_distribution: Array<{ rating: string | number; count?: number | null; is_suppressed?: boolean }>;
      reason_categories: Array<{ reason_category: string; count?: number | null; is_suppressed?: boolean }>;
    };
    partition_b_implicit_outcomes: {
      total_impressions: number;
      total_presentations: number;
      observed_students: number;
      interactions: {
        opened: number;
        started: number;
        progress_recorded: number;
        completed: number;
        dismissed: number;
      };
      rates: {
        feedback_coverage: number;
        open_rate: number;
        start_rate: number;
        progress_rate: number;
        completion_rate: number;
        dismissal_rate: number;
      };
    };
    partition_c_synthetic_benchmark: {
      benchmark_name: string;
      model_version: string;
      synthetic_personas_count: number;
      synthetic_catalog_count: number;
      reported_metrics: Record<string, { baseline: number | string; ai: number | string; delta: string }>;
      disclaimer: string;
    };
  };
  behavioral_outcomes?: {
    total_impressions?: number;
    [key: string]: any;
  };
}

interface Props {
  role: 'super_admin' | 'college_admin';
  institutionId?: number;
}

export default function RecommendationEffectivenessDashboard({ role, institutionId }: Props) {
  const [data, setData] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '7d'>('all');
  const [provenanceFilter, setProvenanceFilter] = useState<'pilot' | 'automated_test' | 'demo_fixture' | 'unknown' | 'all' | 'exclude_tests'>('pilot');
  const [selectedInstId, setSelectedInstId] = useState<string>(institutionId ? String(institutionId) : 'all');
  const [institutions, setInstitutions] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch institution list for super_admin filter dropdown
  useEffect(() => {
    if (role === 'super_admin') {
      api.get<any>('/admin/tenants')
        .then(res => {
          if (res && res.success && Array.isArray(res.institutions)) {
            setInstitutions(res.institutions);
          }
        })
        .catch(() => {});
    }
  }, [role]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        provenance_filter: provenanceFilter
      };

      if (dateFilter === '7d') {
        params.start_date = new Date(Date.now() - 7 * 86400000).toISOString();
      } else if (dateFilter === '30d') {
        params.start_date = new Date(Date.now() - 30 * 86400000).toISOString();
      }

      if (role === 'super_admin' && selectedInstId !== 'all') {
        params.institution_id = selectedInstId;
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `/analytics/recommendations/evaluation${queryString ? `?${queryString}` : ''}`;

      const res = await api.get<any>(url);
      if (res && res.success) {
        setData(res);
      } else if (res && res.evaluation_status) {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load evaluation dataset.');
      }
    } catch (err: any) {
      console.warn('Recommendation Evaluation Error:', err);
      setError(err?.message || 'Failed to retrieve recommendation evaluation metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, selectedInstId, provenanceFilter]);

  const partA = data?.provenance_partitions?.partition_a_explicit_judgments;
  const partB = data?.provenance_partitions?.partition_b_implicit_outcomes;
  const partC = data?.provenance_partitions?.partition_c_synthetic_benchmark;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'INSUFFICIENT_REAL_WORLD_DATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
            <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
            INSUFFICIENT REAL-WORLD DATA (N &lt; 10)
          </span>
        );
      case 'READY_FOR_EXPLORATORY_ANALYSIS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
            <TrendingUp size={14} className="text-blue-600 dark:text-blue-400" />
            READY FOR EXPLORATORY ANALYSIS (10 ≤ N &lt; 50)
          </span>
        );
      case 'EVALUATION_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            EVALUATION AVAILABLE (N ≥ 50)
          </span>
        );
      case 'TENANT_NOT_FOUND':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700">
            <HelpCircle size={14} className="text-gray-500" />
            TENANT DATA UNAVAILABLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
            <ShieldAlert size={14} className="text-rose-600" />
            EVALUATION BLOCKED BY DATA QUALITY
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Pilot Readiness Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles size={12} />
                Phase 15 Recommendation Intelligence
              </span>
              {getStatusBadge(data?.evaluation_status)}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Recommendation Effectiveness & Pilot Readiness
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-3xl">
              Observability dashboard evaluating SentenceTransformer recommendation exposure, authenticated student funnel engagement, and voluntary curricular relevance ratings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filters */}
            <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('30d')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === '30d' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Last 30d
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('7d')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === '7d' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Last 7d
              </button>
            </div>

            {/* Provenance Filter */}
            <select
              aria-label="Filter by Provenance"
              value={provenanceFilter}
              onChange={(e) => setProvenanceFilter(e.target.value as any)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="pilot">Genuine Student Pilot (Default)</option>
              <option value="all">All Telemetry Partitions</option>
              <option value="automated_test">Automated Test Runs</option>
              <option value="demo_fixture">Demo Fixtures</option>
              <option value="unknown">Historical / Unattributed</option>
              <option value="exclude_tests">Exclude Automated Tests</option>
            </select>

            {/* Super Admin Institution Selector */}
            {role === 'super_admin' && (
              <select
                aria-label="Filter by Institution"
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Platform-Wide (All Institutions)</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={String(inst.id)}>
                    {inst.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              title="Refresh telemetry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Model & Version Metadata Bar */}
        <div className="mt-5 pt-4 border-t border-indigo-900/50 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-indigo-200/90">
          <div className="flex items-center gap-1.5">
            <Cpu size={14} className="text-indigo-400" />
            <span>Engine: <strong>{data?.active_engine_version || 'v2.0.0-ai-semantic-recommendation'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database size={14} className="text-indigo-400" />
            <span>Model: <strong>{data?.active_model_version || 'all-MiniLM-L6-v2'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-indigo-400" />
            <span>Scope: <strong>{data?.institution_name || 'All Institutions (Platform-Wide)'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Retraining: <strong>{data?.online_retraining_enabled ? 'Enabled' : 'Disabled (Frozen Weights)'}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Privacy Safeguard Notice (if applicable) */}
      {data?.minimum_group_size_safeguard && (
        <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong>Minimum Group Size Safeguard Active:</strong> {data.safeguard_notice}
          </div>
        </div>
      )}

      {/* 3. Status Explainer Directive */}
      {data?.status_notice && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Data Sufficiency Directive:</strong> {data.status_notice}
          </div>
        </div>
      )}

      {/* 3.1 Zero Genuine Pilot Observations Callout */}
      {provenanceFilter === 'pilot' && (!data?.behavioral_outcomes?.total_impressions || data?.behavioral_outcomes?.total_impressions === 0) && (
        <div className="p-4 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs flex items-start gap-3 shadow-xs">
          <Info size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">
              Zero Genuine Pilot Observations Recorded
            </h4>
            <p className="leading-relaxed text-indigo-800 dark:text-indigo-300">
              No genuine pilot telemetry has been recorded yet. Controlled student pilot participation is strictly voluntary and requires explicit student consent under an active institutional pilot program. To collect pilot observations, activate a pilot program and have eligible students consent via the candidate learning portal.
            </p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw size={18} className="animate-spin text-indigo-500" />
          <span>Aggregating recommendation evaluation dataset...</span>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* 3.1 Pilot Program Participation Card */}
          {data.pilot_participation && (
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900/50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Users size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Controlled Student Pilot Participation</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Voluntary consent status and active enrollment metrics</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck size={12} />
                  Active Provenance Isolation
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                  <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{data.pilot_participation.active_programs_count}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Active Programs</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                  <div className="text-lg font-extrabold text-gray-900 dark:text-white">{data.pilot_participation.enrolled_students_count}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Enrolled</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                  <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{data.pilot_participation.active_opted_in_students_count}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Active Opted-In</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700">
                  <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{data.pilot_participation.withdrawn_students_count}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Withdrawn</div>
                </div>
              </div>
            </div>
          )}

          {/* 3.2 Zero-Pilot Observations Explainer Callout */}
          {provenanceFilter === 'pilot' && (partB?.total_impressions ?? 0) === 0 && (
            <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-100">
                <Info size={16} className="text-indigo-600 shrink-0" />
                <span>Zero Genuine Pilot Observations Recorded</span>
              </div>
              <p className="text-indigo-800/90 dark:text-indigo-300/90 leading-relaxed">
                Consented students in active pilot programs have not yet generated roadmap recommendation impressions or interactions.
                To collect verified pilot telemetry: 1) Ensure an institutional pilot program is set to <strong>Active</strong>; 2) Eligible students review the notice and voluntarily opt in; 3) Consented students view recommendations and record activity.
              </p>
            </div>
          )}

          {/* 4. Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>Unique Presentations</span>
                <Eye size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {partB?.total_presentations ?? 0}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Distinct student roadmap viewing sessions
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>Total Impressions</span>
                <BarChart2 size={16} className="text-blue-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {partB?.total_impressions ?? 0}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Rendered recommendation cards (deduplicated)
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>Observed Students</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {partB?.observed_students ?? 0}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Unique authenticated student learners
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>Feedback Coverage</span>
                <ThumbsUp size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {partB?.rates?.feedback_coverage !== undefined
                  ? `${(partB.rates.feedback_coverage * 100).toFixed(1)}%`
                  : '0.0%'}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {partA?.total_ratings ?? 0} ratings / {partB?.total_impressions ?? 0} impressions
              </p>
            </div>
          </div>

          {/* 5. Learning Activity Funnel */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-500" />
                Learning Activity Lifecycle Funnel
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Conversion stages tracking student progression from recommendation impression to completion.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {data?.funnel_metrics?.map((step) => (
                <div key={step.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                        {step.step}
                      </span>
                      {step.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-[11px] font-mono">
                        {step.formula}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {step.count}
                      </span>
                      <span className="w-12 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {step.rate_label}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(step.rate * 100, step.count > 0 ? 5 : 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <div>
                <strong>Defensible Denominators Note:</strong> Activity Start Rate is computed as <code>starts / impressions</code>. Activity Completion Rate is strictly computed as <code>completions / starts</code> (not completions over impressions).
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                <strong>Academic Integrity Safeguard:</strong> A recorded completion represents student roadmap activity progress, not verified Skill DNA technical competence or a passed faculty evaluation.
              </div>
            </div>
          </div>

          {/* 6. Explicit Relevance Feedback & Partition A */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ThumbsUp size={18} className="text-amber-500" />
                  Partition A: Explicit Relevance Ratings
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Voluntary student ratings on a bounded 1–5 scale.
                </p>
              </div>

              <div className="flex items-center gap-6 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div>
                  <div className="text-3xl font-black text-amber-700 dark:text-amber-300">
                    {partA?.mean_rating !== null && partA?.mean_rating !== undefined ? partA?.mean_rating : (partA?.mean_rating_label || 'N/A')}
                  </div>
                  <div className="text-[11px] font-medium text-amber-800 dark:text-amber-200">
                    Mean Rating (1–5 Scale)
                  </div>
                </div>
                <div className="border-l border-amber-200 dark:border-amber-800 pl-6 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <div>Total Submissions: <strong>{partA?.total_ratings ?? 0}</strong></div>
                  <div>Unique Student Evaluators: <strong>{partA?.unique_students ?? 0}</strong></div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Rating Distribution:
                </label>
                {partA?.rating_distribution && partA.rating_distribution.length > 0 ? (
                  partA.rating_distribution.map((r) => (
                    <div key={String(r.rating)} className="flex items-center justify-between text-xs">
                      <span className="w-24 text-gray-600 dark:text-gray-300">
                        {typeof r.rating === 'number' ? `${r.rating} Stars` : r.rating}
                      </span>
                      <div className="flex-1 mx-3 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${r.count != null && (partA.total_ratings || 0) > 0 ? (r.count / partA.total_ratings) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="w-16 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {r.count !== null && r.count !== undefined ? r.count : 'Masked'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic">No ratings recorded yet.</div>
                )}
              </div>

              {/* Reason Categories */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Categorical Explanations Breakdown:
                </label>
                {partA?.reason_categories && partA.reason_categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {partA.reason_categories.map((rc) => (
                      <span
                        key={rc.reason_category}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 font-medium"
                      >
                        <span>{rc.reason_category.replace(/_/g, ' ')}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                          {rc.count !== null && rc.count !== undefined ? rc.count : 'Masked'}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No categorical reasons provided.</div>
                )}
              </div>

              <p className="text-[10px] text-gray-400 italic">
                Note: Unrated recommendations are not treated as negative feedback. Average rating reflects voluntary student satisfaction and does not prove causal ranking model superiority.
              </p>
            </div>

            {/* 7. Partition C: Synthetic Benchmark (Strictly Segregated) */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-1">
                  Controlled Synthetic Suite
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Cpu size={18} className="text-purple-500" />
                  Partition C: Synthetic Benchmark
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Hand-crafted persona test suite for offline regression tracking.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 text-xs space-y-1 text-purple-900 dark:text-purple-200">
                <div>Suite Name: <strong>{partC?.benchmark_name}</strong></div>
                <div>Synthetic Personas: <strong>{partC?.synthetic_personas_count}</strong> | Catalogue Pool: <strong>{partC?.synthetic_catalog_count} activities</strong></div>
              </div>

              {/* Synthetic Metrics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                      <th className="pb-2 font-semibold">Metric</th>
                      <th className="pb-2 font-semibold">Heuristic Baseline</th>
                      <th className="pb-2 font-semibold">AI Model</th>
                      <th className="pb-2 font-semibold">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {partC?.reported_metrics && Object.entries(partC.reported_metrics).map(([key, vals]) => (
                      <tr key={key} className="text-gray-800 dark:text-gray-200">
                        <td className="py-2 font-mono text-[11px]">{key}</td>
                        <td className="py-2">{String(vals.baseline)}</td>
                        <td className="py-2 font-bold">{String(vals.ai)}</td>
                        <td className="py-2 text-emerald-600 dark:text-emerald-400 font-bold">{vals.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-300 italic">
                {partC?.disclaimer}
              </div>
            </div>
          </div>

          {/* 8. Pilot Readiness Checklist & Requirements Card */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                Recommendation Pilot Readiness Checklist
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Technical pre-flight gates required before expanding recommendation pilots to external cohorts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Relational Invariant Verification</strong>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    PostgreSQL migration 008 enforces foreign keys, check constraints (0-100% progress, 1-5 rating), and unique presentation keys.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Multi-Tenant Role Isolation</strong>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Student identity server-derived; recruiter access blocked; college admin strictly scoped to verified institution.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Signal & Provenance Partitioning</strong>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Partition A (explicit), Partition B (implicit telemetry), and Partition C (synthetic benchmark) strictly segregated.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Single-Fire & Idempotency Safeguards</strong>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Browser-side presentation refs prevent duplicate impressions; interaction idempotency keys prevent double-counting.
                  </p>
                </div>
              </div>

              <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
                (partA?.unique_students || 0) >= 10
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
              }`}>
                {(partA?.unique_students || 0) >= 10 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong>Statistical Sample Sufficiency Gate</strong>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Current volume: {partA?.unique_students ?? 0} / 10 unique student evaluators. {
                      (partA?.unique_students || 0) >= 10
                        ? 'Exploratory sample threshold reached.'
                        : 'Requires at least 10 evaluators before initiating statistical ranking comparisons.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Model Weight Freezing & Zero Retraining</strong>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Weights remain frozen at all-MiniLM-L6-v2; automatic online feedback retraining is disabled by design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
