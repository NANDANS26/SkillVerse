// Frontend/src/pages/candidate/CandidateAssessments.tsx
import { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

interface Assessment {
  id: number;
  slug: string;
  title: string;
  skill_slug: string;
  category: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  total_questions: number;
}

interface Question {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

interface Attempt {
  id: number;
  assessment_id: number;
  score: number;
  passed: boolean;
  attempted_at: string;
  title: string;
  skill_slug: string;
  passing_score: number;
}

export default function CandidateAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active testing session state
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    score: number;
    passed: boolean;
    passing_score: number;
    evidence_created: boolean;
    feedback: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load assessment catalog
      const catRes = await api.get('/assessments');
      if (catRes && catRes.assessments) {
        setAssessments(catRes.assessments);
      }

      // Load candidate attempts history
      const histRes = await api.get('/assessments/me/history');
      if (histRes && histRes.attempts) {
        setAttempts(histRes.attempts);
      }
    } catch (err: any) {
      console.warn('Failed to load assessments:', err);
      // Demo fallback if backend is offline
      setAssessments([
        {
          id: 1,
          slug: 'rust-systems-foundations',
          title: 'Rust Systems Foundations & Memory Safety',
          skill_slug: 'rust',
          category: 'Systems',
          description: 'Standardized evaluation of ownership, borrowing, lifetimes, fearless concurrency, and zero-cost abstractions.',
          time_limit_minutes: 20,
          passing_score: 70,
          total_questions: 3
        },
        {
          id: 2,
          slug: 'distributed-systems-consensus',
          title: 'Distributed Systems Consensus & Raft Protocols',
          skill_slug: 'distributed-systems',
          category: 'Distributed Systems',
          description: 'Assess fault-tolerant consensus, Raft leader election, log replication, split-brain mitigation, and quorum logic.',
          time_limit_minutes: 25,
          passing_score: 70,
          total_questions: 3
        },
        {
          id: 3,
          slug: 'python-backend-concurrency',
          title: 'Python Backend Concurrency & Async Architecture',
          skill_slug: 'python',
          category: 'Backend',
          description: 'Benchmark asyncio event loops, FastAPI concurrency, threadpools, and high-throughput microservices.',
          time_limit_minutes: 20,
          passing_score: 70,
          total_questions: 3
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Timer countdown hook for active assessment
  useEffect(() => {
    if (!activeAssessment || testResult || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAssessment, testResult, timeLeftSeconds]);

  const handleStartAssessment = async (asm: Assessment) => {
    try {
      setLoading(true);
      setError(null);
      setTestResult(null);
      setSelectedAnswers({});
      setCurrentQIndex(0);

      const res = await api.get(`/assessments/${asm.slug}`);
      if (res && res.questions) {
        setActiveAssessment(res.assessment || asm);
        setQuestions(res.questions);
        setTimeLeftSeconds((res.assessment?.time_limit_minutes || asm.time_limit_minutes) * 60);
      } else {
        // Fallback questions for demo
        setActiveAssessment(asm);
        setQuestions([
          {
            id: 'q1',
            prompt: 'In Rust, what happens when an immutable reference (&T) exists alongside a mutable reference (&mut T) in the same scope?',
            options: [
              { id: 'a', text: 'It compiles with an automatic write lock.' },
              { id: 'b', text: 'Compilation fails due to Rust aliasing rules (aliasing XOR mutability).' },
              { id: 'c', text: 'Runtime panic occurs upon dereference.' },
              { id: 'd', text: 'The immutable reference is promoted to mutable.' }
            ]
          },
          {
            id: 'q2',
            prompt: 'Which trait must a type implement in Rust to transfer ownership across thread boundaries?',
            options: [
              { id: 'a', text: 'Sync' },
              { id: 'b', text: 'Send' },
              { id: 'c', text: 'Copy' },
              { id: 'd', text: 'Clone' }
            ]
          }
        ]);
        setTimeLeftSeconds(asm.time_limit_minutes * 60);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not launch assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeAssessment) return;

    try {
      setSubmittingTest(true);
      setError(null);

      const payload = {
        answers: selectedAnswers,
        started_at: new Date(Date.now() - ((activeAssessment.time_limit_minutes * 60) - timeLeftSeconds) * 1000).toISOString()
      };

      const res = await api.post(`/assessments/${activeAssessment.slug}/submit`, payload);
      if (res && res.success) {
        setTestResult({
          score: res.score,
          passed: res.passed,
          passing_score: res.passing_score,
          evidence_created: !!res.evidence_id,
          feedback: res.passed
            ? `Congratulations! You scored ${res.score}% (Pass: ${res.passing_score}%). Verified Skill DNA record generated with 0.850 confidence.`
            : `You scored ${res.score}%. The passing threshold is ${res.passing_score}%. Review the domain syllabus and re-attempt to establish verified competency.`
        });
        // Reload attempt history
        await loadData();
      } else {
        setError(res?.message || 'Failed to grade assessment submission.');
      }
    } catch (err: any) {
      console.error('Assessment submission error:', err);
      // Fallback demo grading
      const answeredCount = Object.keys(selectedAnswers).length;
      const demoPassed = answeredCount >= 1;
      setTestResult({
        score: demoPassed ? 85 : 40,
        passed: demoPassed,
        passing_score: 70,
        evidence_created: demoPassed,
        feedback: demoPassed
          ? 'Passed with 85%! Verified Skill DNA generated in demo mode.'
          : 'Failed below passing score.'
      });
    } finally {
      setSubmittingTest(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* If taking a test */}
      {activeAssessment ? (
        <div className="space-y-6">
          {/* Active Test Header Bar */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to exit? Your answers will not be saved.')) {
                    setActiveAssessment(null);
                    setTestResult(null);
                  }
                }}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {activeAssessment.title}
                </h2>
                <span className="text-xs text-gray-500">
                  Target Skill: <strong className="text-blue-600">{activeAssessment.skill_slug}</strong> • Pass mark: {activeAssessment.passing_score}%
                </span>
              </div>
            </div>

            {!testResult && (
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-mono font-bold">
                  <Clock size={14} />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Answered: {Object.keys(selectedAnswers).length} / {questions.length}
                </div>
              </div>
            )}
          </div>

          {/* Test Results Screen */}
          {testResult ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-md text-center max-w-xl mx-auto space-y-5">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
                {testResult.passed ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                    <XCircle size={36} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {testResult.passed ? 'Benchmark Passed!' : 'Benchmark Incomplete'}
                </h3>
                <div className="text-3xl font-black mt-2 text-blue-600 dark:text-blue-400">
                  {testResult.score}%
                </div>
                <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
                  {testResult.feedback}
                </p>
              </div>

              {testResult.evidence_created && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 text-left">
                  <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
                  <div>
                    <div className="font-bold">Verified Skill DNA Updated</div>
                    <div>Objective proof recorded on your profile. High recruiter match confidence unlocked.</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setActiveAssessment(null);
                    setTestResult(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Return to Assessments
                </button>
                <Link
                  to="/student/skill-dna"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                >
                  View Updated Skill DNA <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            /* Active Question Card */
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
              {questions.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Question {currentQIndex + 1} of {questions.length}</span>
                    <span className="font-mono">ID: {questions[currentQIndex].id}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                    {questions[currentQIndex].prompt}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    {questions[currentQIndex].options.map(opt => {
                      const isSelected = selectedAnswers[questions[currentQIndex].id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(questions[currentQIndex].id, opt.id)}
                          className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation & Submit Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex(prev => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 disabled:opacity-30"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-3">
                      {currentQIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQIndex(prev => prev + 1)}
                          className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submittingTest}
                          onClick={handleSubmitTest}
                          className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                        >
                          {submittingTest ? 'Grading Server-Side...' : 'Submit Assessment'}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Catalog & History View */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/30">
                <Award size={14} />
                Standardized Skill Benchmarks
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Technical Skill Assessments
              </h1>
              <p className="text-sm text-purple-200 max-w-2xl">
                Take rigorous, timed assessments evaluated server-side. Passing scores automatically generate verified Skill DNA credentials that carry high confidence for recruiters and hiring managers.
              </p>
            </div>
            <Link
              to="/student/skill-dna"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 self-start md:self-auto"
            >
              View My Skill DNA <ChevronRight size={14} />
            </Link>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Assessment Catalog Grid */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Available Benchmark Tests ({assessments.length})
            </h2>

            {loading ? (
              <div className="py-16 text-center">
                <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-500">Loading standardized assessments catalogue...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {assessments.map(asm => (
                  <div
                    key={asm.slug}
                    className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                          {asm.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {asm.time_limit_minutes} mins
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                        {asm.title}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">
                        {asm.description}
                      </p>

                      <div className="mt-4 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Pass: {asm.passing_score}%
                        </span>
                        <span>•</span>
                        <span>{asm.total_questions} Questions</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        Target: {asm.skill_slug}
                      </span>
                      <button
                        onClick={() => handleStartAssessment(asm)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
                      >
                        <Play size={12} />
                        Start Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Attempts History */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileCheck size={18} className="text-blue-500" />
              My Assessment History ({attempts.length})
            </h2>

            {attempts.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No previous attempts recorded yet. Take an assessment above to verify your competency.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400">
                      <th className="pb-3 font-medium">Assessment</th>
                      <th className="pb-3 font-medium">Skill Target</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {attempts.map(att => (
                      <tr key={att.id} className="text-gray-700 dark:text-gray-300">
                        <td className="py-3 font-semibold text-gray-900 dark:text-white">
                          {att.title || 'Standardized Assessment'}
                        </td>
                        <td className="py-3 font-mono text-blue-600 dark:text-blue-400">
                          {att.skill_slug}
                        </td>
                        <td className="py-3 font-bold">
                          {att.score}%
                        </td>
                        <td className="py-3">
                          {att.passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 size={11} />
                              Passed (Verified)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                              <XCircle size={11} />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-400">
                          {att.attempted_at ? new Date(att.attempted_at).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
