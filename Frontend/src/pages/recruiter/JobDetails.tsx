import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Users, 
  Target, 
  CheckCircle, 
  TrendingUp, 
  Briefcase,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { Job, ParsedJD } from '../../interfaces'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [candidateCount, setCandidateCount] = useState(0)

  useEffect(() => {
    fetchJobDetails()
  }, [id])

  const fetchJobDetails = async () => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockJob: Job = {
        id: id!,
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        experience: '5+ years',
        location: 'Remote, Worldwide',
        jdText: 'We are looking for an experienced Frontend Developer with strong React and TypeScript skills. You will be responsible for building modern, responsive web applications using cutting-edge technologies.',
        requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
        niceToHave: ['Node.js', 'AWS', 'Docker', 'Testing'],
        responsibilities: [
          'Develop and maintain responsive web applications',
          'Collaborate with designers and backend engineers',
          'Write clean, maintainable code with tests',
          'Optimize applications for performance',
          'Participate in code reviews'
        ],
        parsedSkills: ['React', 'TypeScript', 'Next.js', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'GraphQL'],
        createdAt: '2024-01-15',
        status: 'active'
      }

      const mockParsedJD: ParsedJD = {
        jobId: id!,
        requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
        niceToHave: ['Node.js', 'AWS', 'Docker', 'Testing'],
        responsibilities: [
          'Develop and maintain responsive web applications',
          'Collaborate with designers and backend engineers',
          'Write clean, maintainable code with tests',
          'Optimize applications for performance',
          'Participate in code reviews'
        ],
        experience: '5+ years in frontend development',
        summary: 'Senior role requiring extensive React and TypeScript experience for building enterprise-grade applications.'
      }

      setJob(mockJob)
      setParsedJD(mockParsedJD)
      setCandidateCount(24) // Mock candidate count
    } catch (error) {
      console.error('Error fetching job details:', error)
    } finally {
      setLoading(false)
    }
  }

  const findMatches = async () => {
    setMatchesLoading(true)
    try {
      // Mock API call to ML matching service
      await new Promise(resolve => setTimeout(resolve, 2000))
      navigate(`/recruiter/job/${id}/matches`)
    } catch (error) {
      console.error('Error finding matches:', error)
    } finally {
      setMatchesLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading job details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Job not found
            </h2>
            <Link
              to="/recruiter/dashboard"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/recruiter/dashboard"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back to Dashboard
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                    <Briefcase size={20} />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                    <MapPin size={20} />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                    <Calendar size={20} />
                    <span>Posted {job.createdAt}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                  <Edit size={18} />
                  <span>Edit</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:border-red-500 transition-colors">
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Description */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Job Description
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {job.jdText}
                </p>
              </div>

              {/* Parsed JD Details */}
              {parsedJD && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800/50">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      AI-Parsed Requirements
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Required Skills */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Required Skills (Parsed by ML)
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {parsedJD.requiredSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium flex items-center"
                          >
                            <CheckCircle className="mr-2" size={16} />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Nice to Have */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Nice to Have
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {parsedJD.niceToHave.map((skill, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Key Responsibilities
                      </h3>
                      <ul className="space-y-3">
                        {parsedJD.responsibilities.map((resp, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Summary */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        AI Summary
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 italic p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                        {parsedJD.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Find Matches Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Find Perfect Matches
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Use our AI matching system to find candidates that match this job
                    </p>
                  </div>
                  <button
                    onClick={findMatches}
                    disabled={matchesLoading}
                    className="mt-6 lg:mt-0 flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {matchesLoading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Finding Matches...</span>
                      </>
                    ) : (
                      <>
                        <Target size={24} />
                        <span>Find Matches with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Actions */}
            <div className="space-y-8">
              {/* Job Stats */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Job Statistics
                </h3>
                
                <div className="space-y-6">
                  {[
                    { label: 'Total Views', value: '1,248', change: '+12%' },
                    { label: 'Applications', value: '84', change: '+8%' },
                    { label: 'Candidate Matches', value: candidateCount.toString(), change: '+5%' },
                    { label: 'Time to Hire', value: '14 days', change: '-3 days' }
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{stat.label}</span>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {stat.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Quick Actions
                </h3>
                
                <div className="space-y-4">
                  <Link
                    to={`/recruiter/job/${id}/matches`}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <Target size={20} />
                    <span>View Matches</span>
                  </Link>
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <Users size={20} />
                    <span>View Applicants</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <Eye size={20} />
                    <span>Preview Job Post</span>
                  </button>
                </div>
              </div>

              {/* Skills Overview */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Skills Overview
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.parsedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  AI Insights
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                      Strong Candidate Pool
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      85% of candidates have required skills with 3+ years experience
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      Competitive Market
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      This role is in high demand with 200+ similar job postings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}