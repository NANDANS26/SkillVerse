import { useState } from 'react'
import { 
  Settings as SettingsIcon,
  Bell,
  User,
  Shield,
  Mail,
  Lock,
  Globe,
  Moon,
  Sun,
  Save,
  X,
  CheckCircle,
  Download,
  Upload,
  Trash2,
  HelpCircle
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useTheme } from '../../contexts/ThemeContext'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    profile: {
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      company: 'TechCorp Inc.',
      role: 'Senior Recruiter',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York'
    },
    notifications: {
      emailNotifications: true,
      matchAlerts: true,
      candidateUpdates: true,
      interviewReminders: true,
      weeklyReports: true,
      pushNotifications: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      passwordLastChanged: '2024-01-01'
    },
    preferences: {
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      resultsPerPage: 20,
      autoSave: true,
      darkMode: theme === 'dark'
    }
  })

  const handleSave = () => {
    // Save settings logic here
    console.log('Settings saved:', settings)
  }

  const handleReset = () => {
    // Reset settings logic here
    console.log('Settings reset')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ]

  return (
    <div className="flex min-h-screen page-transition">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Profile Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                          <User className="h-12 w-12 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Profile Picture
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            Upload a new profile picture
                          </p>
                          <div className="flex space-x-4 mt-4">
                            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                              Upload New
                            </button>
                            <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:border-red-500 transition-colors">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={settings.profile.name}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              profile: { ...prev.profile, name: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={settings.profile.email}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              profile: { ...prev.profile, email: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={settings.profile.company}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              profile: { ...prev.profile, company: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={settings.profile.phone}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              profile: { ...prev.profile, phone: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Timezone
                          </label>
                          <select
                            value={settings.profile.timezone}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              profile: { ...prev.profile, timezone: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Paris">Paris (CET)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Notification Settings
                    </h2>
                    
                    <div className="space-y-6">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Receive notifications for {key.toLowerCase().replace('notifications', '')}
                            </p>
                          </div>
                          <button
                            onClick={() => setSettings(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [key]: !value }
                            }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              value 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                                : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Security Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              Two-Factor Authentication
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <button
                            onClick={() => setSettings(prev => ({
                              ...prev,
                              security: { ...prev.security, twoFactorAuth: !prev.security.twoFactorAuth }
                            }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.security.twoFactorAuth
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                                : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                          Password Settings
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Password last changed</span>
                            <span className="text-gray-900 dark:text-white">{settings.security.passwordLastChanged}</span>
                          </div>
                          <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                            <Lock size={20} />
                            <span>Change Password</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                          Session Settings
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Session Timeout</span>
                            <div className="flex items-center space-x-4">
                              <select
                                value={settings.security.sessionTimeout}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                                }))}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                              >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>60 minutes</option>
                                <option value={120}>2 hours</option>
                                <option value={0}>Never</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences */}
                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Preferences
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Language
                          </label>
                          <select
                            value={settings.preferences.language}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, language: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date Format
                          </label>
                          <select
                            value={settings.preferences.dateFormat}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, dateFormat: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Results per Page
                          </label>
                          <select
                            value={settings.preferences.resultsPerPage}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, resultsPerPage: parseInt(e.target.value) }
                            }))}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
                          >
                            <option value={10}>10 items</option>
                            <option value={20}>20 items</option>
                            <option value={50}>50 items</option>
                            <option value={100}>100 items</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Dark Mode
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Switch between light and dark themes
                            </p>
                          </div>
                          <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Integrations */}
                {activeTab === 'integrations' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Integrations
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white rounded-xl">
                              <Globe className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                Calendar Integration
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Connect Google Calendar for scheduling
                              </p>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                            Connect
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white rounded-xl">
                              <Mail className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                Email Integration
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Connect your email for notifications
                              </p>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all">
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save & Reset Buttons */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:border-blue-500 transition-colors"
                  >
                    Reset to Defaults
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <Save size={20} />
                    <span>Save Changes</span>
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