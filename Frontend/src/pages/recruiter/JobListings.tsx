import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  MapPin, 
  Briefcase, 
  Eye,
  Edit,
  Target,
  Users,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

type JobStatus = 'active' | 'draft' | 'closed'

interface Job {
  id: number
  title: string
  location: string | null
  experience_min: number | null
  experience_max: number | null
  created_at: string
  // UI-only fields (not from backend)
  status?: JobStatus
  candidates?: number
  matches?: number
  company?: string
  salary?: string
}

export default function JobListings() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 🔗 Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')

        const res = await fetch(`${API_BASE_URL}/jobs`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : ''
          }
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load jobs')
          setLoading(false)
          return
        }

        const apiJobs: Job[] = (data.jobs || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          location: job.location,
          experience_min: job.experience_min,
          experience_max: job.experience_max,
          created_at: job.created_at,
          // default UI-only values
          status: 'active',
          candidates: 0,
          matches: 0,
          company: 'Your Company',
          salary: ''
        }))

        setJobs(apiJobs)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError('Something went wrong')
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const filteredJobs = jobs
    .filter(job => {
      const status: JobStatus = job.status || 'active'
      if (filter === 'all') return true
      return status === filter
    })
    .filter(job => {
      const title = job.title?.toLowerCase() || ''
      const company = (job.company || '').toLowerCase()
      const term = searchTerm.toLowerCase()
      return title.includes(term) || company.includes(term)
    })

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'draft': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'closed': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'closed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return ''
    }
  }

  const totalCandidates = jobs.reduce((acc, job) => acc + (job.candidates || 0), 0)
  const totalMatches = jobs.reduce((acc, job) => acc + (job.matches || 0), 0)
  const activeJobsCount = jobs.filter(j => (j.status || 'active') === 'active').length

  if (loading) {
    return (
      <div className="flex min-h-screen page-transition">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-gray-600 dark:text-gray-300">Loading jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen page-transition">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-500">{error}</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Job Listings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage and track all your job postings
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {jobs.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Jobs</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeJobsCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Jobs</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {totalCandidates}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Candidates</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {totalMatches}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Matches</div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex space-x-2">
                {['all', 'active', 'draft', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
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
          </div>

          {/* Jobs Table */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Candidates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Matches
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredJobs.map((job) => {
                    const status: JobStatus = job.status || 'active'
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{job.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                              <Briefcase size={14} />
                              {job.company || 'Your Company'}
                              <span className="mx-1">•</span>
                              <MapPin size={14} />
                              {job.location || 'Not specified'}
                            </div>
                            {job.salary && (
                              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {job.salary}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Users size={16} className="text-blue-500" />
                            <span className="font-medium">{job.candidates || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Target size={16} className="text-green-500" />
                            <span className="font-medium">{job.matches || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/recruiter/job/${job.id}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              title="View"
                            >
                              <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                            </Link>
                            <Link
                              to={`/recruiter/jobs/${job.id}/matches`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              title="Matches"
                            >
                              <Target size={18} className="text-green-600 dark:text-green-400" />
                            </Link>
                            <Link
                              to={`/recruiter/job/${job.id}/edit`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              title="Edit"
                            >
                              <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
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
          )}
        </div>
      </div>
    </div>
  )
}
