import { useState } from 'react'
import { Save, Plus, Trash2, Upload, Sparkles } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const skillsList = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL',
  'Next.js', 'Tailwind CSS', 'Git', 'REST APIs', 'Machine Learning',
  'Data Analysis', 'UI/UX Design', 'DevOps', 'CI/CD', 'Testing'
]

interface Project {
  id: string
  title: string
  description: string
  techStack: string[]
  duration: string
}

export default function ProfileBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    experience: '',
    resumeText: '',
    location: '',
    availability: 'Immediately'
  })

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', title: '', description: '', techStack: [], duration: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleProjectChange = (id: string, field: keyof Project, value: string | string[]) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      )
    )
  }

  const addProject = () => {
    setProjects(prev => [
      ...prev,
      { id: Date.now().toString(), title: '', description: '', techStack: [], duration: '' }
    ])
  }

  const removeProject = (id: string) => {
    if (projects.length > 1) {
      setProjects(prev => prev.filter(project => project.id !== id))
    }
  }

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      // Simulate extracting text from resume
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, resumeText: e.target?.result?.toString() || '' }))
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const profileData = {
        ...formData,
        skills: selectedSkills,
        projects: projects.filter(p => p.title && p.description),
        resumeFile: resumeFile?.name
      }

      // Send to backend
      const response = await fetch('http://localhost:3001/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        alert('Profile saved successfully!')
        // Optionally generate embeddings
        await fetch('http://localhost:5000/api/generate-embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: 'user-id', skills: selectedSkills })
        })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Build Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Complete your profile to get better job recommendations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience *
                  </label>
                  <select
                    name="experience"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.experience}
                    onChange={handleInputChange}
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Skills & Technologies
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {skillsList.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedSkills.length} skills selected
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Projects
                </h2>
                <button
                  type="button"
                  onClick={addProject}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Plus size={20} />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-6">
                {projects.map((project, index) => (
                  <div key={project.id} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Project {index + 1}
                      </h3>
                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProject(project.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Project Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                          placeholder="E-commerce Platform"
                          value={project.title}
                          onChange={(e) => handleProjectChange(project.id, 'title', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                          rows={3}
                          placeholder="Describe your project, your role, and key achievements..."
                          value={project.description}
                          onChange={(e) => handleProjectChange(project.id, 'description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duration
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder="3 months, Jan - Mar 2024"
                            value={project.duration}
                            onChange={(e) => handleProjectChange(project.id, 'duration', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tech Stack (comma separated)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder="React, Node.js, MongoDB"
                            value={project.techStack.join(', ')}
                            onChange={(e) => handleProjectChange(project.id, 'techStack', e.target.value.split(',').map(t => t.trim()))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Resume
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Upload Resume (PDF/DOC)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-blue-500">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {resumeFile ? resumeFile.name : 'Click to upload resume'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resume Text (Extracted from upload or paste manually)
                </label>
                <textarea
                  name="resumeText"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Paste your resume text here or it will be extracted from uploaded file..."
                  value={formData.resumeText}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-6 bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your profile will be used for job matching
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save size={20} />
                  <span>{isSubmitting ? 'Saving...' : 'Save & Generate Profile'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}