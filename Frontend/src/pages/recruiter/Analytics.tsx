import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Target, 
  Calendar,
  Download,
  Filter,
  Clock,
  Award,
  DollarSign,
  PieChart,
  LineChart
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month')

  const stats = {
    totalCandidates: 156,
    totalJobs: 12,
    totalMatches: 42,
    avgMatchScore: 85,
    timeToHire: 14,
    costPerHire: 2800,
    qualityOfHire: 92,
    candidateSatisfaction: 4.8
  }

  const trends = [
    { month: 'Jan', matches: 12, hires: 3, candidates: 45 },
    { month: 'Feb', matches: 15, hires: 4, candidates: 52 },
    { month: 'Mar', matches: 18, hires: 5, candidates: 61 },
    { month: 'Apr', matches: 21, hires: 6, candidates: 58 },
    { month: 'May', matches: 24, hires: 8, candidates: 67 },
    { month: 'Jun', matches: 27, hires: 10, candidates: 73 }
  ]

  const skillDemand = [
    { skill: 'React', demand: 95, candidates: 42 },
    { skill: 'TypeScript', demand: 88, candidates: 38 },
    { skill: 'Node.js', demand: 82, candidates: 34 },
    { skill: 'AWS', demand: 78, candidates: 28 },
    { skill: 'Docker', demand: 75, candidates: 25 }
  ]

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Track recruitment performance and insights
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {['week', 'month', 'quarter', 'year'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                  <Download size={20} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
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
              <div className="text-gray-600 dark:text-gray-400">Total Candidates</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +15%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalMatches}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Matches</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  -2 days
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.timeToHire} days
              </div>
              <div className="text-gray-600 dark:text-gray-400">Time to Hire</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <TrendingUp className="mr-1" size={16} />
                  +8%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.qualityOfHire}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Quality of Hire</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Growth Chart */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Recruitment Growth
                </h3>
                <div className="flex items-center space-x-2">
                  <LineChart size={20} className="text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last 6 months</span>
                </div>
              </div>
              <div className="space-y-4">
                {trends.map((trend, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{trend.month}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {trend.matches} matches • {trend.hires} hires
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${(trend.matches / 30) * 100}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${(trend.hires / 10) * 100}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${(trend.candidates / 80) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Demand */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Skill Demand & Supply
                </h3>
                <div className="flex items-center space-x-2">
                  <PieChart size={20} className="text-purple-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Market</span>
                </div>
              </div>
              <div className="space-y-4">
                {skillDemand.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{skill.skill}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {skill.candidates} candidates
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${skill.demand}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Demand: {skill.demand}%</span>
                      <span>Gap: {skill.demand - skill.candidates}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Cost Analysis */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Cost Analysis
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Cost per Hire</span>
                  <span className="font-bold text-gray-900 dark:text-white">${stats.costPerHire}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Industry Average</span>
                  <span className="text-gray-600 dark:text-gray-300">$3,000</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${(2800 / 4000) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Candidate Satisfaction */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Candidate Satisfaction
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Average Rating</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.candidateSatisfaction}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Industry Average</span>
                  <span className="text-gray-600 dark:text-gray-300">4.5/5</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    style={{ width: `${(4.8 / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Match Quality */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Match Quality
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Average Score</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.avgMatchScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">High Quality ({'>'}80%)</span>
                  <span className="text-gray-600 dark:text-gray-300">78%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${stats.avgMatchScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              AI Insights & Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-bold text-gray-900 dark:text-white">Positive Trends</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Match quality increased by 15% this quarter
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Time to hire reduced by 2 days on average
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Candidate satisfaction score improved to 4.8/5
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Filter className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-bold text-gray-900 dark:text-white">Areas for Improvement</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">
                      High demand for AWS skills with low candidate supply
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Consider upskilling programs for in-demand technologies
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Expand sourcing channels for niche skill sets
                    </span>
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