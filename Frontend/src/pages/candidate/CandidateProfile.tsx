// Frontend/src/pages/candidate/CandidateProfile.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Briefcase, Mail, ArrowLeft, Sparkles } from 'lucide-react';
import { candidates } from '../../data/candidates';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function CandidateProfile() {
  const { id } = useParams();
  const { isDemoMode, user } = useAuth();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      const demo = candidates.find((c: any) => c.id === id) || candidates[0];
      setCandidate(demo);
      return;
    }

    async function fetchCandidate() {
      try {
        setLoading(true);
        setError(null);
        let endpoint = id && id !== 'me' ? `/candidates/${id}` : '/candidates/me';
        const res = await api.get(endpoint);
        if (res && res.success && res.candidate) {
          const c = res.candidate;
          let skillsArray: string[] = [];
          if (Array.isArray(c.skill_json)) {
            skillsArray = c.skill_json;
          } else if (typeof c.skill_json === 'string') {
            try { 
              skillsArray = JSON.parse(c.skill_json); 
            } catch {
              skillsArray = [];
            }
          }
          setCandidate({
            id: c.id,
            name: c.full_name || 'Candidate',
            title: c.headline || 'Software Engineer',
            email: c.email || '',
            experience: `${c.experience_years ?? 0} years`,
            location: 'Remote / Hybrid',
            skills: skillsArray,
            resume_text: c.resume_text || '',
            indexing_status: c.indexing_status || 'indexed'
          });
        } else {
          setError('Candidate profile not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load candidate profile');
      } finally {
        setLoading(false);
      }
    }

    fetchCandidate();
  }, [id, isDemoMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading candidate profile from PostgreSQL...
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Candidate Profile Not Found
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {error || 'The requested profile does not exist or access was denied.'}
          </p>
          <Link
            to={user?.role === 'student' ? '/student/dashboard' : '/recruiter/dashboard'}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-transition space-y-8">
      {isDemoMode && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <Sparkles size={14} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION CANDIDATE:</strong> Displaying simulated candidate telemetry and benchmark skills.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {candidate.name}
                </h1>
                {candidate.indexing_status === 'indexed' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                    Vector Indexed ✓
                  </span>
                )}
              </div>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-1">
                {candidate.title}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <MapPin size={14} />
                  <span>{candidate.location}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar size={14} />
                  <span>{candidate.experience} experience</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Mail size={14} />
                  <span>{candidate.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bio & Skills */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio / Resume Text */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Professional Summary & Background
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {candidate.resume_text || candidate.resumeSummary || 'Candidate has not provided a detailed resume summary yet.'}
            </p>
          </div>

          {/* Technical Skills */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Verified Technical Competencies
            </h2>
            {Array.isArray(candidate.skills) ? (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : typeof candidate.skills === 'object' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(candidate.skills).map(([skill, level]: [string, any]) => (
                  <div key={skill} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-900 dark:text-white">{skill}</span>
                      <span className="text-blue-600 font-bold">{level}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Actions / Overview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Profile Meta
            </h3>
            <div className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Record ID</span>
                <span className="font-mono text-gray-900 dark:text-white">#{candidate.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Vector Dimension</span>
                <span className="font-mono text-gray-900 dark:text-white">384-d</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Embed Model</span>
                <span className="text-gray-900 dark:text-white">all-MiniLM-L6-v2</span>
              </div>
            </div>

            {user?.role === 'student' && (
              <Link
                to="/student/profile"
                className="w-full block text-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Edit My Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
