import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Target, 
  Star, 
  TrendingUp,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  Download,
  ChevronDown
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { Match } from '../../interfaces'

export default function CandidateMatches() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    skillMatch: 0,
    experienceMatch: false,
    sortBy: 'score'
  })
  const [stats, setStats] = useState({
    totalMatches: 0,
    avgScore: 0,
    topMatch: 0
  })

  useEffect(() => {
    fetchMatches()
  }, [id])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      // Mock API call to /match endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockMatches: Match[] = [
        {
          id: '1',
          jobId: id!,
          candidateId: 'candidate-1',
          score: 95,
          skillOverlap: 90,
          embeddingSimilarity: 85,
          matchedSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
          evidence: [
            '5+ years experience in React development',
            'Built scalable applications with TypeScript',
            'Expert in modern frontend frameworks'
          ],
          status: 'pending',
          lastUpdated: '2024-01-15'
        },
        {
          id: '2',
          jobId: id!,
          candidateId: 'candidate-2',
          score: 88,
          skillOverlap: 85,
          embeddingSimilarity: 80,
          matchedSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'Redux'],
          evidence: [
            '4 years of React experience',
            'Strong JavaScript fundamentals',
            'Experience with state management'
          ],
          status: 'reviewed',
          lastUpdated: '2024-01-14'
        },
        {
          id: '3',
          jobId: id!,
          candidateId: 'candidate-3',
          score: 82,
          skillOverlap: 80,
          embeddingSimilarity: 75,
          matchedSkills: ['React', 'TypeScript', 'Node.js', 'AWS'],
          evidence: [
            'Full-stack development experience',
            'Cloud infrastructure knowledge',
            '3+ years in software development'
          ],
          status: 'pending',
          lastUpdated: '2024-01-13'
        },
        {
          id: '4',
          jobId: id!,
          candidateId: 'candidate-4',
          score: 78,
          skillOverlap: 75,
          embeddingSimilarity: 70,
          matchedSkills: ['JavaScript', 'HTML', 'CSS', 'Bootstrap'],
          evidence: [
            'Frontend development background',
            'Experience with responsive design',
            '2 years professional experience'
          ],
          status: 'pending',
          lastUpdated: '2024-01-12'
        }
      ]

      setMatches(mockMatches)
      
      // Calculate stats
      const totalMatches = mockMatches.length
      const avgScore = Math.round(mockMatches.reduce((acc, match) => acc + match.score, 0) / totalMatches)
      const topMatch = Math.max(...mockMatches.map(m => m.score))
      
      setStats({
        totalMatches,
        avgScore,
        topMatch
      })
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMatches = matches.filter(match => {
    if (filters.skillMatch > 0 && match.skillOverlap < filters.skillMatch) {
      return false
    }
    if (filters.experienceMatch) {
      // Filter logic for experience match
      return match.score > 80
    }
    return true
  }).sort((a, b) => {
    if (filters.sortBy === 'score') {
      return b.score - a.score
    } else if (filters.sortBy === 'skillOverlap') {
      return b.skillOverlap - a.skillOverlap
    } else {
      return b.embeddingSimilarity - a.embeddingSimilarity
    }
  })

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Finding candidate matches...</p>
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
              to={`/recruiter/job/${id}`}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back to Job Details
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Candidate Matches
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  AI-powered matching results for your job posting
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                  <Download size={18} />
                  <span>Export Matches</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +24%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalMatches}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Total Matches
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +8%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.avgScore}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Average Match Score
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Top Match
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.topMatch}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Highest Score
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Filter size={20} className="text-gray-500" />
                  <select
                    value={filters.skillMatch}
                    onChange={(e) => setFilters(prev => ({ ...prev, skillMatch: parseInt(e.target.value) }))}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">All Skills</option>
                    <option value="70">70%+ Skill Match</option>
                    <option value="80">80%+ Skill Match</option>
                    <option value="90">90%+ Skill Match</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.experienceMatch}
                      onChange={(e) => setFilters(prev => ({ ...prev, experienceMatch: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Experience Match</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="score">Sort by Match Score</option>
                    <option value="skillOverlap">Sort by Skill Overlap</option>
                    <option value="embeddingSimilarity">Sort by Embedding Similarity</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Match Metrics Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    Match Score
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Overall compatibility score based on multiple factors
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                    Skill Overlap
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Percentage of required skills that match candidate's skills
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                    Embedding Similarity
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Semantic similarity between job description and candidate resume
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Matches List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Matched Candidates ({filteredMatches.length})
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sorted by {filters.sortBy === 'score' ? 'Match Score' : filters.sortBy === 'skillOverlap' ? 'Skill Overlap' : 'Embedding Similarity'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredMatches.map((match) => (
                <div key={match.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 card-hover">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Candidate Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Briefcase className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              Alex Johnson
                            </h3>
                            <div className="flex items-center space-x-4 mt-2 lg:mt-0">
                              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                                <MapPin size={14} />
                                <span className="text-sm">San Francisco, CA</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                                <Calendar size={14} />
                                <span className="text-sm">5+ years</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Senior Frontend Engineer with expertise in React and modern web technologies
                          </p>
                        </div>
                      </div>

                      {/* Match Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Match Score</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{match.score}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${match.score}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Skill Overlap</span>
                            <span className="font-bold text-green-600 dark:text-green-400">{match.skillOverlap}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                              style={{ width: `${match.skillOverlap}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Embedding Similarity</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">{match.embeddingSimilarity}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${match.embeddingSimilarity}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Matched Skills */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Matched Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.matchedSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Evidence */}
                      {match.evidence[0] && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Why Matched:</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {match.evidence[0]}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="lg:w-48 flex flex-col space-y-3">
                      <Link
                        to={`/recruiter/candidate/${match.candidateId}`}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        <Eye size={20} />
                        <span>View Profile</span>
                      </Link>
                      <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                        <MessageSquare size={20} />
                        <span>Contact</span>
                      </button>
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Status: <span className={`font-medium ${
                            match.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                            match.status === 'reviewed' ? 'text-blue-600 dark:text-blue-400' :
                            match.status === 'contacted' ? 'text-green-600 dark:text-green-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Updated: {match.lastUpdated}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No Matches State */}
          {filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Try adjusting your filters to see more candidates
              </p>
              <button
                onClick={() => setFilters({ skillMatch: 0, experienceMatch: false, sortBy: 'score' })}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              AI Matching Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  How Matching Works
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Skill Overlap:</strong> Direct comparison of required skills vs candidate skills
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Embedding Similarity:</strong> Semantic analysis of job description vs resume
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Experience Match:</strong> Analysis of years and relevance of experience
                    </span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recommendations
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                      High Quality Matches
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      3 candidates scored above 85% match. Consider contacting them first.
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      Skill Gap Analysis
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Most candidates lack AWS experience. Consider adjusting requirements or providing training.
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