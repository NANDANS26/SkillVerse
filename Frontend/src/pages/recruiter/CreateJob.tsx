import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Sparkles, X, Plus } from 'lucide-react'
import Sidebar from '../../components/Sidebar'

export default function CreateJob() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [showParsedSkills, setShowParsedSkills] = useState(false)
  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    experience: '',
    location: '',
    jdText: '',
    requiredSkills: [] as string[],
    niceToHave: [] as string[]
  })
  const [parsedData, setParsedData] = useState({
    requiredSkills: [] as string[],
    niceToHave: [] as string[],
    responsibilities: [] as string[],
    summary: ''
  })
  const [newSkill, setNewSkill] = useState('')
  const [newNiceToHave, setNewNiceToHave] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !jobData.requiredSkills.includes(newSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (index: number) => {
    setJobData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }))
  }

  const handleAddNiceToHave = () => {
    if (newNiceToHave.trim() && !jobData.niceToHave.includes(newNiceToHave.trim())) {
      setJobData(prev => ({
        ...prev,
        niceToHave: [...prev.niceToHave, newNiceToHave.trim()]
      }))
      setNewNiceToHave('')
    }
  }

  const handleRemoveNiceToHave = (index: number) => {
    setJobData(prev => ({
      ...prev,
      niceToHave: prev.niceToHave.filter((_, i) => i !== index)
    }))
  }

  const parseJDWithAI = async () => {
    if (!jobData.jdText.trim()) {
      alert('Please enter a job description first')
      return
    }

    setParsing(true)
    try {
      // Mock API call to Python ML service
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock parsed data from ML model
      const mockParsedData = {
        requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'JavaScript'],
        niceToHave: ['Node.js', 'AWS', 'Docker', 'GraphQL'],
        responsibilities: [
          'Develop and maintain responsive web applications',
          'Collaborate with designers and backend engineers',
          'Write clean, maintainable code with tests',
          'Optimize applications for performance'
        ],
        summary: 'Senior frontend role requiring extensive React experience for building enterprise-grade applications.'
      }

      setParsedData(mockParsedData)
      setShowParsedSkills(true)
      
      // Auto-fill required skills from parsed data
      setJobData(prev => ({
        ...prev,
        requiredSkills: [...new Set([...prev.requiredSkills, ...mockParsedData.requiredSkills])],
        niceToHave: [...new Set([...prev.niceToHave, ...mockParsedData.niceToHave])]
      }))

    } catch (error) {
      console.error('Error parsing JD:', error)
      alert('Failed to parse job description. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async () => {
    if (!jobData.title || !jobData.jdText || jobData.requiredSkills.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Mock API call to save job
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In real app, you would:
      // 1. Save job to Node backend
      // 2. Call Python ML service /parse_jd
      // 3. Save parsed data
      
      alert('Job created successfully!')
      navigate('/recruiter/dashboard')
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Failed to create job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/recruiter/dashboard')}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back to Dashboard
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Job Posting
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Fill in the job details and let AI help you parse requirements
            </p>
          </div>

          <div className="space-y-8">
            {/* Job Details */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Job Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience Required *
                  </label>
                  <select
                    value={jobData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Experience</option>
                    <option value="0-2 years">0-2 years</option>
                    <option value="2-5 years">2-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={jobData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <select
                    value={jobData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Location</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="New York, NY">New York, NY</option>
                    <option value="San Francisco, CA">San Francisco, CA</option>
                    <option value="Remote, US">Remote, US</option>
                    <option value="Remote, Worldwide">Remote, Worldwide</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Job Description *
                </h2>
                <button
                  onClick={parseJDWithAI}
                  disabled={parsing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {parsing ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={20} />
                  )}
                  <span>{parsing ? 'Parsing...' : 'Parse with AI'}</span>
                </button>
              </div>
              
              <textarea
                value={jobData.jdText}
                onChange={(e) => handleInputChange('jdText', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Paste or type the job description here. Our AI will extract skills and requirements automatically."
              />
            </div>

            {/* Skills Section */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Required Skills *
              </h2>
              
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Add a required skill"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jobData.requiredSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg"
                    >
                      <span className="font-medium">{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Nice to Have Skills
              </h3>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newNiceToHave}
                  onChange={(e) => setNewNiceToHave(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNiceToHave()}
                  className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Add a nice-to-have skill"
                />
                <button
                  onClick={handleAddNiceToHave}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-blue-500 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.niceToHave.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-lg"
                  >
                    <span className="font-medium">{skill}</span>
                    <button
                      onClick={() => handleRemoveNiceToHave(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Parsed Results */}
            {showParsedSkills && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      AI-Parsed Results
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Our ML model has extracted these insights from your job description
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Parsed Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Parsed Nice-to-Have Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.niceToHave.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Key Responsibilities
                    </h3>
                    <ul className="space-y-2">
                      {parsedData.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      AI Summary
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 italic p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                      {parsedData.summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="sticky bottom-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Job...</span>
                  </>
                ) : (
                  <>
                    <Save size={24} />
                    <span>Create Job Posting</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}