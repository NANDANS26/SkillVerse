import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Briefcase, 
  User, 
  Settings, 
  BarChart3, 
  FileText,
  Users,
  Building,
  LogOut,
  GraduationCap,
  Shield,
  PlusCircle,
  Target,
  List,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  Award,
  Calendar,
  Mail,
  Download,
  Search,
  Star,
  BookOpen,
  Rocket,
  Trophy,
  Zap
} from 'lucide-react'
import { useSidebar } from '../contexts/SidebarContext'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const recruiterLinks = [
  { icon: Briefcase, label: 'Dashboard', path: '/recruiter/dashboard' },
  { icon: PlusCircle, label: 'Create Job', path: '/recruiter/create-job' },
  { icon: List, label: 'Job Listings', path: '/recruiter/jobs' },
  { icon: Users, label: 'Candidates', path: '/recruiter/candidates' },
  { icon: Target, label: 'Matches', path: '/recruiter/matches' },
  { icon: BarChart3, label: 'Analytics', path: '/recruiter/analytics' },
  { icon: Calendar, label: 'Interviews', path: '/recruiter/interviews' },
  { icon: Settings, label: 'Settings', path: '/recruiter/settings' },
]

const candidateLinks = [
  { icon: Home, label: 'Dashboard', path: '/candidate/dashboard' },
  { icon: User, label: 'Profile', path: '/candidate/profile' },
  { icon: Target, label: 'Recommended Jobs', path: '/candidate/jobs' },
  { icon: FileText, label: 'Applications', path: '/candidate/applications' },
  { icon: BookOpen, label: 'Learning Path', path: '/candidate/learning' },
  { icon: Trophy, label: 'Achievements', path: '/candidate/achievements' },
  { icon: Settings, label: 'Settings', path: '/candidate/settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOpen, closeSidebar } = useSidebar()
  const { user, logout } = useAuth()
  const [showQuickStats, setShowQuickStats] = useState(true)
  
  if (!user) return null
  
  const isRecruiter = user.role === 'recruiter'
  const isCandidate = user.role === 'student'
  const links = isRecruiter ? recruiterLinks : candidateLinks
  
  const handleLogout = () => {
    logout()
    navigate('/')
    closeSidebar()
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case 'student':
        return <GraduationCap className="h-5 w-5 text-blue-500" />
      case 'recruiter':
        return <Briefcase className="h-5 w-5 text-purple-500" />
      case 'admin':
        return <Shield className="h-5 w-5 text-green-500" />
      default:
        return <User className="h-5 w-5 text-gray-500" />
    }
  }

  const getRoleLabel = () => {
    switch (user.role) {
      case 'student':
        return 'Candidate'
      case 'recruiter':
        return 'Recruiter'
      case 'admin':
        return 'Administrator'
      default:
        return user.role
    }
  }

  const isActive = (path: string) => {
    if (path === '/candidate/dashboard' || path === '/recruiter/dashboard') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 glass-effect border-r border-gray-200/50 dark:border-gray-700/50
        transform transition-transform duration-300 z-50 pt-16
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* User Profile */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                  {user.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {getRoleIcon()}
                  <span className="truncate">{getRoleLabel()}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {user.email}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-4">
                {isRecruiter ? 'Recruiter Navigation' : 'Candidate Navigation'}
              </h3>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.path)
                  
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={closeSidebar}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${active 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Quick Stats - Different for Recruiter vs Candidate */}
            {showQuickStats && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setShowQuickStats(!showQuickStats)}
                  >
                    Quick Stats
                  </h3>
                  <TrendingUp size={14} className="text-green-500" />
                </div>
                
                {isRecruiter ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Active Jobs</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">12</span>
                      </div>
                      <div className="h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '75%' }} />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Pending Matches</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">8</span>
                      </div>
                      <div className="h-1 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Applied Jobs</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">12</span>
                      </div>
                      <div className="h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '60%' }} />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Profile Score</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">95%</span>
                      </div>
                      <div className="h-1 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '95%' }} />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Interviews</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">5</span>
                      </div>
                      <div className="h-1 bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="mb-8">
              {isCandidate ? (
                <Link
                  to="/candidate/jobs"
                  onClick={closeSidebar}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Rocket size={20} />
                  <span>Find Jobs</span>
                </Link>
              ) : (
                <Link
                  to="/recruiter/create-job"
                  onClick={closeSidebar}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <PlusCircle size={20} />
                  <span>Post New Job</span>
                </Link>
              )}
            </div>

            {/* Help & Support */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Need Help?
              </h4>
              <div className="space-y-2">
                <Link
                  to="/help"
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={closeSidebar}
                >
                  <HelpCircle size={16} />
                  <span>Help Center</span>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={closeSidebar}
                >
                  <MessageSquare size={16} />
                  <span>Contact Support</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <Link
              to="/"
              onClick={closeSidebar}
              className="flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors mb-2"
            >
              <Home size={20} />
              <span className="font-medium">Back to Home</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}