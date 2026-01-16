import { useState } from 'react'
import { Search, Filter, Star, MapPin, DollarSign, Clock, TrendingUp } from 'lucide-react'
import Sidebar from '../../components/Sidebar'

// Mock job data
const mockJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    type: 'Full-time',
    posted: '2 days ago',
    matchScore: 95,
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    description: 'We are looking for a skilled Frontend Developer to join our team...'
  },
  {
    id: 2,
    title: 'Backend Engineer',
    company: 'DataSystems',
    location: 'Remote',
    salary: '$130k - $160k',
    type: 'Full-time',
    posted: '1 week ago',
    matchScore: 88,
    skills: ['Node.js', 'Python', 'AWS', 'PostgreSQL'],
    description: 'Build scalable backend systems for our data platform...'
  },
  {
    id: 3,
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    salary: '$110k - $140k',
    type: 'Full-time',
    posted: '3 days ago',
    matchScore: 92,
    skills: ['React', 'Node.js', 'MongoDB', 'GraphQL'],
    description: 'Join our early-stage startup and build amazing products...'
  },
  {
    id: 4,
    title: 'DevOps Engineer',
    company: 'CloudTech',
    location: 'Remote',
    salary: '$140k - $170k',
    type: 'Contract',
    posted: '5 days ago',
    matchScore: 78,
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    description: 'Implement and maintain our cloud infrastructure...'
  },
  {
    id: 5,
    title: 'UX/UI Designer',
    company: 'DesignStudio',
    location: 'Los Angeles, CA',
    salary: '$100k - $130k',
    type: 'Full-time',
    posted: '1 day ago',
    matchScore: 65,
    skills: ['Figma', 'Sketch', 'UI Design', 'Prototyping'],
    description: 'Design beautiful and functional user interfaces...'
  },
  {
    id: 6,
    title: 'Machine Learning Engineer',
    company: 'AI Labs',
    location: 'Boston, MA',
    salary: '$150k - $180k',
    type: 'Full-time',
    posted: '2 weeks ago',
    matchScore: 85,
    skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps'],
    description: 'Develop cutting-edge ML models for various applications...'
  }
]

export default function CandidateJobs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    location: 'all',
    minSalary: '0'
  })
  const [appliedJobs, setAppliedJobs] = useState<number[]>([])

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = selectedFilters.type === 'all' || job.type === selectedFilters.type
    const matchesLocation = selectedFilters.location === 'all' || 
                           (selectedFilters.location === 'remote' && job.location.toLowerCase().includes('remote')) ||
                           (selectedFilters.location !== 'remote' && selectedFilters.location !== 'all' && job.location.toLowerCase().includes(selectedFilters.location))
    const matchesSalary = parseInt(job.salary.replace(/[^0-9]/g, '')) >= parseInt(selectedFilters.minSalary) * 1000

    return matchesSearch && matchesType && matchesLocation && matchesSalary
  })

  const handleApply = (jobId: number) => {
    setAppliedJobs(prev => [...prev, jobId])
    setTimeout(() => {
      alert('Application submitted successfully!')
    }, 500)
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-500'
    if (score >= 80) return 'from-blue-500 to-cyan-500'
    if (score >= 70) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Recommended Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Jobs matched to your profile and skills
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {filteredJobs.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Jobs Found
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {appliedJobs.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Applied Jobs
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {Math.round(filteredJobs.reduce((acc, job) => acc + job.matchScore, 0) / filteredJobs.length)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Avg Match Score
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                3
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Interviews Scheduled
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs by title, company, or skills..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                </div>
                
                <select
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  value={selectedFilters.type}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="all">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                </select>

                <select
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  value={selectedFilters.location}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, location: e.target.value }))}
                >
                  <option value="all">All Locations</option>
                  <option value="remote">Remote</option>
                  <option value="san francisco">San Francisco</option>
                  <option value="new york">New York</option>
                </select>

                <select
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  value={selectedFilters.minSalary}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, minSalary: e.target.value }))}
                >
                  <option value="0">Any Salary</option>
                  <option value="80">$80k+</option>
                  <option value="100">$100k+</option>
                  <option value="120">$120k+</option>
                  <option value="150">$150k+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{job.company.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">{job.company}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Match Score */}
                  <div className="text-center">
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${getMatchColor(job.matchScore)} flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{job.matchScore}%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Match</p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <MapPin size={16} />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign size={16} />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} />
                      <span>{job.posted}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    <Star size={18} />
                    <span>Save</span>
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                      View Details
                    </button>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={appliedJobs.includes(job.id)}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        appliedJobs.includes(job.id)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {appliedJobs.includes(job.id) ? 'Applied ✓' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <div className="h-24 w-24 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* ML Explanation */}
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-start space-x-4">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  How Job Matching Works
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Our AI algorithm analyzes your skills, experience, and preferences to match you with 
                  the most relevant job opportunities. Match scores are calculated based on skill overlap, 
                  experience level, location preferences, and company culture fit.
                </p>
                <button className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Learn more about our matching algorithm →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}