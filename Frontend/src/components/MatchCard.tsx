import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Award, MapPin, Calendar, ChevronRight, Star, Target } from 'lucide-react'
import { Candidate } from '../interfaces'

interface MatchCardProps {
  candidate: Candidate
  score: number
  skillOverlap: number
  embeddingSimilarity: number
  matchedSkills: string[]
  evidence: string[]
}

export default function MatchCard({ candidate, score, skillOverlap, embeddingSimilarity, matchedSkills, evidence }: MatchCardProps) {
  const scoreColor = score >= 90 ? 'from-green-500 to-emerald-600' :
                    score >= 80 ? 'from-blue-500 to-cyan-600' :
                    score >= 70 ? 'from-yellow-500 to-orange-500' :
                    'from-red-500 to-pink-600'

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 card-hover shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {candidate.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{candidate.title}</p>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={14} />
                <span>{candidate.location}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <Calendar size={14} />
                <span>{candidate.experience}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${scoreColor} text-white font-bold`}>
            {score}%
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
            <Award size={14} className="mr-1" />
            <span>Match Score</span>
          </div>
        </div>
      </div>

      {/* Match Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{skillOverlap}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Skill Overlap</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{embeddingSimilarity}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Embedding Similarity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{score}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Score</div>
        </div>
      </div>

      {/* Matched Skills */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Matched Skills</h4>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.slice(0, 6).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
            >
              {skill}
            </span>
          ))}
          {matchedSkills.length > 6 && (
            <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm">
              +{matchedSkills.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Evidence Snippet */}
      {evidence[0] && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Why Matched</h4>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300 text-sm">"{evidence[0]}"</p>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <Link
          to={`/recruiter/candidate/${candidate.id}`}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg"
        >
          <Target size={20} />
          <span>View Profile</span>
          <ChevronRight size={20} />
        </Link>
        <button className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors">
          <Star size={20} />
        </button>
      </div>
    </div>
  )
}