import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Target, 
  User, 
  Briefcase, 
  MapPin,
  Calendar,
  Star,
  Eye,
  MessageSquare,
  Download,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

export default function Matches() {
  const [matches, setMatches] = useState([
    {
      id: '1',
      jobTitle: 'Senior Frontend Developer',
      candidateName: 'Alex Johnson',
      score: 95,
      skillOverlap: 90,
      embeddingSimilarity: 85,
      status: 'pending',
      lastUpdated: '2024-01-15',
      jobId: '1',
      candidateId: '1'
    },
    {
      id: '2',
      jobTitle: 'Full Stack Engineer',
      candidateName: 'Sarah Chen',
      score: 88,
      skillOverlap: 85,
      embeddingSimilarity: 80,
      status: 'reviewed',
      lastUpdated: '2024-01-14',
      jobId: '2',
      candidateId: '2'
    },
    {
      id: '3',
      jobTitle: 'DevOps Engineer',
      candidateName: 'Marcus Rodriguez',
      score: 82,
      skillOverlap: 80,
      embeddingSimilarity: 75,
      status: 'contacted',
      lastUpdated: '2024-01-13',
      jobId: '3',
      candidateId: '3'
    },
    {
      id: '4',
      jobTitle: 'UI/UX Designer',
      candidateName: 'Priya Sharma',
      score: 78,
      skillOverlap: 75,
      embeddingSimilarity: 70,
      status: 'interviewed',
      lastUpdated: '2024-01-12',
      jobId: '4',
      candidateId: '4'
    },
    {
      id: '5',
      jobTitle: 'Data Scientist',
      candidateName: 'James Wilson',
      score: 91,
      skillOverlap: 88,
      embeddingSimilarity: 83,
      status: 'rejected',
      lastUpdated: '2024-01-11',
      jobId: '5',
      candidateId: '5'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('score')

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true
    if (filter === 'pending') return match.status === 'pending'
    if (filter === 'reviewed') return match.status === 'reviewed'
    if (filter === 'contacted') return match.status === 'contacted'
    if (filter === 'interviewed') return match.status === 'interviewed'
    if (filter === 'rejected') return match.status === 'rejected'
    return true
  }).filter(match => 
    match.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score
    if (sortBy === 'skillOverlap') return b.skillOverlap - a.skillOverlap
    if (sortBy === 'embeddingSimilarity') return b.embeddingSimilarity - a.embeddingSimilarity
    return 0
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'reviewed': return <Eye className="h-4 w-4 text-blue-500" />
      case 'contacted': return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'interviewed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'reviewed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'interviewed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return ''
    }
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Matches
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              View and manage all candidate matches across your job postings
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {matches.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Matches</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {Math.round(matches.reduce((acc, m) => acc + m.score, 0) / matches.length)}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Avg Match Score</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {matches.filter(m => m.status === 'interviewed').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Interviews</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800/50">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {matches.filter(m => m.score >= 80).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">High Quality</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'reviewed', 'contacted', 'interviewed', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === status
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search matches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter size={20} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="score">Sort by Score</option>
                    <option value="skillOverlap">Sort by Skill Overlap</option>
                    <option value="embeddingSimilarity">Sort by Similarity</option>
                  </select>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                  <Download size={20} />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Matches Table */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Match Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Scores
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMatches.map((match) => (
                    <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{match.candidateName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <Briefcase size={14} />
                            {match.jobTitle}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Total Score</span>
                            <span className={`font-bold ${
                              match.score >= 90 ? 'text-green-600 dark:text-green-400' :
                              match.score >= 80 ? 'text-blue-600 dark:text-blue-400' :
                              match.score >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {match.score}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Skill Overlap</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">{match.skillOverlap}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Similarity</span>
                            <span className="font-medium text-purple-600 dark:text-purple-400">{match.embeddingSimilarity}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(match.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {match.lastUpdated}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/recruiter/candidate/${match.candidateId}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title="View Candidate"
                          >
                            <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                          </Link>
                          <Link
                            to={`/recruiter/job/${match.jobId}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title="View Job"
                          >
                            <Briefcase size={18} className="text-blue-600 dark:text-blue-400" />
                          </Link>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Message">
                            <MessageSquare size={18} className="text-green-600 dark:text-green-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm ? 'Try adjusting your search' : 'No matches for the selected filters'}
              </p>
              <button
                onClick={() => { setFilter('all'); setSearchTerm('') }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}