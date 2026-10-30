import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, UserRole } from '../types/roles'

interface RolePlaceholderProps {
  role: UserRole
}

export default function RolePlaceholder({ role }: RolePlaceholderProps) {
  const { user, logout } = useAuth()
  const roleName = ROLE_LABELS[role] || role

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6 border border-gray-200 dark:border-gray-700">
        <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {roleName} Portal
          </h1>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
            Coming Soon — Phase 3
          </p>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          The full multi-tenant module for <strong>{roleName}</strong> accounts is scheduled for Phase 3 rollout.
          {user && (
            <span className="block mt-2">
              Logged in as <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{user.email}</code>
            </span>
          )}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            SkillVerse Home
          </Link>
          <button
            onClick={() => void logout()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
