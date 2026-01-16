import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  MapPin, 
  Video,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Filter,
  Plus,
  ChevronDown
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

export default function Interviews() {
  const [interviews, setInterviews] = useState([
    {
      id: '1',
      candidateName: 'Alex Johnson',
      jobTitle: 'Senior Frontend Developer',
      date: '2024-01-20',
      time: '10:00 AM',
      duration: '45 mins',
      type: 'video',
      status: 'scheduled',
      interviewer: 'Sarah Wilson'
    },
    {
      id: '2',
      candidateName: 'Sarah Chen',
      jobTitle: 'Full Stack Engineer',
      date: '2024-01-19',
      time: '2:30 PM',
      duration: '60 mins',
      type: 'in-person',
      status: 'completed',
      interviewer: 'John Davis'
    },
    {
      id: '3',
      candidateName: 'Marcus Rodriguez',
      jobTitle: 'DevOps Engineer',
      date: '2024-01-18',
      time: '11:00 AM',
      duration: '30 mins',
      type: 'phone',
      status: 'completed',
      interviewer: 'Sarah Wilson'
    },
    {
      id: '4',
      candidateName: 'Priya Sharma',
      jobTitle: 'UI/UX Designer',
      date: '2024-01-22',
      time: '3:00 PM',
      duration: '60 mins',
      type: 'video',
      status: 'scheduled',
      interviewer: 'John Davis'
    },
    {
      id: '5',
      candidateName: 'James Wilson',
      jobTitle: 'Data Scientist',
      date: '2024-01-17',
      time: '9:00 AM',
      duration: '45 mins',
      type: 'video',
      status: 'cancelled',
      interviewer: 'Sarah Wilson'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true
    if (filter === 'scheduled') return interview.status === 'scheduled'
    if (filter === 'completed') return interview.status === 'completed'
    if (filter === 'cancelled') return interview.status === 'cancelled'
    return true
  }).filter(interview => 
    interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return ''
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5 text-purple-500" />
      case 'phone': return <Phone className="h-5 w-5 text-blue-500" />
      case 'in-person': return <MapPin className="h-5 w-5 text-green-500" />
      default: return null
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
              Interview Schedule
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage and track all candidate interviews
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {interviews.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Interviews</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {interviews.filter(i => i.status === 'scheduled').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Upcoming</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {interviews.filter(i => i.status === 'completed').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                85%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Attendance Rate</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {['all', 'scheduled', 'completed', 'cancelled'].map((status) => (
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
                    placeholder="Search interviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:border-blue-500 transition-colors">
                  <Calendar size={20} />
                  <span>Select Date</span>
                  <ChevronDown size={16} />
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                  <Plus size={20} />
                  <span>Schedule New</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interviews List */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Candidate & Job
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Interviewer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInterviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{interview.candidateName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <Briefcase size={14} />
                            {interview.jobTitle}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{interview.date}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <Clock size={14} />
                            {interview.time} ({interview.duration})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(interview.type)}
                          <span className="text-gray-700 dark:text-gray-300">{interview.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {interview.interviewer}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(interview.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {interview.status === 'scheduled' && (
                            <>
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Join">
                                <Video size={18} className="text-green-600 dark:text-green-400" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Reschedule">
                                <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                              </button>
                            </>
                          )}
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Message">
                            <MessageSquare size={18} className="text-purple-600 dark:text-purple-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="More">
                            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
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
          {filteredInterviews.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No interviews found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm ? 'Try adjusting your search' : 'No interviews scheduled'}
              </p>
              <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all mx-auto">
                <Plus size={20} />
                <span>Schedule New Interview</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}