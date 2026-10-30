// Frontend/src/pages/ExtensionImport.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  ExternalLink, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface ExtensionDraft {
  platform: string;
  repo_url: string;
  repo_name: string;
  repo_owner: string;
  description?: string;
  topics?: string[];
  is_private?: boolean;
  primary_language?: string;
  contribution_summary?: string;
  proposed_skills?: string[];
  captured_at?: string;
  client_version?: string;
}

interface CanonicalSkill {
  id: number;
  slug: string;
  name: string;
  category: string;
}

export default function ExtensionImport() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const authLoading = isLoading;
  const navigate = useNavigate();

  const [draft, setDraft] = useState<ExtensionDraft | null>(null);
  const [canonicalSkills, setCanonicalSkills] = useState<CanonicalSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [contributionSummary, setContributionSummary] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  useEffect(() => {
    // 1. Inspect URL fragment for #draft=
    let rawDraftJson: string | null = null;
    const hash = window.location.hash;

    if (hash && hash.includes('draft=')) {
      try {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const encoded = hashParams.get('draft');
        if (encoded) {
          rawDraftJson = decodeURIComponent(encoded);
        }
      } catch (err) {
        console.error('Failed to parse draft from URL fragment:', err);
      }

      // Immediately purge fragment from browser history and URL bar for privacy
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 2. Fall back to sessionStorage if returning from login
    if (!rawDraftJson) {
      rawDraftJson = sessionStorage.getItem('skillverse_pending_extension_draft');
    }

    if (!rawDraftJson) {
      setLoading(false);
      setError('No evidence draft detected. Please use the SkillVerse Companion browser extension to capture repository metadata.');
      return;
    }

    try {
      const parsedDraft: ExtensionDraft = JSON.parse(rawDraftJson);
      if (!parsedDraft.repo_url || !parsedDraft.repo_name) {
        throw new Error('Draft payload is missing required repository fields');
      }

      setDraft(parsedDraft);
      setContributionSummary(parsedDraft.contribution_summary || '');
      setCharCount((parsedDraft.contribution_summary || '').length);

      // Save to sessionStorage in case login redirect is needed
      sessionStorage.setItem('skillverse_pending_extension_draft', JSON.stringify(parsedDraft));
    } catch (parseErr: any) {
      setError('Corrupted or invalid draft payload: ' + parseErr.message);
      setLoading(false);
      return;
    }

    // 3. Load canonical skills taxonomy
    const loadTaxonomy = async () => {
      try {
        const res = await api.get('/skills');
        if (res && res.skills && Array.isArray(res.skills)) {
          setCanonicalSkills(res.skills);

          // Smart auto-match: select matching canonical skill from topics or primary language
          if (rawDraftJson) {
            const parsed: ExtensionDraft = JSON.parse(rawDraftJson);
            const candidates = [
              ...(parsed.proposed_skills || []),
              parsed.primary_language || '',
              ...(parsed.topics || [])
            ].map(s => s.toLowerCase().trim());

            const matched = res.skills.find((s: CanonicalSkill) => 
              candidates.includes(s.slug.toLowerCase()) || 
              candidates.includes(s.name.toLowerCase())
            );

            if (matched) {
              setSelectedSkill(matched.slug);
            } else if (res.skills.length > 0) {
              setSelectedSkill(res.skills[0].slug);
            }
          }
        }
      } catch (taxErr) {
        console.error('Failed to load canonical skills:', taxErr);
      } finally {
        setLoading(false);
      }
    };

    loadTaxonomy();
  }, []);

  // Handle Authentication Check
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sign In to Import Evidence</h2>
          <p className="text-sm text-slate-400 mb-6">
            Your repository draft is securely saved. Sign in to your SkillVerse student account to confirm and submit this evidence.
          </p>
          <div className="flex gap-3">
            <Link 
              to="/auth/login?redirect=/extension/import" 
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition"
            >
              Sign In
            </Link>
            <Link 
              to="/auth/signup" 
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Role Guard: Only students can submit student evidence
  if (!authLoading && user && user.role !== 'student') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Student Account Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            Repository evidence capture is designed for student candidate profiles. You are currently signed in as a <span className="font-semibold text-slate-200">{user.role}</span>.
          </p>
          <Link 
            to="/" 
            className="inline-block py-2 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContributionSummary(val);
    setCharCount(val.length);
  };

  const handleDiscard = () => {
    sessionStorage.removeItem('skillverse_pending_extension_draft');
    navigate('/student/skill-dna');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !selectedSkill) return;

    if (!contributionSummary.trim()) {
      setError('Please provide a contribution summary explaining what you built.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setDuplicateNotice(null);

    const payload = {
      skill_slug: selectedSkill,
      source_type: 'project_submission',
      title: `GitHub: ${draft.repo_owner}/${draft.repo_name}`,
      description: contributionSummary.trim(),
      source_reference: draft.repo_url,
      metadata: {
        platform: 'github',
        repo_name: draft.repo_name,
        repo_owner: draft.repo_owner,
        repo_url: draft.repo_url,
        description: draft.description || '',
        topics: draft.topics || [],
        is_private: draft.is_private || false,
        primary_language: draft.primary_language || '',
        captured_at: draft.captured_at || new Date().toISOString(),
        client_version: '1.0.0'
      }
    };

    try {
      const response = await api.post('/candidates/me/evidence', payload);
      sessionStorage.removeItem('skillverse_pending_extension_draft');

      if (response && response.success) {
        if (response.duplicate_detected) {
          setDuplicateNotice(response.message);
        }
        setSuccessResult(response.evidence || response);
      } else {
        throw new Error(response?.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Evidence submission error:', err);
      if (err.status === 409) {
        setError('Duplicate Notice: ' + (err.message || 'This repository was previously reviewed.'));
      } else {
        setError(err.message || 'Failed to submit evidence. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Verifying repository draft schema...</p>
        </div>
      </div>
    );
  }

  if (successResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Evidence Recorded!</h2>
          <p className="text-sm text-slate-400 text-center mb-6">
            Your repository submission has entered the formal evaluation pipeline.
          </p>

          {duplicateNotice && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>{duplicateNotice}</span>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Repository</span>
              <span className="font-mono text-indigo-300">{draft?.repo_owner}/{draft?.repo_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Review Status</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pending Faculty Review
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Baseline Confidence</span>
              <span className="font-semibold text-slate-200">0.350 (Unreviewed Project)</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-xs text-indigo-200 mb-6 flex gap-2.5">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-400 mt-0.5" />
            <span>
              Your assigned faculty advisor will review your code contribution. Upon faculty approval, confidence will elevate to <strong className="text-white">0.750 (Verified Project)</strong>.
            </span>
          </div>

          <div className="flex gap-3">
            <Link 
              to="/student/skill-dna" 
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm text-center transition flex items-center justify-center gap-2"
            >
              <span>View in Skill DNA</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            SkillVerse Companion Transfer
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Review Project Evidence</h1>
          <p className="text-sm text-slate-400 mt-1">
            Confirm repository metadata and link it to a canonical skill in your competency profile.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {draft && (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Repository Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{draft.repo_owner} / {draft.repo_name}</h3>
                    {draft.is_private ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Public
                      </span>
                    )}
                  </div>
                  <a 
                    href={draft.repo_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 font-mono"
                  >
                    <span>{draft.repo_url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {draft.description && (
                <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80 leading-relaxed">
                  {draft.description}
                </p>
              )}

              {draft.topics && draft.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {draft.topics.map(t => (
                    <span key={t} className="text-[11px] font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Canonical Skill Selection */}
            <div className="space-y-2">
              <label htmlFor="skill-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Canonical Competency Target <span className="text-rose-400">*</span>
              </label>
              <select
                id="skill-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {canonicalSkills.map(skill => (
                  <option key={skill.slug} value={skill.slug}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                The SkillVerse competence that this project demonstrates.
              </p>
            </div>

            {/* Contribution Summary */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="contribution-summary" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Your Contribution Summary <span className="text-rose-400">*</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">{charCount}/2000</span>
              </div>
              <textarea
                id="contribution-summary"
                rows={4}
                maxLength={2000}
                required
                value={contributionSummary}
                onChange={handleSummaryChange}
                placeholder="Explain what components you authored, architecture decisions, and challenges solved..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
              <p className="text-xs text-slate-500">
                Be specific about your contributions. Your faculty advisor will evaluate this description during review.
              </p>
            </div>

            {/* Transparency / Consent Notice */}
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Evidence Lifecycle Policy</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>This project will be submitted with initial status <strong className="text-slate-200">Pending Review</strong>.</li>
                <li>Baseline confidence weight is <strong className="text-slate-200">0.350</strong> (unreviewed project).</li>
                <li>Does not automatically grant a verified Skill DNA tier until reviewed by faculty.</li>
                <li>Raw source code is not extracted or stored on SkillVerse servers.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="order-2 sm:order-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Discard Draft</span>
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedSkill || !contributionSummary.trim()}
                className="order-1 sm:order-2 flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Submit Evidence</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
