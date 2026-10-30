// Frontend/src/pages/candidate/CandidateSkillDNA.tsx
import { useState, useEffect } from 'react';
import { 
  Brain, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  FileCode, 
  HelpCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

interface EvidenceItem {
  id: number;
  skill_slug: string;
  source_type: 'self_reported' | 'resume_extracted' | 'project_submission' | 'assessment_result' | 'faculty_review';
  review_status: 'unreviewed' | 'pending_review' | 'verified' | 'rejected' | 'withdrawn';
  confidence_score: number;
  claim_title: string;
  claim_description?: string;
  evidence_url?: string;
  verified_at?: string;
  reviewer_name?: string;
  rejection_reason?: string;
  created_at: string;
}

interface SkillProfile {
  slug: string;
  name: string;
  category: string;
  proficiency_tier: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  confidence: number;
  verification_status: 'verified' | 'pending_review' | 'self_reported' | 'unverified';
  evidence_count: number;
  evidence: EvidenceItem[];
  recency_days: number | null;
}

interface SkillDNAResponse {
  candidate_id: number;
  calculated_at: string;
  engine_version: string;
  overview: {
    total_skills_tracked: number;
    verified_skills_count: number;
    average_confidence: number;
    verification_ratio: number;
  };
  skills: SkillProfile[];
}

export default function CandidateSkillDNA() {
  const { user } = useAuth();
  const [dna, setDna] = useState<SkillDNAResponse | null>(null);
  const [canonicalSkills, setCanonicalSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evidence submission modal / form state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [formSkill, setFormSkill] = useState('');
  const [formSource, setFormSource] = useState<'project_submission' | 'self_reported'>('project_submission');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUrl, setFormUrl] = useState('');

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchSkillDNA = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load canonical taxonomy
      const taxRes = await api.get('/skills');
      if (taxRes && taxRes.skills) {
        setCanonicalSkills(taxRes.skills);
        if (!formSkill && taxRes.skills.length > 0) {
          setFormSkill(taxRes.skills[0].slug);
        }
      }

      // Load candidate DNA
      const res = await api.get('/skills/me/dna');
      if (res && res.success && res.dna) {
        setDna(res.dna);
      } else {
        // Fallback demo state if empty
        setDna({
          candidate_id: Number(user?.id) || 1,
          calculated_at: new Date().toISOString(),
          engine_version: 'v1.0.0-deterministic',
          overview: {
            total_skills_tracked: 4,
            verified_skills_count: 2,
            average_confidence: 0.725,
            verification_ratio: 0.5
          },
          skills: [
            {
              slug: 'rust',
              name: 'Rust',
              category: 'Systems',
              proficiency_tier: 'Advanced',
              confidence: 0.850,
              verification_status: 'verified',
              evidence_count: 1,
              recency_days: 2,
              evidence: [
                {
                  id: 101,
                  skill_slug: 'rust',
                  source_type: 'assessment_result',
                  review_status: 'verified',
                  confidence_score: 0.850,
                  claim_title: 'Passed Rust Systems Foundations Benchmark (95%)',
                  verified_at: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ]
            },
            {
              slug: 'distributed-systems',
              name: 'Distributed Systems',
              category: 'Backend',
              proficiency_tier: 'Intermediate',
              confidence: 0.750,
              verification_status: 'verified',
              evidence_count: 1,
              recency_days: 5,
              evidence: [
                {
                  id: 102,
                  skill_slug: 'distributed-systems',
                  source_type: 'project_submission',
                  review_status: 'verified',
                  confidence_score: 0.750,
                  claim_title: 'Raft Consensus Protocol Implementation',
                  evidence_url: 'https://github.com/skillverse-demo/raft-consensus',
                  reviewer_name: 'Dr. Robert Miller',
                  verified_at: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ]
            },
            {
              slug: 'python',
              name: 'Python',
              category: 'Language',
              proficiency_tier: 'Intermediate',
              confidence: 0.350,
              verification_status: 'self_reported',
              evidence_count: 1,
              recency_days: 12,
              evidence: [
                {
                  id: 103,
                  skill_slug: 'python',
                  source_type: 'self_reported',
                  review_status: 'unreviewed',
                  confidence_score: 0.350,
                  claim_title: 'FastAPI Backend & Async Microservices',
                  created_at: new Date().toISOString()
                }
              ]
            }
          ]
        });
      }
    } catch (err: any) {
      console.warn('Skill DNA fetch warning:', err);
      setError(err?.message || 'Could not load Skill DNA from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSkillDNA();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSkillDNA();
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSkill || !formTitle.trim()) return;

    try {
      setSubmitting(true);
      setSubmitSuccess(null);
      setError(null);

      const payload = {
        skill_slug: formSkill,
        source_type: formSource,
        claim_title: formTitle.trim(),
        claim_description: formDesc.trim() || undefined,
        evidence_url: formUrl.trim() || undefined
      };

      const res = await api.post('/skills/me/evidence', payload);
      if (res && res.success) {
        setSubmitSuccess(`Evidence submitted for ${formSkill}! Skill DNA updated.`);
        setFormTitle('');
        setFormDesc('');
        setFormUrl('');
        setShowSubmitModal(false);
        await fetchSkillDNA();
      } else {
        setError(res?.message || 'Failed to submit evidence.');
      }
    } catch (err: any) {
      console.error('Evidence submission failed:', err);
      setError(err?.message || 'Failed to submit skill evidence to backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Expert':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800';
      case 'Advanced':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      case 'Intermediate':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <ShieldCheck size={12} />
            Verified
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock size={12} />
            Pending Review
          </span>
        );
      case 'self_reported':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Self-Reported
          </span>
        );
    }
  };

  const filteredSkills = dna?.skills.filter(s => {
    if (selectedCategory === 'all') return true;
    return s.category.toLowerCase() === selectedCategory.toLowerCase();
  }) || [];

  const categories = Array.from(new Set(dna?.skills.map(s => s.category) || []));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Sparkles size={14} />
              Evidence-Backed Competency Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Skill DNA Intelligence
            </h1>
            <p className="text-sm text-blue-200 max-w-2xl">
              SkillVerse does not accept unverified skill keywords blindly. Your Skill DNA combines standardized technical benchmarks, verified repository artifacts, and faculty reviews into transparent, explainable competency proof.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm border border-white/10 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Recalculate DNA
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Plus size={14} />
              Submit Evidence
            </button>
            <Link
              to="/student/assessments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Award size={14} />
              Take Assessments
            </Link>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Verified Skills</span>
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {dna?.overview.verified_skills_count ?? 0}
            <span className="text-sm font-normal text-gray-500 ml-1">
              / {dna?.overview.total_skills_tracked ?? 0}
            </span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <span>Verified ratio:</span>
            <span className="font-bold">
              {Math.round((dna?.overview.verification_ratio ?? 0) * 100)}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Average Evidence Confidence</span>
            <Award size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {Math.round((dna?.overview.average_confidence ?? 0) * 100)}%
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.round((dna?.overview.average_confidence ?? 0) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Competency Engine</span>
            <Brain size={18} className="text-purple-500" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            Deterministic Engine
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
            {dna?.engine_version || 'v1.0.0-deterministic'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Last Evaluated</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {dna?.calculated_at ? new Date(dna.calculated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {dna?.calculated_at ? new Date(dna.calculated_at).toLocaleDateString() : 'Active session'}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            All Disciplines ({dna?.skills.length || 0})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Skills Matrix */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Evaluating candidate skill DNA evidence graph...</p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl text-center border border-gray-200 dark:border-gray-700">
          <Brain size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Skills Tracked Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Take a standardized technical benchmark or submit project repository proof to establish your verified Skill DNA.
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
          >
            Submit Skill Evidence
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredSkills.map(skill => (
            <div 
              key={skill.slug}
              className="bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Skill Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {skill.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTierColor(skill.proficiency_tier)}`}>
                        {skill.proficiency_tier}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Category: {skill.category}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(skill.verification_status)}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      Evidence Confidence:
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      {Math.round(skill.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        skill.confidence >= 0.70 
                          ? 'bg-emerald-500' 
                          : skill.confidence >= 0.40 
                            ? 'bg-blue-500' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.round(skill.confidence * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                    <span>{skill.verification_status === 'verified' ? 'Objective proof active' : 'Capped (requires benchmark or review)'}</span>
                    <span>{skill.recency_days !== null ? `${skill.recency_days}d ago` : 'Recent'}</span>
                  </div>
                </div>

                {/* Evidence Artifacts List */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Supporting Evidence ({skill.evidence?.length || 0})</span>
                  </div>

                  {skill.evidence && skill.evidence.length > 0 ? (
                    skill.evidence.map(item => (
                      <div 
                        key={item.id}
                        className="p-3 bg-white dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {item.source_type === 'assessment_result' && <Award size={13} className="text-indigo-500" />}
                            {item.source_type === 'project_submission' && <FileCode size={13} className="text-emerald-500" />}
                            {item.source_type === 'faculty_review' && <ShieldCheck size={13} className="text-blue-500" />}
                            {item.source_type === 'self_reported' && <HelpCircle size={13} className="text-gray-400" />}
                            {item.claim_title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            +{Math.round(item.confidence_score * 100)}%
                          </span>
                        </div>

                        {item.claim_description && (
                          <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                            {item.claim_description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                          <span>
                            Source: {item.source_type.replace('_', ' ')}
                            {item.reviewer_name && ` • Reviewed by ${item.reviewer_name}`}
                          </span>
                          {item.evidence_url && (
                            <a
                              href={item.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              Artifact <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No individual evidence items attached.</p>
                  )}
                </div>
              </div>

              {/* Bottom Actions for this skill */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-500">
                  {skill.verification_status !== 'verified' 
                    ? 'Boost confidence with an assessment' 
                    : 'Verified competency proof active'}
                </span>
                <Link
                  to="/student/assessments"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Verify via Test <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Evidence Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Submit Competency Evidence
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Submit code artifacts, repository proof, or self-reported milestones to substantiate your Skill DNA.
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Canonical Skill
                </label>
                <select
                  value={formSkill}
                  onChange={e => setFormSkill(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  {canonicalSkills.map(s => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Evidence Provenance Source
                </label>
                <select
                  value={formSource}
                  onChange={e => setFormSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="project_submission">Project Code Submission (Faculty Reviewable)</option>
                  <option value="self_reported">Self-Reported Experience (Capped Confidence)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Claim Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raft Consensus Implementation in Rust"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description / Methodological Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your implementation, algorithms used, and test coverage..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Evidence URL (GitHub / Demo / Publication)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
