import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Users, 
  Target,
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  Download,
  Bell,
  Clock,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { Job } from '../../interfaces'

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    draftJobs: 0,
    totalCandidates: 0,
    totalMatches: 0,
    interviewsScheduled: 0,
    responseRate: 0
  })
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New candidate matched for Senior Frontend role', time: '10 min ago', read: false },
    { id: 2, message: 'Interview scheduled with Alex Johnson', time: '1 hour ago', read: true },
    { id: 3, message: 'Job posting "Full Stack Engineer" is live', time: '2 hours ago', read: true },
  ])

  useEffect(() => {
    fetchRecruiterData()
  }, [])

  const fetchRecruiterData = async () => {
    setLoading(true)
    try {
      // Mock API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockJobs: Job[] = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          experience: '5+ years',
          location: 'Remote, Worldwide',
          jdText: 'We are looking for an experienced Frontend Developer with strong React and TypeScript skills.',
          requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
          niceToHave: ['Node.js', 'AWS', 'Docker'],
          responsibilities: ['Develop modern web applications', 'Collaborate with team'],
          parsedSkills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
          createdAt: '2024-01-15',
          status: 'active'
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          experience: '3+ years',
          location: 'San Francisco, CA',
          jdText: 'Join our dynamic team to develop scalable web applications.',
          requiredSkills: ['Node.js', 'React', 'AWS', 'PostgreSQL'],
          niceToHave: ['Docker', 'GraphQL', 'Kubernetes'],
          responsibilities: ['Full-stack development', 'API design'],
          parsedSkills: ['Node.js', 'React', 'AWS', 'JavaScript'],
          createdAt: '2024-01-10',
          status: 'active'
        },
        {
          id: '3',
          title: 'DevOps Engineer',
          company: 'CloudTech Solutions',
          experience: '4+ years',
          location: 'Remote, US',
          jdText: 'Looking for DevOps Engineer to manage cloud infrastructure.',
          requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
          niceToHave: ['CI/CD', 'Linux', 'Python'],
          responsibilities: ['Cloud management', 'Infrastructure as code'],
          parsedSkills: ['AWS', 'Kubernetes', 'Docker', 'Linux'],
          createdAt: '2024-01-05',
          status: 'draft'
        },
        {
          id: '4',
          title: 'UI/UX Designer',
          company: 'DesignStudio',
          experience: '3+ years',
          location: 'New York, NY',
          jdText: 'Creative designer needed for enterprise applications.',
          requiredSkills: ['Figma', 'Adobe XD', 'User Research'],
          niceToHave: ['HTML/CSS', 'React', 'Prototyping'],
          responsibilities: ['UI design', 'User research'],
          parsedSkills: ['Figma', 'UI/UX', 'Prototyping'],
          createdAt: '2024-01-02',
          status: 'active'
        }
      ]

      setJobs(mockJobs)
      setStats({
        totalJobs: 12,
        activeJobs: 8,
        draftJobs: 4,
        totalCandidates: 156,
        totalMatches: 42,
        interviewsScheduled: 8,
        responseRate: 78
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobAction = (jobId: string, action: string) => {
    console.log(`Action ${action} on job ${jobId}`)
    // Implement job actions
  }

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return job.status === 'active'
    if (activeTab === 'draft') return job.status === 'draft'
    if (searchTerm) {
      return job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             job.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    return true
  })

  const quickActions = [
    { icon: Plus, label: 'Create Job', color: 'from-blue-500 to-purple-500', path: '/recruiter/create-job' },
    { icon: Users, label: 'View Candidates', color: 'from-green-500 to-emerald-500', path: '/recruiter/candidates' },
    { icon: Target, label: 'View Matches', color: 'from-orange-500 to-red-500', path: '/recruiter/matches' },
    { icon: MessageSquare, label: 'Schedule Interview', color: 'from-purple-500 to-pink-500', path: '/recruiter/interviews' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
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
          {/* Header with Welcome & Notifications */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Here's what's happening with your recruitment today
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </div>
                  )}
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                  Quick Hire
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +12%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalJobs}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Total Jobs
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="text-green-600 dark:text-green-400">{stats.activeJobs} active</span>
                {' • '}
                <span className="text-yellow-600 dark:text-yellow-400">{stats.draftJobs} drafts</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
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
                {stats.totalMatches}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Total Matches
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="text-blue-600 dark:text-blue-400">{stats.interviewsScheduled} interviews</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +24%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalCandidates}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Candidates
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Response rate: {stats.responseRate}%
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +15%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                85%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Match Quality
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                AI accuracy score
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link
                    key={index}
                    to={action.path}
                    className="group bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 card-hover"
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.color} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {action.label}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Click to get started
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Jobs */}
            <div className="lg:col-span-2">
              {/* Jobs Header */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Your Job Postings
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Manage and track all your job listings
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <Link
                      to="/recruiter/create-job"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <Plus size={20} />
                      <span>New Job</span>
                    </Link>
                  </div>
                </div>

                {/* Job Tabs */}
                <div className="flex space-x-2 mt-6">
                  {['all', 'active', 'draft'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <Briefcase className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No jobs found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {searchTerm ? 'Try adjusting your search' : 'Create your first job posting'}
                    </p>
                    <Link
                      to="/recruiter/create-job"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <Plus size={20} />
                      <span>Create New Job</span>
                    </Link>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 card-hover group">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Job Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {job.title}
                                </h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  job.status === 'active'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {job.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Briefcase size={14} />
                                  <span>{job.company}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{job.createdAt}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {job.jdText}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.parsedSkills.slice(0, 4).map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.parsedSkills.length > 4 && (
                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm">
                                +{job.parsedSkills.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Action Stats */}
                          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Users size={14} />
                              <span>24 candidates</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target size={14} />
                              <span className="text-green-600 dark:text-green-400">85% avg match</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} />
                              <span>8 interviews</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex lg:flex-col gap-3">
                          <Link
                            to={`/recruiter/job/${job.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                          >
                            <Eye size={18} />
                            <span className="hidden lg:inline">View</span>
                          </Link>
                          <Link
                            to={`/recruiter/job/${job.id}/matches`}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:border-blue-500 transition-colors"
                          >
                            <Target size={18} />
                            <span className="hidden lg:inline">Matches</span>
                          </Link>
                          <button
                            onClick={() => handleJobAction(job.id, 'edit')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:border-blue-500 transition-colors"
                          >
                            <span className="hidden lg:inline">Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Notifications */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell size={20} />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl ${
                          notification.read
                            ? 'bg-gray-50 dark:bg-gray-800/30'
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <Clock size={12} />
                              <span>{notification.time}</span>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                    View All Activity
                  </button>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    AI Insights
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                      High Demand Skills
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      React and TypeScript candidates have 40% higher match rates
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      Quick Actions
                    </div>
                    <div className="space-y-2">
                      <button className="w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        • Review pending matches
                      </button>
                      <button className="w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        • Schedule follow-up interviews
                      </button>
                      <button className="w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        • Update job descriptions
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Time to Hire', value: '14 days', target: '10 days', status: 'warning' },
                    { label: 'Quality of Hire', value: '92%', target: '85%', status: 'success' },
                    { label: 'Candidate Satisfaction', value: '4.8/5', target: '4.5', status: 'success' },
                    { label: 'Cost per Hire', value: '$2,800', target: '$3,000', status: 'success' }
                  ].map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">{metric.value}</span>
                          {metric.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            metric.status === 'success' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          }`}
                          style={{ width: metric.label === 'Time to Hire' ? '70%' : '92%' }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Target: {metric.target}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Export Data
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Candidate Matches
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">CSV</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Job Analytics
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">PDF</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Interview Schedule
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Excel</span>
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