import { TrendingUp, Briefcase, Target, Star, FileText, Users } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import SkillRadar from '../../components/SkillRadar'
import { candidates } from '../../data/candidates'
import { jobs } from '../../data/jobs'

export default function CandidateDashboard() {
  const candidate = candidates[0] // Using first candidate as logged in user

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {candidate.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Here's your personalized dashboard with job recommendations and profile insights
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Briefcase, label: 'Applied Jobs', value: '12', change: '+2', color: 'from-blue-500 to-cyan-500' },
              { icon: Target, label: 'Interviews', value: '5', change: '+1', color: 'from-purple-500 to-pink-500' },
              { icon: Star, label: 'Profile Score', value: '95%', change: '+5%', color: 'from-green-500 to-emerald-500' },
              { icon: Users, label: 'Network', value: '48', change: '+8', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <TrendingUp className="mr-1" size={16} />
                    {stat.change}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Skills */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Summary
                  </h2>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold">
                    {candidate.experience}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Profile Completeness</span>
                    <div className="flex items-center">
                      <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '95%' }} />
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">95%</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mt-4">
                    {candidate.resumeSummary}
                  </p>
                </div>
              </div>

              {/* Skills Radar */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Skill Analysis
                </h2>
                <div className="h-80">
                  <SkillRadar skills={candidate.skills} />
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Recent Projects
                </h2>
                <div className="space-y-6">
                  {candidate.projects.map((project, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {project.duration}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
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
                        <span className="font-semibold">Impact:</span> {project.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Recommendations */}
            <div className="space-y-8">
              {/* Recommended Jobs */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Recommended Jobs
                </h2>
                <div className="space-y-4">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <div className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded">
                          {job.salary}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.experience}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
                        {job.jdText}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Match:</span>
                          <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                            {Math.floor(Math.random() * 30) + 70}%
                          </span>
                        </div>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Skill Gaps to Address
                </h2>
                <div className="space-y-4">
                  {[
                    { skill: 'AWS', gap: 25, priority: 'High' },
                    { skill: 'Docker', gap: 30, priority: 'Medium' },
                    { skill: 'GraphQL', gap: 20, priority: 'Low' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{item.skill}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {item.priority} Priority
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                          style={{ width: `${item.gap}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.gap}% gap to reach target level
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
                    <FileText size={20} />
                    <span>Update Resume</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <Briefcase size={20} />
                    <span>Browse Jobs</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
                    <Users size={20} />
                    <span>Network</span>
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