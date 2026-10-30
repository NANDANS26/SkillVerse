// Frontend/src/pages/faculty/FacultyStudents.tsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Sparkles,
  Save,
  ShieldCheck,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const mockDemoFacultyStudents = [
  {
    user_id: 101,
    name: 'Maya Lin',
    email: 'maya.lin@apex.edu',
    headline: 'Distributed Systems & Go Engineer',
    experience_years: 2.0,
    skills: ['Go', 'Kubernetes', 'Docker', 'Raft Consensus'],
    mentorship_status: 'active',
    notes: 'Midterm milestone completed: Raft cluster deployed with 99.9% fault tolerance.',
    assigned_at: '2026-09-01T10:00:00Z'
  },
  {
    user_id: 102,
    name: 'Alex Chen',
    email: 'alex.chen@apex.edu',
    headline: 'Machine Learning & NLP Specialist',
    experience_years: 1.5,
    skills: ['Python', 'PyTorch', 'FAISS', 'FastAPI'],
    mentorship_status: 'reviewed',
    notes: 'Vector index integration complete with SentenceTransformer embedding pipeline.',
    assigned_at: '2026-09-15T10:00:00Z'
  }
];

const mockDemoPendingEvidence = [
  {
    id: 901,
    candidate_id: 101,
    student_name: 'Maya Lin',
    student_email: 'maya.lin@apex.edu',
    skill_slug: 'distributed-systems',
    source_type: 'project_submission',
    claim_title: 'Raft Consensus Implementation with Leader Election',
    claim_description: 'Implemented 3-node fault tolerant consensus in Go, passes network split recovery tests.',
    evidence_url: 'https://github.com/maya-lin/go-raft-consensus',
    created_at: new Date().toISOString()
  }
];

