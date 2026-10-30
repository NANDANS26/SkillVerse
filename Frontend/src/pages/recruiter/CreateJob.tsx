import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, X, Plus, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api, ApiError } from '../../services/api';

export default function CreateJob() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();

  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showParsedSkills, setShowParsedSkills] = useState(false);
  const [isRealAiParsed, setIsRealAiParsed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    experience: '',
    location: 'Remote',
    jdText: '',
    requiredSkills: [] as string[],
    niceToHave: [] as string[]
  });

  const [parsedData, setParsedData] = useState({
    requiredSkills: [] as string[],
    niceToHave: [] as string[],
    responsibilities: [] as string[],
    summary: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newNiceToHave, setNewNiceToHave] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !jobData.requiredSkills.includes(newSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setJobData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const handleAddNiceToHave = () => {
    if (newNiceToHave.trim() && !jobData.niceToHave.includes(newNiceToHave.trim())) {
      setJobData(prev => ({
        ...prev,
        niceToHave: [...prev.niceToHave, newNiceToHave.trim()]
      }));
      setNewNiceToHave('');
    }
  };

  const handleRemoveNiceToHave = (index: number) => {
    setJobData(prev => ({
      ...prev,
      niceToHave: prev.niceToHave.filter((_, i) => i !== index)
    }));
  };

  const parseJDWithAI = async () => {
    if (!jobData.jdText.trim()) {
      setErrorMessage('Please enter a job description first before parsing.');
      return;
    }

    setParsing(true);
    setErrorMessage('');

    try {
      // Attempt live Python FastAPI parse_jd call
      const pyResponse = await fetch('http://localhost:8000/api/v1/parse_jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jobData.jdText })
      }).catch(() => null);

      if (pyResponse && pyResponse.ok) {
        const result = await pyResponse.json();
        const extracted = result.skills_extracted || [];
        setParsedData({
          requiredSkills: extracted.slice(0, 5),
          niceToHave: extracted.slice(5, 10),
          responsibilities: ['Extracted from live FastAPI parser'],
          summary: `Parsed ${extracted.length} key concepts using live Python service.`
        });
        setIsRealAiParsed(true);
        setShowParsedSkills(true);
        setJobData(prev => ({
          ...prev,
          requiredSkills: [...new Set([...prev.requiredSkills, ...extracted.slice(0, 5)])]
        }));
        return;
      }

      // If python service is offline or in local demo mode, extract skills via client heuristic with clear label
      const words = jobData.jdText.split(/\s+/);
      const candidates = words
        .map(w => w.replace(/[^a-zA-Z0-9+#.]/g, ''))
        .filter(w => w.length > 2 && /^[A-Z]/.test(w));
      const uniqueKeywords = [...new Set(candidates)].slice(0, 8);

      const fallbackParsed = {
        requiredSkills: uniqueKeywords.length > 0 ? uniqueKeywords.slice(0, 4) : ['React', 'TypeScript', 'API Design'],
        niceToHave: uniqueKeywords.length > 4 ? uniqueKeywords.slice(4, 8) : ['Docker', 'Cloud Infrastructure'],
        responsibilities: [
          'Design and maintain scalable distributed web systems',
          'Collaborate across engineering and product stakeholders',
          'Write automated unit and integration tests'
        ],
        summary: 'Parsed requirements preview generated via local heuristic rule set.'
      };

      setParsedData(fallbackParsed);
      setIsRealAiParsed(false);
      setShowParsedSkills(true);
      setJobData(prev => ({
        ...prev,
        requiredSkills: [...new Set([...prev.requiredSkills, ...fallbackParsed.requiredSkills])],
        niceToHave: [...new Set([...prev.niceToHave, ...fallbackParsed.niceToHave])]
      }));
    } catch {
      setErrorMessage('Parser execution encountered an error.');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!jobData.title.trim()) {
      setErrorMessage('Job title is required.');
      return;
    }

    if (!jobData.jdText.trim()) {
      setErrorMessage('Job description is required.');
      return;
    }

    if (jobData.requiredSkills.length === 0) {
      setErrorMessage('Please specify at least one required technical skill.');
      return;
    }

    setLoading(true);

    // If demo mode is active, handle client-side simulation
    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage('(Demo Session) Job requisition saved in browser session memory.');
        setTimeout(() => navigate('/recruiter/jobs'), 800);
      }, 500);
      return;
    }

    // Real API integration
    try {
      let expMin = 0;
      let expMax = 10;
      if (jobData.experience.includes('0-2')) { expMin = 0; expMax = 2; }
      else if (jobData.experience.includes('2-5')) { expMin = 2; expMax = 5; }
      else if (jobData.experience.includes('5-10')) { expMin = 5; expMax = 10; }
      else if (jobData.experience.includes('10+')) { expMin = 10; expMax = 20; }

      const payload = {
        title: jobData.title.trim(),
        location: jobData.location,
        description: jobData.jdText,
        experience_min: expMin,
        experience_max: expMax,
        required_skills: jobData.requiredSkills
      };

      const res = await api.post('/jobs', payload);

      if (res && res.success) {
        setSuccessMessage('Job requisition created successfully and published to candidate discovery.');
        setTimeout(() => navigate('/recruiter/jobs'), 700);
      } else {
        setErrorMessage(res?.message || 'Failed to create job on server.');
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Error connecting to jobs service.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/recruiter/dashboard')}
          className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline mb-3 gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Recruiter Dashboard</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Create New Job Requisition
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Post a new technical position. Skills will be vectorized for instant FAISS similarity matching.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Job Details Card */}
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Requisition Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                value={jobData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="e.g. Senior Machine Learning Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Experience Requirement *
              </label>
              <select
                value={jobData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Experience Range</option>
                <option value="0-2 years">0-2 years (Entry / Junior)</option>
                <option value="2-5 years">2-5 years (Mid-Level)</option>
                <option value="5-10 years">5-10 years (Senior)</option>
                <option value="10+ years">10+ years (Principal / Lead)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={jobData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="NovaTech Enterprises"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Location Policy *
              </label>
              <select
                value={jobData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Remote">Remote (Worldwide)</option>
                <option value="Hybrid (San Francisco, CA)">Hybrid (San Francisco, CA)</option>
                <option value="Hybrid (New York, NY)">Hybrid (New York, NY)</option>
                <option value="On-site (Austin, TX)">On-site (Austin, TX)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Description & AI Parsing */}
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Job Description *
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste raw JD text to extract skill vectors and role competencies
              </p>
            </div>
            <button
              type="button"
              onClick={parseJDWithAI}
              disabled={parsing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 shrink-0"
            >
              <Sparkles size={14} />
              <span>{parsing ? 'Parsing Vector Concepts...' : 'Extract Skills with AI'}</span>
            </button>
          </div>

          <textarea
            value={jobData.jdText}
            onChange={(e) => handleInputChange('jdText', e.target.value)}
            rows={7}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-sans"
            placeholder="Paste technical requirements, qualifications, and core stack..."
          />

          {/* AI Parser Output Preview */}
          {showParsedSkills && (
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-500" />
                  Extracted Skill Taxonomy
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isRealAiParsed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  {isRealAiParsed ? 'FastAPI Model Verified' : 'Simulated AI Parser Preview (Demonstration Model)'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {parsedData.requiredSkills.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium">
                    {s}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                {parsedData.summary}
              </div>
            </div>
          )}
        </div>

        {/* Required Skills Management */}
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Mandatory Skills & Qualifications *
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              placeholder="Add required skill (e.g. PyTorch, FastAPI)"
              className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {jobData.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="text-blue-500 hover:text-red-500"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nice-to-Have Skills
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newNiceToHave}
                onChange={(e) => setNewNiceToHave(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNiceToHave())}
                placeholder="Add nice-to-have skill (e.g. Kubernetes, Redis)"
                className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddNiceToHave}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobData.niceToHave.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNiceToHave(index)}
                    className="text-emerald-500 hover:text-red-500"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Info size={14} />
            <span>Requisition will be submitted to the active recruiting pipeline</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Save size={15} />
            <span>{loading ? 'Creating Requisition...' : 'Publish Job Requisition'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
