import { TrendingUp, Users, Briefcase, DollarSign, BarChart3, Activity, Globe, Shield } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function Admin() {
  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Platform analytics and system management
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Users, label: 'Total Candidates', value: '10,248', change: '+12%', color: 'from-blue-500 to-cyan-500' },
              { icon: Briefcase, label: 'Active Jobs', value: '1,856', change: '+5%', color: 'from-purple-500 to-pink-500' },
              { icon: DollarSign, label: 'Revenue', value: '$248K', change: '+24%', color: 'from-green-500 to-emerald-500' },
              { icon: Globe, label: 'Countries', value: '48', change: '+3', color: 'from-orange-500 to-red-500' }
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* System Health */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  System Health
                </h2>
                <div className="space-y-6">
                  {[
                    { label: 'API Response Time', value: '98%', status: 'healthy' },
                    { label: 'Server Uptime', value: '99.9%', status: 'healthy' },
                    { label: 'Database Load', value: '65%', status: 'warning' },
                    { label: 'AI Model Accuracy', value: '95%', status: 'healthy' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        <span className={`font-bold ${
                          item.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.status === 'healthy' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          }`}
                          style={{ 
                            width: item.label === 'Database Load' ? '65%' : 
                                   item.label === 'AI Model Accuracy' ? '95%' : 
                                   item.label === 'API Response Time' ? '98%' : '99.9%' 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Recent Activity
                </h2>
                <div className="space-y-6">
                  {[
                    { action: 'New company registration', user: 'TechCorp Inc.', time: '5 min ago', type: 'success' },
                    { action: 'Job posting created', user: 'John Recruiter', time: '15 min ago', type: 'info' },
                    { action: 'Bulk candidate import', user: 'System Admin', time: '1 hour ago', type: 'warning' },
                    { action: 'System backup completed', user: 'Automated', time: '2 hours ago', type: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`p-2 rounded-lg mr-4 ${
                        activity.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                        activity.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          activity.type === 'success' ? 'text-green-600 dark:text-green-400' :
                          activity.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          by {activity.user} • {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Security Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Security Overview
                  </h2>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'Firewall Status', value: 'Active', status: 'secure' },
                    { label: 'SSL Certificate', value: 'Valid', status: 'secure' },
                    { label: 'Failed Login Attempts', value: '2', status: 'warning' },
                    { label: 'Last Security Scan', value: 'Today', status: 'secure' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className={`font-bold ${
                        item.status === 'secure' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics Chart */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Platform Growth
                </h2>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Analytics chart component would appear here
                    </p>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">↑ 42%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Candidates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">↑ 28%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Jobs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">↑ 56%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Matches</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  System Actions
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-sm">
                    Run Backup
                  </button>
                  <button className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors text-sm">
                    Clear Cache
                  </button>
                  <button className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors text-sm">
                    Update System
                  </button>
                  <button className="px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all text-sm">
                    Security Scan
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