// Frontend/src/components/PilotProgramManager.tsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Play, 
  Archive, 
  RefreshCw, 
  FileText, 
  Building2, 
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

export interface PilotProgram {
  id: number;
  institution_id: number;
  name: string;
  code: string;
  status: 'draft' | 'active' | 'concluded' | 'archived';
  target_engine_version: string;
  target_model_version: string;
  consent_notice_version: string;
  consent_notice_text: string;
  created_by_user_id: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  institution_name?: string;
  institution_code?: string;
  total_enrolled: number;
  active_participants: number;
  withdrawn_participants: number;
}

interface Props {
  role: 'super_admin' | 'college_admin';
  institutionId?: number;
  onProgramChange?: () => void;
}

export default function PilotProgramManager({ role, institutionId, onProgramChange }: Props) {
  const [programs, setPrograms] = useState<PilotProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);

  // Modal State for New Pilot Program
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    institution_id: institutionId ? String(institutionId) : '',
    name: '',
    code: '',
    consent_notice_version: 'v1.0',
    consent_notice_text: 'I voluntarily agree to participate in the SkillVerse AI recommendation pilot. My recommendation interactions and explicit feedback will be collected to evaluate algorithmic effectiveness. I understand that participation is voluntary and I can withdraw at any time without affecting my access to ordinary learning resources or my academic standing.',
    target_engine_version: 'v2.0.0-ai-semantic-recommendation',
    target_model_version: 'all-MiniLM-L6-v2',
    start_date: '',
    end_date: ''
  });

  // Action Loading state per program
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = institutionId ? `?institution_id=${institutionId}` : '';
      const res = await api.get<{ success: boolean; programs: PilotProgram[] }>(`/pilot/programs${query}`);
      if (res && res.programs) {
        setPrograms(res.programs);
      }
    } catch (err: any) {
      console.error('Failed to load pilot programs:', err);
      setError(err?.message || 'Failed to load pilot programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, [institutionId]);

  const handleStatusTransition = async (programId: number, newStatus: 'active' | 'concluded' | 'archived') => {
    try {
      setActionLoadingId(programId);
      setError(null);
      setSuccessMsg(null);

      const res = await api.patch<{ success: boolean; program: PilotProgram }>(
        `/pilot/programs/${programId}/status`,
        { status: newStatus }
      );

      if (res && res.success) {
        setSuccessMsg(`Pilot program successfully updated to "${newStatus}".`);
        await loadPrograms();
        if (onProgramChange) onProgramChange();
      }
    } catch (err: any) {
      console.error('Failed to transition program status:', err);
      setError(err?.message || 'Failed to update pilot program status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const payload: any = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        consent_notice_version: formData.consent_notice_version.trim() || 'v1.0',
        consent_notice_text: formData.consent_notice_text.trim(),
        target_engine_version: formData.target_engine_version,
        target_model_version: formData.target_model_version,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (role === 'super_admin') {
        if (!formData.institution_id) {
          setError('Institution ID is required for Super Admin pilot creation.');
          setSubmitting(false);
          return;
        }
        payload.institution_id = parseInt(formData.institution_id, 10);
      } else if (institutionId) {
        payload.institution_id = institutionId;
      }

      const res = await api.post<{ success: boolean; program: PilotProgram }>('/pilot/programs', payload);

      if (res && res.success) {
        setSuccessMsg(`Pilot program "${payload.name}" successfully created in draft status.`);
        setShowCreateModal(false);
        setFormData({
          institution_id: institutionId ? String(institutionId) : '',
          name: '',
          code: '',
          consent_notice_version: 'v1.0',
          consent_notice_text: 'I voluntarily agree to participate in the SkillVerse AI recommendation pilot. My recommendation interactions and explicit feedback will be collected to evaluate algorithmic effectiveness. I understand that participation is voluntary and I can withdraw at any time without affecting my access to ordinary learning resources or my academic standing.',
          target_engine_version: 'v2.0.0-ai-semantic-recommendation',
          target_model_version: 'all-MiniLM-L6-v2',
          start_date: '',
          end_date: ''
        });
        await loadPrograms();
        if (onProgramChange) onProgramChange();
      }
    } catch (err: any) {
      console.error('Failed to create pilot program:', err);
      setError(err?.message || 'Failed to create pilot program');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: PilotProgram['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock size={12} />
            Draft (Setup)
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active (Accepting Participants)
          </span>
        );
      case 'concluded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckSquare size={12} />
            Concluded
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
            <Archive size={12} />
            Archived
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
              Controlled Student Pilot Programs
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              Multi-Tenant Governance
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Authoritative lifecycle management for voluntary student recommendation pilots. Only active programs accept student opt-ins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPrograms}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Refresh programs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={14} />
            Create Pilot Program
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Programs List */}
      {loading && programs.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-indigo-500" />
          <span>Loading pilot programs...</span>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
          <Users size={24} className="mx-auto text-gray-400" />
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">No Pilot Programs Configured</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Create a pilot program to invite students to evaluate AI recommendations with explicit consent and server-controlled telemetry attribution.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
          >
            <Plus size={12} /> Create First Program
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => {
            const isNoticeExpanded = expandedNoticeId === program.id;
            const isActing = actionLoadingId === program.id;

            return (
              <div
                key={program.id}
                className="p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {program.name}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                        {program.code}
                      </span>
                      {getStatusBadge(program.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} />
                        {program.institution_name || `Institution #${program.institution_id}`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        Created {new Date(program.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        Notice Version: <strong>{program.consent_notice_version}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Lifecycle Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {program.status === 'draft' && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleStatusTransition(program.id, 'active')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                      >
                        <Play size={12} />
                        {isActing ? 'Activating...' : 'Activate Pilot'}
                      </button>
                    )}

                    {program.status === 'active' && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleStatusTransition(program.id, 'concluded')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                      >
                        <CheckSquare size={12} />
                        {isActing ? 'Concluding...' : 'Conclude Pilot'}
                      </button>
                    )}

                    {program.status === 'concluded' && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleStatusTransition(program.id, 'archived')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                      >
                        <Archive size={12} />
                        {isActing ? 'Archiving...' : 'Archive Pilot'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Enrollment Metrics Counter Bar */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 text-center">
                  <div>
                    <div className="text-base font-bold text-gray-900 dark:text-white">
                      {program.total_enrolled}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Total Consented
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {program.active_participants}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Active Opted-In
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                      {program.withdrawn_participants}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Voluntarily Withdrawn
                    </div>
                  </div>
                </div>

                {/* Notice Text Collapsible */}
                <div className="text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedNoticeId(isNoticeExpanded ? null : program.id)}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <FileText size={12} />
                    <span>{isNoticeExpanded ? 'Hide Participation Notice' : 'View Participation Notice'}</span>
                    {isNoticeExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isNoticeExpanded && (
                    <div className="mt-2 p-3.5 rounded-lg bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 leading-relaxed font-mono text-[11px]">
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Notice Draft — Pending Institutional Ethics & IRB Review
                      </div>
                      {program.consent_notice_text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Pilot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Create Controlled Pilot Program
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {role === 'super_admin' && (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Institution ID *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.institution_id}
                    onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pilot Program Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Spring 2026 AI Learning Recommendation Pilot"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Program Code (Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. APEX_AI_SPRING_2026"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Engine Version
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.target_engine_version}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Consent Notice Version *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.consent_notice_version}
                    onChange={(e) => setFormData({ ...formData, consent_notice_version: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Participation Notice Text *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.consent_notice_text}
                  onChange={(e) => setFormData({ ...formData, consent_notice_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-[11px]"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  The exact text students must review and accept during voluntary opt-in.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Draft Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
