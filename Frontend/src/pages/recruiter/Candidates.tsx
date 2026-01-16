import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Briefcase, 
  Calendar,
  Star,
  Mail,
  Phone,
  Download,
  Eye,
  MessageSquare,
  Award,
  Users,
  ChevronDown
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

export default function Candidates() {
  const [candidates, setCandidates] = useState([
    {
      id: '1',
      name: 'Alex Johnson',
      title: 'Senior Frontend Engineer',
      location: 'San Francisco, CA',
      experience: '6 years',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
      matchScore: 95,
      status: 'active',
      lastActive: '2 days ago'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      title: 'Full Stack Developer',
      location: 'New York, NY',
      experience: '4 years',
      skills: ['Python', 'Django', 'React', 'AWS'],
      matchScore: 88,
      status: 'active',
      lastActive: '1 day ago'
    },
    {
      id: '3',
      name: 'Marcus Rodriguez',
      title: 'DevOps Engineer',
      location: 'Austin, TX',
      experience: '5 years',
      skills: ['Kubernetes', 'AWS', 'Docker', 'Terraform'],
      matchScore: 82,
      status: 'contacted',
      lastActive: '3 days ago'
    },
    {
      id: '4',
      name: 'Priya Sharma',
      title: 'UI/UX Designer',
      location: 'Seattle, WA',
      experience: '4 years',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      matchScore: 78,
      status: 'new',
      lastActive: '1 hour ago'
    },
    {
      id: '5',
      name: 'James Wilson',
      title: 'Data Scientist',
      location: 'Boston, MA',
      experience: '5 years',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
      matchScore: 91,
      status: 'interviewed',
      lastActive: '1 week ago'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCandidates = candidates.filter(candidate => {
    if (filter === 'all') return true
    if (filter === 'new') return candidate.status === 'new'
    if (filter === 'contacted') return candidate.status === 'contacted'
    if (filter === 'interviewed') return candidate.status === 'interviewed'
    return true
  }).filter(candidate => 
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'interviewed': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
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
              Candidates
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Browse and manage all candidates in your talent pool
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {candidates.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Candidates</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {candidates.filter(c => c.status === 'new').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">New Candidates</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                85%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Avg Match Score</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                24
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Conversations</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {['all', 'new', 'contacted', 'interviewed'].map((status) => (
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
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:border-blue-500 transition-colors">
                  <Filter size={20} />
                  <span>More Filters</span>
                  <ChevronDown size={16} />
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                  <Download size={20} />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {candidate.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{candidate.title}</p>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={14} />
                        <span>{candidate.location}</span>
                        <span>•</span>
                        <Calendar size={14} />
                        <span>{candidate.experience}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${
                      candidate.matchScore >= 90 ? 'from-green-500 to-emerald-600' :
                      candidate.matchScore >= 80 ? 'from-blue-500 to-cyan-600' :
                      candidate.matchScore >= 70 ? 'from-yellow-500 to-orange-500' :
                      'from-red-500 to-pink-600'
                    } text-white font-bold`}>
                      {candidate.matchScore}%
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm">
                        +{candidate.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="View Profile">
                      <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Message">
                      <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Save">
                      <Star size={18} className="text-yellow-600 dark:text-yellow-400" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Active: {candidate.lastActive}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No candidates found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm ? 'Try adjusting your search' : 'No candidates match your filters'}
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