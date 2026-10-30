import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../services/api';

const skillsList = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL',
  'Next.js', 'Tailwind CSS', 'Git', 'REST APIs', 'Machine Learning',
  'Data Analysis', 'UI/UX Design', 'DevOps', 'CI/CD', 'Testing'
];

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  duration: string;
}

export default function ProfileBuilder() {
  const { user, isDemoMode } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    experience: '',
    resumeText: '',
    location: '',
    availability: 'Immediately'
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript', 'Python']);
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', title: 'Personal Skill Portfolio', description: 'Showcase of software engineering projects and verified skill proof.', techStack: ['React', 'TypeScript'], duration: '3 months' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing profile if available on real backend
  useEffect(() => {
    async function loadExistingProfile() {
      if (isDemoMode || !user) return;
      try {
        const res = await api.get('/candidates/me');
        if (res && res.success && res.candidate) {
          const c = res.candidate;
          setFormData(prev => ({
            ...prev,
            name: c.full_name || prev.name,
            email: c.email || prev.email,
            experience: c.experience_years ? String(c.experience_years) : prev.experience,
            resumeText: c.resume_text || prev.resumeText,
            location: c.headline || prev.location
          }));

          if (c.skill_json) {
            let parsedSkills: string[] = [];
            if (Array.isArray(c.skill_json)) {
              parsedSkills = c.skill_json;
            } else if (typeof c.skill_json === 'string') {
              try {
                parsedSkills = JSON.parse(c.skill_json);
              } catch {
                // Ignore parse errors from legacy string format
              }
            }
            if (parsedSkills.length > 0) {
              setSelectedSkills(parsedSkills);
            }
          }
        }
      } catch {
        // Candidate profile might not exist yet for new student
      }
    }
    loadExistingProfile();
  }, [user, isDemoMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleProjectChange = (id: string, field: keyof Project, value: string | string[]) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      )
    );
  };

  const addProject = () => {
    setProjects(prev => [
      ...prev,
      { id: Date.now().toString(), title: '', description: '', techStack: [], duration: '' }
    ]);
  };

  const removeProject = (id: string) => {
    if (projects.length > 1) {
      setProjects(prev => prev.filter(project => project.id !== id));
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, resumeText: event.target?.result?.toString() || '' }));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // If demo mode is active, simulate client-side save without making broken backend calls
    if (isDemoMode) {
      setTimeout(() => {
        setIsSubmitting(false);
        setStatusMessage({
          type: 'success',
          text: '(Demo Exploration) Candidate profile updated in browser session memory.'
        });
      }, 500);
      return;
    }

    // Real API integration
    try {
      const expYears = parseInt(formData.experience) || 0;
      const payload = {
        full_name: formData.name,
        email: formData.email,
        headline: formData.location || undefined,
        experience_years: expYears,
        resume_text: formData.resumeText || undefined,
        skill_json: selectedSkills
      };

      const res = await api.post('/candidates', payload);

      if (res && res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Profile saved successfully and synchronized with candidate database.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.message || 'Failed to save profile on server.'
        });
      }
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : 'Error connecting to candidate service.';
      setStatusMessage({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-md text-white mb-2">
          <Sparkles size={28} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Skill DNA & Profile Builder
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Build your verified technical identity. Selected skills are indexed for semantic AI matching.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-start gap-3 text-xs max-w-4xl mx-auto ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Alex Chen"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="alex.chen@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Years of Experience
              </label>
              <input
                type="number"
                name="experience"
                min="0"
                max="40"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="e.g. 2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Current Location / Headline
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="San Francisco, CA (or Remote)"
              />
            </div>
          </div>
        </div>

        {/* Skills Selection */}
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Technical Skills & Competencies
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select your core technical competencies to power the AI matching vector
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {selectedSkills.length} Selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skillsList.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedSkills.includes(skill)
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Resume & Portfolio Projects */}
        <div className="bg-white dark:bg-gray-800/70 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Resume & Project Artifacts
          </h2>

          {/* Resume Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Upload raw resume text or markdown file
            </p>
            <input
              type="file"
              accept=".txt,.md,.pdf,.json"
              onChange={handleResumeUpload}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="mt-3 inline-flex items-center px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer transition-colors"
            >
              Select Document
            </label>
            {resumeFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                Loaded: {resumeFile.name}
              </p>
            )}
          </div>

          {/* Projects */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Featured Engineering Projects
              </h3>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <Plus size={14} />
                <span>Add Project</span>
              </button>
            </div>

            {projects.map((project, idx) => (
              <div key={project.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Project #{idx + 1}
                  </span>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(project.id)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => handleProjectChange(project.id, 'title', e.target.value)}
                    placeholder="Project Title"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={project.duration}
                    onChange={(e) => handleProjectChange(project.id, 'duration', e.target.value)}
                    placeholder="Duration (e.g. 3 months)"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <textarea
                  value={project.description}
                  onChange={(e) => handleProjectChange(project.id, 'description', e.target.value)}
                  placeholder="Project architecture and key accomplishments..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSubmitting ? 'Synchronizing Profile...' : 'Save & Publish Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
