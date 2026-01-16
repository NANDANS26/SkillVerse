import { useState } from 'react'
import { CheckCircle, Clock, XCircle, TrendingUp, FileText, Calendar, MessageSquare, ExternalLink } from 'lucide-react'
import Sidebar from '../../components/Sidebar'

// Mock applications data
const applications = [
  {
    id: 1,
    jobTitle: 'Frontend Developer',
    company: 'TechCorp',
    status: 'accepted',
    date: '2024-01-15',
    matchScore: 95,
    nextStep: 'Final interview scheduled for Jan 30',
    timeline: [
      { step: 'Applied', date: 'Jan 10', status: 'completed' },
      { step: 'Screening', date: 'Jan 12', status: 'completed' },
      { step: 'Technical Interview', date: 'Jan 18', status: 'completed' },
      { step: 'Final Interview', date: 'Jan 30', status: 'upcoming' }
    ]
  },
  {
    id: 2,
    jobTitle: 'Backend Engineer',
    company: 'DataSystems',
    status: 'pending',
    date: '2024-01-18',
    matchScore: 88,
    nextStep: 'Awaiting technical interview schedule',
    timeline: [
      { step: 'Applied', date: 'Jan 18', status: 'completed' },
      { step: 'Screening', date: 'Jan 20', status: 'completed' },
      { step: 'Technical Interview', date: 'TBD', status: 'current' },
      { step: 'Final Interview', date: 'TBD', status: 'pending' }
    ]
  },
  {
    id: 3,
    jobTitle: 'Full Stack Developer',
    company: 'StartupXYZ',
    status: 'rejected',
    date: '2024-01-10',
    matchScore: 92,
    nextStep: 'Try again in 6 months',
    timeline: [
      { step: 'Applied', date: 'Jan 10', status: 'completed' },
      { step: 'Screening', date: 'Jan 12', status: 'completed' },
      { step: 'Technical Interview', date: 'Jan 15', status: 'completed' },
      { step: 'Final Interview', date: 'Jan 18', status: 'rejected' }
    ]
  },
  {
    id: 4,
    jobTitle: 'DevOps Engineer',
    company: 'CloudTech',
    status: 'pending',
    date: '2024-01-22',
    matchScore: 78,
    nextStep: 'Phone screening scheduled for Jan 25',
    timeline: [
      { step: 'Applied', date: 'Jan 22', status: 'completed' },
      { step: 'Screening', date: 'Jan 25', status: 'upcoming' },
      { step: 'Technical Interview', date: 'TBD', status: 'pending' },
      { step: 'Final Interview', date: 'TBD', status: 'pending' }
    ]
  },
  {
    id: 5,
    jobTitle: 'UX/UI Designer',
    company: 'DesignStudio',
    status: 'accepted',
    date: '2024-01-05',
    matchScore: 65,
    nextStep: 'Offer letter sent - awaiting response',
    timeline: [
      { step: 'Applied', date: 'Jan 5', status: 'completed' },
      { step: 'Screening', date: 'Jan 8', status: 'completed' },
      { step: 'Portfolio Review', date: 'Jan 12', status: 'completed' },
      { step: 'Offer', date: 'Jan 20', status: 'completed' }
    ]
  }
]

export default function CandidateApplications() {
  const [filter, setFilter] = useState('all')
  
  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    if (filter === 'active') return app.status === 'pending'
    if (filter === 'accepted') return app.status === 'accepted'
    if (filter === 'rejected') return app.status === 'rejected'
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'pending':
        return 'In Progress'
      case 'rejected':
        return 'Not Selected'
      default:
        return 'Unknown'
    }
  }

  const stats = {
    total: applications.length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    pending: applications.filter(a => a.status === 'pending').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    avgScore: Math.round(applications.reduce((acc, app) => acc + app.matchScore, 0) / applications.length)
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your job applications and interview progress
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Applications
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.accepted}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Accepted
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                In Progress
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.avgScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Avg Match Score
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Applications
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl font-medium ${
                filter === 'active'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-xl font-medium ${
                filter === 'accepted'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-xl font-medium ${
                filter === 'rejected'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Not Selected
            </button>
          </div>

          {/* Applications List */}
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                  <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {application.jobTitle}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{application.company}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Applied: {application.date}
                        </span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          Match: {application.matchScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(application.status)}`}>
                      {getStatusLabel(application.status)}
                    </span>
                    {getStatusIcon(application.status)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Progress</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {application.timeline.filter(step => step.status === 'completed').length} of {application.timeline.length} steps
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ 
                        width: `${(application.timeline.filter(step => step.status === 'completed').length / application.timeline.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Application Timeline</h4>
                  <div className="flex flex-wrap gap-4">
                    {application.timeline.map((step, index) => (
                      <div key={index} className="flex-1 min-w-[150px]">
                        <div className="flex items-center mb-2">
                          <div className={`h-3 w-3 rounded-full mr-2 ${
                            step.status === 'completed' ? 'bg-green-500' :
                            step.status === 'current' ? 'bg-blue-500' :
                            step.status === 'upcoming' ? 'bg-yellow-500' :
                            'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{step.step}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">{step.date}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Step & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="mb-4 lg:mb-0">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm font-medium">Next Step:</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{application.nextStep}</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                      <MessageSquare size={16} />
                      <span>Contact</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700">
                      <ExternalLink size={16} />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No applications found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {filter === 'all' 
                  ? "You haven't applied to any jobs yet."
                  : `No ${filter} applications found.`}
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700">
                Browse Jobs
              </button>
            </div>
          )}

          {/* Tips */}
          <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800/50">
            <div className="flex items-start space-x-4">
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Application Success Tips
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Follow up within 5-7 business days if you haven't heard back</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Customize your resume for each application to highlight relevant skills</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Prepare 3-5 questions to ask during interviews to show interest</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Keep your LinkedIn profile updated and consistent with your resume</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}