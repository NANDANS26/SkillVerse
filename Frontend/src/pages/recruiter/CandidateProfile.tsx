import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Briefcase, 
  Download,
  MessageSquare,
  Star,
  Target,
  Users,
  FileText
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import SkillRadar from '../../components/SkillRadar'
import { Candidate } from '../../interfaces'

export default function CandidateProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchInsights, setMatchInsights] = useState({
    skillOverlap: 0,
    experienceMatch: '',
    keyStrengths: [] as string[],
    potentialGaps: [] as string[]
  })

  useEffect(() => {
    fetchCandidateProfile()
  }, [id])

  const fetchCandidateProfile = async () => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCandidate: Candidate = {
        id: id!,
        name: 'Alex Johnson',
        title: 'Senior Frontend Engineer',
        experience: '6 years',
        location: 'San Francisco, CA',
        skills: {
          'React': 95,
          'TypeScript': 90,
          'Next.js': 85,
          'Tailwind CSS': 92,
          'GraphQL': 75,
          'Node.js': 70,
          'JavaScript': 88,
          'HTML/CSS': 85
        },
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Built a scalable e-commerce platform with real-time inventory management and payment processing',
            tech: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Redis'],
            evidence: 'Increased conversion by 35% through performance optimizations and improved UX',
            duration: '2 years'
          },
          {
            title: 'AI Dashboard',
            description: 'Developed a comprehensive dashboard for AI model monitoring and analytics with real-time data visualization',
            tech: ['Next.js', 'Recharts', 'FastAPI', 'PostgreSQL', 'Docker'],
            evidence: 'Reduced data processing time by 60% through optimized queries and caching',
            duration: '1.5 years'
          }
        ],
        resumeSummary: 'Experienced frontend engineer with 6+ years building scalable web applications. Strong expertise in React ecosystem and modern JavaScript. Passionate about clean code, performance optimization, and mentoring junior developers. Led multiple projects from conception to deployment with focus on user experience and code quality.',
        education: ['BS Computer Science, Stanford University', 'Frontend Masters Certification'],
        availability: 'Immediately',
        lastActive: '2 days ago',
        matchScore: 95
      }

      setCandidate(mockCandidate)

      // Mock ML insights
      setMatchInsights({
        skillOverlap: 85,
        experienceMatch: 'Excellent match - candidate has more than required experience',
        keyStrengths: ['React Expertise', 'TypeScript Proficiency', 'Modern Tooling', 'Performance Optimization'],
        potentialGaps: ['Limited Backend Experience', 'Minimal DevOps Exposure']
      })
    } catch (error) {
      console.error('Error fetching candidate profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading candidate profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Candidate not found
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
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                  <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Briefcase className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {candidate.name}
                      </h1>
                      <div className="px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold">
                        {candidate.matchScore}% Match
                      </div>
                    </div>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                      {candidate.title}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={18} />
                        <span>{candidate.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={18} />
                        <span>{candidate.experience} experience</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Award size={18} />
                        <span>{Object.keys(candidate.skills).length} skills</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
                    <MessageSquare size={20} />
                    <span>Contact</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <Download size={20} />
                    <span>Download Resume</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* ML Insights */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ML Match Insights
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Why Matched
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Skill Overlap</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{matchInsights.skillOverlap}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                            style={{ width: `${matchInsights.skillOverlap}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                          Experience Match
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {matchInsights.experienceMatch}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Key Strengths
                    </h3>
                    <div className="space-y-3">
                      {matchInsights.keyStrengths.map((strength, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                            <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Potential Considerations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                        <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                          Potential Gaps
                        </div>
                        <ul className="space-y-2">
                          {matchInsights.potentialGaps.map((gap, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                              • {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          Recommendations
                        </div>
                        <ul className="space-y-2">
                          <li className="text-sm text-gray-700 dark:text-gray-300">
                            • Consider skills-based interview questions
                          </li>
                          <li className="text-sm text-gray-700 dark:text-gray-300">
                            • Focus on React ecosystem expertise
                          </li>
                          <li className="text-sm text-gray-700 dark:text-gray-300">
                            • Verify project ownership and impact
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Technical Skills Assessment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(candidate.skills).map(([skill, level]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{level}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            level >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            level >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                            level >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Recent Projects
                </h2>
                <div className="space-y-6">
                  {candidate.projects.map((project, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {project.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Duration: {project.duration}
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                          Completed
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tech.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Key Achievement:</span> {project.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Radar Chart */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Skill Radar
                </h2>
                <SkillRadar skills={candidate.skills} />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Professional Summary
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {candidate.resumeSummary}
                </p>
              </div>

              {/* Quick Info */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Candidate Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Availability
                    </label>
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-green-500" size={20} />
                      <span className="text-gray-900 dark:text-white">{candidate.availability}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Last Active
                    </label>
                    <div className="flex items-center space-x-3">
                      <Users className="text-blue-500" size={20} />
                      <span className="text-gray-900 dark:text-white">{candidate.lastActive}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Education
                    </label>
                    <div className="space-y-2">
                      {candidate.education.map((edu, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{edu}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Keywords */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Resume Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(candidate.skills).slice(0, 10).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Next Steps
                </h2>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
                    <MessageSquare size={20} />
                    <span>Schedule Interview</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <FileText size={20} />
                    <span>Request References</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <Star size={20} />
                    <span>Add to Shortlist</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}