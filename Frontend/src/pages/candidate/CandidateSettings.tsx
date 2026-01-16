import { useState } from 'react'
import { User, Bell, Shield, Globe, Moon, Sun, Mail, Lock, Trash2, Download } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useTheme } from '../../contexts/ThemeContext'

export default function CandidateSettings() {
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    jobAlerts: true,
    applicationUpdates: true,
    newsletter: false,
    marketing: false
  })

  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    availability: 'Immediately',
    publicProfile: true,
    showEmail: false,
    showPhone: false
  })

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleProfileChange = (key: keyof typeof profile, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const handleExportData = () => {
    // In a real app, this would trigger a download
    alert('Data export started. You will receive an email with your data.')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion requested. Please check your email to confirm.')
    }
  }

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your account preferences and privacy settings
            </p>
          </div>

          <div className="space-y-8">
            {/* Profile Settings */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                    value={profile.location}
                    onChange={(e) => handleProfileChange('location', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Availability
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                    value={profile.availability}
                    onChange={(e) => handleProfileChange('availability', e.target.value)}
                  >
                    <option value="Immediately">Immediately</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="2-3 months">2-3 months</option>
                    <option value="Not currently looking">Not currently looking</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profile.publicProfile}
                        onChange={(e) => handleProfileChange('publicProfile', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Make profile visible to recruiters</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profile.showEmail}
                        onChange={(e) => handleProfileChange('showEmail', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show email on profile</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profile.showPhone}
                        onChange={(e) => handleProfileChange('showPhone', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show phone on profile</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700">
                  Save Profile Changes
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Notification Preferences
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={() => handleNotificationToggle('email')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Browser notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={() => handleNotificationToggle('push')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Job Alerts</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">New job recommendations</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.jobAlerts}
                      onChange={() => handleNotificationToggle('jobAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Application Updates</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Status changes on applications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.applicationUpdates}
                      onChange={() => handleNotificationToggle('applicationUpdates')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Newsletter</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Weekly career tips</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.newsletter}
                      onChange={() => handleNotificationToggle('newsletter')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Marketing Emails</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Promotional content</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.marketing}
                      onChange={() => handleNotificationToggle('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Privacy & Security
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Change Password</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Update your account password</div>
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                      <Lock size={16} />
                      <span>Change</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Add extra security to your account</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Data Export</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Download all your data</div>
                    </div>
                    <button 
                      onClick={handleExportData}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download size={16} />
                      <span>Export Data</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Delete Account</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account</div>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-white" />
                  ) : (
                    <Sun className="h-5 w-5 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Appearance
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Theme</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode</div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun size={16} />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon size={16} />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Language</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Interface language</div>
                  </div>
                  <select className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Time Zone</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">For scheduling and notifications</div>
                  </div>
                  <select className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <option>(UTC-08:00) Pacific Time</option>
                    <option>(UTC-05:00) Eastern Time</option>
                    <option>(UTC+00:00) London</option>
                    <option>(UTC+05:30) India</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Help & Support
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/help" className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">Help Center</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Browse articles and guides</div>
                </a>

                <a href="/contact" className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">Contact Support</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Get help from our team</div>
                </a>

                <a href="/feedback" className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">Send Feedback</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Help us improve</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}