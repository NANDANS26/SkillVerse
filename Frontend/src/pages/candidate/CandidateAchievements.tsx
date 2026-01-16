import { useState } from 'react'
import { Trophy, Award, Star, Zap, Target, TrendingUp, Shield, Rocket, Flame, Crown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'

// Mock achievements data
const achievements = [
  {
    id: 1,
    title: 'Profile Perfectionist',
    description: 'Complete your profile to 100%',
    category: 'profile',
    icon: Trophy,
    points: 100,
    unlocked: true,
    progress: 100,
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 2,
    title: 'First Application',
    description: 'Apply to your first job',
    category: 'application',
    icon: Target,
    points: 50,
    unlocked: true,
    progress: 100,
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 3,
    title: 'Interview Master',
    description: 'Complete 5 interviews',
    category: 'interview',
    icon: Shield,
    points: 200,
    unlocked: false,
    progress: 60,
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 4,
    title: 'Learning Machine',
    description: 'Complete 10 courses',
    category: 'learning',
    icon: Rocket,
    points: 150,
    unlocked: false,
    progress: 80,
    color: 'from-green-400 to-emerald-500'
  },
  {
    id: 5,
    title: 'Networking Pro',
    description: 'Connect with 20+ professionals',
    category: 'network',
    icon: Star,
    points: 100,
    unlocked: true,
    progress: 100,
    color: 'from-indigo-400 to-blue-500'
  },
  {
    id: 6,
    title: 'Skill Hunter',
    description: 'Learn 15 new skills',
    category: 'skills',
    icon: Zap,
    points: 300,
    unlocked: false,
    progress: 50,
    color: 'from-red-400 to-pink-500'
  },
  {
    id: 7,
    title: 'Consistency King',
    description: '7-day learning streak',
    category: 'streak',
    icon: Flame,
    points: 75,
    unlocked: true,
    progress: 100,
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 8,
    title: 'Job Match Pro',
    description: 'Get 3 job offers',
    category: 'success',
    icon: Crown,
    points: 500,
    unlocked: false,
    progress: 33,
    color: 'from-purple-400 to-indigo-500'
  }
]

// Categories
const categories = [
  { id: 'all', label: 'All Achievements' },
  { id: 'profile', label: 'Profile' },
  { id: 'application', label: 'Applications' },
  { id: 'interview', label: 'Interviews' },
  { id: 'learning', label: 'Learning' },
  { id: 'network', label: 'Networking' },
  { id: 'skills', label: 'Skills' },
  { id: 'streak', label: 'Streaks' },
  { id: 'success', label: 'Success' }
]

// Leaderboard
const leaderboard = [
  { rank: 1, name: 'Alex Johnson', points: 1850, badge: 'Diamond' },
  { rank: 2, name: 'Sarah Miller', points: 1620, badge: 'Platinum' },
  { rank: 3, name: 'You', points: 1275, badge: 'Gold' },
  { rank: 4, name: 'Mike Chen', points: 1150, badge: 'Gold' },
  { rank: 5, name: 'Emma Davis', points: 980, badge: 'Silver' }
]

export default function CandidateAchievements() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnlocked, setShowUnlocked] = useState(true)
  const [showLocked, setShowLocked] = useState(true)

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory
    const unlockedMatch = showUnlocked && achievement.unlocked
    const lockedMatch = showLocked && !achievement.unlocked
    return categoryMatch && (unlockedMatch || lockedMatch)
  })

  const stats = {
    totalPoints: achievements.reduce((acc, a) => acc + (a.unlocked ? a.points : 0), 0),
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievements.length,
    rank: 3,
    level: 'Gold'
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'from-cyan-400 to-blue-500'
      case 'Platinum': return 'from-gray-300 to-gray-400'
      case 'Gold': return 'from-yellow-400 to-orange-500'
      case 'Silver': return 'from-gray-200 to-gray-300'
      case 'Bronze': return 'from-orange-400 to-red-500'
      default: return 'from-gray-400 to-gray-500'
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
              Achievements & Badges
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your progress and earn rewards
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unlockedCount}/{stats.totalCount}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Achievements Unlocked</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Star className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPoints}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Points</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rank}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Global Rank</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${getLevelColor(stats.level)} flex items-center justify-center`}>
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.level}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Current Level</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Achievements */}
            <div className="lg:col-span-2">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-xl font-medium ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-4 ml-auto">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showUnlocked}
                      onChange={(e) => setShowUnlocked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Unlocked</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showLocked}
                      onChange={(e) => setShowLocked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Locked</span>
                  </label>
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAchievements.map(achievement => {
                  const Icon = achievement.icon
                  return (
                    <div
                      key={achievement.id}
                      className={`bg-white dark:bg-gray-800/50 rounded-2xl p-6 border ${
                        achievement.unlocked
                          ? 'border-yellow-200 dark:border-yellow-800/50'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start space-x-4 mb-4">
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-r ${achievement.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {achievement.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            {achievement.description}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                              {achievement.points} pts
                            </span>
                            {achievement.unlocked ? (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                                Unlocked ✓
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                                {achievement.progress}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!achievement.unlocked && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Empty State */}
              {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                  <div className="h-24 w-24 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No achievements found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your filters or complete more activities
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Leaderboard & Progress */}
            <div className="space-y-8">
              {/* Leaderboard */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Global Leaderboard
                </h3>
                
                <div className="space-y-4">
                  {leaderboard.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        player.name === 'You'
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800/50'
                          : 'bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                          player.rank === 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' :
                          player.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                          player.rank === 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                          'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {player.rank}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {player.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {player.badge} Level
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {player.points.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Your Progress
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Achievement Progress</span>
                      <span>{stats.unlockedCount}/{stats.totalCount}</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${(stats.unlockedCount / stats.totalCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Next Level Progress</span>
                      <span>75%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                        style={{ width: '75%' }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      300 more points to reach Platinum
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Badges */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl p-6 border border-green-200 dark:border-green-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Recent Badges
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2">
                      <Flame className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      7-Day Streak
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Earned today
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-2">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      First Application
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      2 days ago
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Milestone */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Next Milestone
                </h3>
                
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Interview Master</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Complete 5 interviews</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '60%' }} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">3/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}