export default function FacultyStudents() {
  const { isDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'roster' | 'evidence'>('roster');
  const [students, setStudents] = useState<any[]>([]);
  const [pendingEvidence, setPendingEvidence] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  // Reviewing modal / state for evidence
  const [reviewingEvidenceId, setReviewingEvidenceId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const loadData = async () => {
    if (isDemoMode) {
      setStudents(mockDemoFacultyStudents);
      setPendingEvidence(mockDemoPendingEvidence);
      return;
    }

    try {
      setLoading(true);
      // Load assigned students
      const res = await api.get('/faculty/students');
      if (res && res.success && Array.isArray(res.students)) {
        setStudents(res.students);
      } else {
        setStudents([]);
      }

      // Load pending evidence
      const evRes = await api.get('/skills/faculty/pending');
      if (evRes && evRes.success && Array.isArray(evRes.pending_evidence)) {
        setPendingEvidence(evRes.pending_evidence);
      } else {
        setPendingEvidence([]);
      }
    } catch (err) {
      console.warn('Failed to load faculty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleStartEdit = (student: any) => {
    setEditingStudentId(student.user_id);
    setEditNotes(student.notes || '');
    setEditStatus(student.mentorship_status || 'active');
  };

  const handleSaveNotes = async (studentUserId: number) => {
    setFeedback(null);
    if (isDemoMode) {
      setStudents(prev =>
        prev.map(s =>
          s.user_id === studentUserId ? { ...s, notes: editNotes, mentorship_status: editStatus } : s
        )
      );
      setEditingStudentId(null);
      setFeedback({ type: 'success', text: '(Demo Exploration) Mentorship notes saved in browser session.' });
      return;
    }

    try {
      const res = await api.patch(`/faculty/student/${studentUserId}/notes`, {
        notes: editNotes,
        status: editStatus
      });

      if (res && res.success) {
        setFeedback({ type: 'success', text: 'Mentorship review notes saved to PostgreSQL!' });
        setEditingStudentId(null);
        await loadData();
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Failed to save notes' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating mentorship notes' });
    }
  };

  const handleReviewEvidence = async (evidenceId: number, decision: 'verified' | 'rejected') => {
    setFeedback(null);
    try {
      setSubmittingReview(true);
      if (isDemoMode) {
        setPendingEvidence(prev => prev.filter(e => e.id !== evidenceId));
        setReviewingEvidenceId(null);
        setReviewNotes('');
        setFeedback({
          type: 'success',
          text: `(Demo Exploration) Evidence ${decision === 'verified' ? 'verified' : 'rejected'}. Student Skill DNA updated.`
        });
        return;
      }

      const res = await api.patch(`/skills/faculty/evidence/${evidenceId}/review`, {
        decision,
        notes: reviewNotes.trim() || undefined
      });

      if (res && res.success) {
        setFeedback({
          type: 'success',
          text: `Evidence ${decision === 'verified' ? 'verified' : 'rejected'} successfully! Candidate Skill DNA updated.`
        });
        setReviewingEvidenceId(null);
        setReviewNotes('');
        await loadData();
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Failed to review evidence' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Error reviewing candidate evidence' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.headline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-lg">
              <Users size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Faculty Mentorship Portal
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Evaluate assigned mentee students, record advisory feedback, and review Skill DNA code proof.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Assigned Mentees ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Skill Evidence Queue</span>
            {pendingEvidence.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-white text-[10px] font-bold">
                {pendingEvidence.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing simulated faculty mentee records and pending evidence.
          </span>
        </div>
      )}

      {feedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {activeTab === 'evidence' ? (
        /* Tab 2: Pending Evidence Reviews */
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck size={20} className="text-teal-400" />
              Skill DNA Evidence Verification Queue
            </h2>
            <p className="text-xs text-teal-200 mt-1 max-w-2xl">
              Assigned mentees submit engineering artifacts (code repos, benchmarks) for faculty verification. Approving evidence elevates their Skill DNA confidence score to 0.750, providing recruiters with verified proof.
            </p>
          </div>

          {pendingEvidence.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <ShieldCheck className="h-10 w-10 text-teal-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No Pending Evidence Reviews
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                All submitted competency claims from your assigned mentees have been evaluated.
              </p>
            </div>
          ) : (
            pendingEvidence.map(ev => (
              <div
                key={ev.id}
                className="bg-white dark:bg-gray-800/60 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {ev.claim_title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-mono text-xs font-semibold">
                        {ev.skill_slug}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted by: <strong className="text-gray-900 dark:text-white">{ev.student_name}</strong> ({ev.student_email}) • {new Date(ev.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.evidence_url && (
                      <a
                        href={ev.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ExternalLink size={12} />
                        <span>Inspect Repo</span>
                      </a>
                    )}
                    <button
                      onClick={() => setReviewingEvidenceId(ev.id)}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
                    >
                      Evaluate Evidence
                    </button>
                  </div>
                </div>

                {ev.claim_description && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-semibold block mb-0.5 text-gray-500">Student Claim & Methodology:</span>
                    {ev.claim_description}
                  </div>
                )}

                {/* Review Form Drawer */}
                {reviewingEvidenceId === ev.id && (
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-3">
                    <div className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      Record Faculty Verification Decision:
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Add evaluation feedback, code quality comments, or reasons for decision..."
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewingEvidenceId(null)}
                        className="px-3 py-1.5 rounded-xl text-xs text-gray-600 dark:text-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submittingReview}
                        onClick={() => handleReviewEvidence(ev.id, 'rejected')}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        <span>Reject Claim</span>
                      </button>
                      <button
                        type="button"
                        disabled={submittingReview}
                        onClick={() => handleReviewEvidence(ev.id, 'verified')}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 shadow-sm"
                      >
                        <ShieldCheck size={13} />
                        <span>Verify & Approve (0.750 Confidence)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Tab 1: Mentees Roster */
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search mentees by name, technical skills, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-4">
            {filteredStudents.map((s) => (
              <div
                key={s.user_id}
                className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {s.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.mentorship_status === 'reviewed'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {s.mentorship_status === 'reviewed' ? 'Reviewed ✓' : 'Active Mentee'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {s.headline || 'Software Engineering Student'} • {s.experience_years ?? 0} yrs exp
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.email} • Assigned {s.assigned_at ? new Date(s.assigned_at).toLocaleDateString() : 'Active'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartEdit(s)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold transition-colors self-start"
                  >
                    <Edit3 size={13} />
                    <span>Update Notes</span>
                  </button>
                </div>

                {/* Skills */}
                {Array.isArray(s.skills) && s.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {s.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-medium border border-teal-200 dark:border-teal-800/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mentorship Notes Card / Edit Form */}
                {editingStudentId === s.user_id ? (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Faculty Progress Evaluation Notes
                      </span>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="px-2 py-1 text-xs rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                      >
                        <option value="active">Status: Active</option>
                        <option value="reviewed">Status: Reviewed</option>
                        <option value="completed">Status: Completed</option>
                      </select>
                    </div>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      placeholder="Record progress milestone, architectural feedback, and recommendations..."
                      className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingStudentId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNotes(s.user_id)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <Save size={13} />
                        <span>Save Notes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs">
                    <span className="font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                      Advisory Notes:
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      {s.notes || 'No faculty advisory notes recorded yet. Click "Update Notes" to record an evaluation.'}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {filteredStudents.length === 0 && !loading && (
              <div className="text-center py-16 bg-white dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  No assigned mentee students found
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Your college administrator has not yet assigned any students to your faculty mentorship roster.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
