import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-extrabold text-blue-600">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
