// Frontend/src/components/StudentPilotConsentCard.tsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  LogOut,
  Info,
  Check,
  Building2
} from 'lucide-react';
import { api } from '../services/api';

export interface StudentPilotStatusResponse {
  is_pilot_participant: boolean;
  active_enrollment: {
    id: number;
    pilot_program_id: number;
    candidate_id: number;
    consent_status: 'opted_in' | 'withdrawn' | 'declined';
    consent_version_accepted: string;
    consented_at: string;
    withdrawn_at: string | null;
    status: string;
    pilot_program_name?: string;
    pilot_program_code?: string;
    program_status?: string;
    active_notice_version?: string;
    consent_notice_text?: string;
  } | null;
  institution_id: number | null;
  institution_name: string | null;
  enrollments: Array<any>;
  available_programs: Array<{
    id: number;
    name: string;
    code: string;
    target_engine_version: string;
    consent_notice_version: string;
    consent_notice_text: string;
    start_date: string | null;
    end_date: string | null;
  }>;
}

interface Props {
  onStatusChange?: (status: StudentPilotStatusResponse) => void;
}

export default function StudentPilotConsentCard({ onStatusChange }: Props) {
  const [data, setData] = useState<StudentPilotStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Opt-in UI State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submittingOptIn, setSubmittingOptIn] = useState(false);
  const [showNoticeDetails, setShowNoticeDetails] = useState(false);

  // Withdrawal UI State
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean } & StudentPilotStatusResponse>('/student/pilot/status');
      if (res && res.success !== false) {
        setData(res);
        if (onStatusChange) onStatusChange(res);
      }
    } catch (err: any) {
      console.warn('Could not load student pilot status:', err);
      // Fail gracefully: student can still use standard roadmap
      setError(err?.message || 'Could not load pilot status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleOptIn = async (programId: number, noticeVersion: string) => {
    if (!agreedToTerms) {
      setError('Please confirm that you have read and agreed to the participation notice.');
      return;
    }

    try {
      setSubmittingOptIn(true);
      setError(null);
      setSuccessMsg(null);

      const res = await api.post('/student/pilot/consent', {
        pilot_program_id: programId,
        consent_notice_version: noticeVersion
      });

      if (res && res.success) {
        setSuccessMsg('Successfully opted in to the AI recommendation pilot program! Telemetry from your roadmap interactions will be attributed to the pilot.');
        setAgreedToTerms(false);
        await loadStatus();
      }
    } catch (err: any) {
      console.error('Failed to opt in to pilot:', err);
      setError(err?.message || 'Failed to submit pilot consent');
    } finally {
      setSubmittingOptIn(false);
    }
  };

  const handleWithdraw = async (programId: number) => {
    try {
      setSubmittingWithdraw(true);
      setError(null);
      setSuccessMsg(null);

      const res = await api.post('/student/pilot/withdraw', {
        pilot_program_id: programId,
        withdrawal_reason: withdrawalReason.trim() || null
      });

      if (res && res.success) {
        setSuccessMsg('You have voluntarily withdrawn from the pilot. All future interactions will not be attributed to the pilot, and your roadmap access continues normally.');
        setShowWithdrawConfirm(false);
        setWithdrawalReason('');
        await loadStatus();
      }
    } catch (err: any) {
      console.error('Failed to withdraw from pilot:', err);
      setError(err?.message || 'Failed to process voluntary withdrawal');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-500 flex items-center justify-center gap-2">
        <RefreshCw size={14} className="animate-spin text-indigo-500" />
        <span>Checking pilot enrollment status...</span>
      </div>
    );
  }

  if (!data) return null;

  const isEnrolled = Boolean(data.is_pilot_participant && data.active_enrollment);
  const activeProg = data.available_programs && data.available_programs[0];
  const lastEnrollment = data.enrollments && data.enrollments[0];
  const isWithdrawn = Boolean(!isEnrolled && lastEnrollment && lastEnrollment.consent_status === 'withdrawn');

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 dark:from-gray-800 dark:via-gray-800/90 dark:to-indigo-950/20 p-5 shadow-xs space-y-4">
      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STATE A: CURRENTLY ACTIVE PILOT PARTICIPANT */}
      {isEnrolled && data.active_enrollment && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Active Pilot Participant
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Enrolled
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {data.active_enrollment.pilot_program_name || 'AI Learning Recommendation Pilot'} &bull; Consented on {new Date(data.active_enrollment.consented_at).toLocaleDateString()} (Notice {data.active_enrollment.consent_version_accepted})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWithdrawConfirm(!showWithdrawConfirm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors shrink-0"
            >
              <LogOut size={13} />
              <span>Withdraw from Pilot</span>
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 leading-relaxed">
            Your recommendation impressions, activity progress, and explicit ratings are actively tagged with genuine <strong>&apos;pilot&apos;</strong> provenance to evaluate recommendation effectiveness. Thank you for participating in learning science research.
          </p>

          {/* Withdrawal Confirmation Dialog */}
          {showWithdrawConfirm && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">Confirm Voluntary Withdrawal</h4>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    Withdrawal is immediate and voluntary. Future recommendation interactions will no longer be attributed to the pilot. Your normal development roadmap, learning catalogue, and skill assessments will continue completely unaffected.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Reason for withdrawing (optional):
                </label>
                <input
                  type="text"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  placeholder="e.g. Schedule constraints, preference for standard telemetry"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWithdrawConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingWithdraw}
                  onClick={() => handleWithdraw(data.active_enrollment!.pilot_program_id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submittingWithdraw ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE B: ELIGIBLE WITH ACTIVE PILOT AVAILABLE (NOT YET CONSENTED OR PREVIOUSLY WITHDRAWN) */}
      {!isEnrolled && activeProg && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 mt-0.5">
                <Users size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Voluntary AI Recommendation Pilot Program
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-semibold">
                    {activeProg.code}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span>{data.institution_name || 'Your Institution'} &bull; Notice Version: {activeProg.consent_notice_version}</span>
                </p>
              </div>
            </div>

            {isWithdrawn && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 shrink-0">
                Previously Withdrawn
              </span>
            )}
          </div>

          {/* Key Transparency Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>What is tracked:</strong> Roadmap recommendations shown, activity milestones, and voluntary 1-5 star relevance feedback.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Purpose:</strong> Evaluating recommendation algorithm accuracy and identifying curriculum bottlenecks.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Privacy Protected:</strong> Institutional administrators only view aggregate data (k &ge; 5 privacy threshold).</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>100% Voluntary:</strong> You may decline or withdraw anytime. Your normal learning roadmaps are never blocked.</span>
            </div>
          </div>

          {/* Notice Text Collapsible */}
          <div className="text-xs">
            <button
              type="button"
              onClick={() => setShowNoticeDetails(!showNoticeDetails)}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <FileText size={12} />
              <span>{showNoticeDetails ? 'Hide Formal Participation Notice' : 'Read Full Participation Notice'}</span>
              {showNoticeDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showNoticeDetails && (
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[11px] leading-relaxed">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Notice Draft — Pending Institutional Ethics & IRB Review
                </div>
                {activeProg.consent_notice_text}
              </div>
            )}
          </div>

          {/* Opt-In Submission Form */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>I have read the terms and voluntarily agree to participate.</span>
            </label>

            <button
              type="button"
              disabled={!agreedToTerms || submittingOptIn}
              onClick={() => handleOptIn(activeProg.id, activeProg.consent_notice_version)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <ShieldCheck size={14} />
              <span>{submittingOptIn ? 'Opting In...' : isWithdrawn ? 'Re-enroll in Pilot' : 'Opt In to Pilot'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE C: NO ACTIVE PROGRAM AT CANDIDATE'S INSTITUTION */}
      {!isEnrolled && !activeProg && (
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-indigo-400 shrink-0" />
            <span>
              <strong>Controlled Pilot Status:</strong> No active AI recommendation pilot program is currently open for {data.institution_name || 'your institution'}. Standard recommendation engine is active.
            </span>
          </div>
          {isWithdrawn && (
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[11px] shrink-0">
              Withdrawn
            </span>
          )}
        </div>
      )}
    </div>
  );
}
