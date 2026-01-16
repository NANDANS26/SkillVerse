import { X, Mail, Phone, MapPin, Calendar, Award, Briefcase } from 'lucide-react'
import SkillRadar from './SkillRadar'
import { Candidate } from '../interfaces/Candidate'

interface CandidateModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: Candidate
  score: number
  matchedSkills: string[]
}

export default function CandidateModal({ isOpen, onClose, candidate, score, matchedSkills }: CandidateModalProps) {
  if (!isOpen) return null

  const scoreColor = score >= 90 ? 'from-green-500 to-emerald-600' :
                    score >= 80 ? 'from-blue-500 to-cyan-600' :
                    score >= 70 ? 'from-yellow-500 to-orange-500' :
                    'from-red-500 to-pink-600'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Briefcase className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {candidate.name}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mt-1">
                    {candidate.title}
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Mail size={18} />
                      <span>{candidate.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Phone size={18} />
                      <span>{candidate.contact}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <MapPin size={18} />
                      <span>{candidate.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${scoreColor} text-white`}>
                  <div className="text-4xl font-bold">{score}%</div>
                  <div className="text-sm opacity-90">Match Score</div>
                </div>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="inline mr-1" size={14} />
                  {candidate.experience} experience
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Skills & Radar */}
              <div className="lg:col-span-2 space-y-8">
                {/* Skills */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Award className="mr-2" />
                    Skills & Competencies
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(candidate.skills).map(([skill, level]) => (
                      <div key={skill} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{level}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{ width: `${level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Projects
                  </h3>
                  <div className="space-y-4">
                    {candidate.projects.map((project, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-5">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                          {project.title}
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({project.duration})
                          </span>
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
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
                          <span className="font-semibold">Evidence:</span> {project.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Radar & Summary */}
              <div className="space-y-8">
                {/* Radar Chart */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Skill Radar
                  </h3>
                  <SkillRadar skills={candidate.skills} />
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Resume Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {candidate.resumeSummary}
                  </p>
                </div>

                {/* Matched Skills */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Contact Candidate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}