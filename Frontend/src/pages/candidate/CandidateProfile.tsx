import { useParams } from 'react-router-dom'
import { Mail, Phone, MapPin, Calendar, Award, Briefcase, Download } from 'lucide-react'
import { candidates } from '../data/candidates'
import SkillRadar from '../components/SkillRadar'

export default function CandidateProfile() {
  const { id } = useParams()
  const candidate = candidates.find(c => c.id === id)

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Candidate not found
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-transition">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Briefcase className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {candidate.name}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mt-1">
                {candidate.title}
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
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
              <Mail size={20} />
              <span>Contact</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
              <Download size={20} />
              <span>Download Resume</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Info */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Email
                </label>
                <div className="flex items-center space-x-3">
                  <Mail className="text-blue-500" size={20} />
                  <span className="text-gray-900 dark:text-white">{candidate.email}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Phone
                </label>
                <div className="flex items-center space-x-3">
                  <Phone className="text-blue-500" size={20} />
                  <span className="text-gray-900 dark:text-white">{candidate.contact}</span>
                </div>
              </div>
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
                  Salary Expectation
                </label>
                <div className="flex items-center space-x-3">
                  <Award className="text-purple-500" size={20} />
                  <span className="text-gray-900 dark:text-white">{candidate.salaryExpectation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Technical Skills
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
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Projects
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

          {/* Education */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Education
            </h2>
            <div className="space-y-4">
              {candidate.education.map((edu, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-4">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{edu}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Graduated</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Profile Stats
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Profile Strength', value: '95%' },
                { label: 'Response Rate', value: '85%' },
                { label: 'Interview Success', value: '78%' },
                { label: 'Skill Match Avg', value: '82%' }
              ].map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{stat.label}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}