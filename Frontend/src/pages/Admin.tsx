import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Shield, 
  RefreshCw, 
  Database, 
  Cpu, 
  Building2, 
  GraduationCap,
  Sparkles,
  Search,
  School,
  BarChart3,
  AlertCircle,
  FileText,
  Award
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

interface PlatformOverviewData {
  platform: string;
  timestamp: string;
  database_status: string;
  users: {
    total: number;
    by_role: Record<string, number>;
  };
  counts: {
    candidates: number;
    jobs: number;
    institutions: number;
    companies: number;
  };
  indexing_queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  ml_service: {
    live_index?: {
      total_candidates: number;
      dimensions: number;
      source: string;
      has_backup_snapshot?: boolean;
    };
    benchmark_index?: {
      total_candidates: number;
      dimensions: number;
      source: string;
    };
    status?: string;
    error?: string;
  };
}

const mockDemoUsers = [
  { id: 1, name: 'Alex Admin', email: 'admin@skillverse.ai', role: 'super_admin', created_at: '2026-08-01T00:00:00Z' },
  { id: 2, name: 'Dr. Eleanor Vance', email: 'e.vance@apex.edu', role: 'college_admin', created_at: '2026-08-05T00:00:00Z' },
  { id: 3, name: 'Prof. David Vance', email: 'd.vance@apex.edu', role: 'faculty', created_at: '2026-08-10T00:00:00Z' },
  { id: 4, name: 'Sarah Jenkins', email: 's.jenkins@nexus.io', role: 'company_admin', created_at: '2026-08-12T00:00:00Z' },
  { id: 5, name: 'Rachel Green', email: 'rachel@nexus.io', role: 'recruiter', created_at: '2026-08-15T00:00:00Z' },
  { id: 6, name: 'Maya Lin', email: 'maya.lin@apex.edu', role: 'student', created_at: '2026-09-01T00:00:00Z' }
];

const mockDemoTenants = {
  institutions: [
    { id: 1, name: 'Apex University of Technology', code: 'APEX', domain: 'apex.edu', student_count: 42, faculty_count: 8, created_at: '2026-08-01T00:00:00Z' },
    { id: 2, name: 'Metro Institute of Sciences', code: 'METRO', domain: 'metro.edu', student_count: 18, faculty_count: 4, created_at: '2026-08-15T00:00:00Z' }
  ],
  companies: [
    { id: 1, name: 'Nexus Technologies', domain: 'nexus.io', recruiter_count: 5, job_count: 12, created_at: '2026-08-01T00:00:00Z' },
    { id: 2, name: 'Vertex Systems Corp', domain: 'vertex.ai', recruiter_count: 3, job_count: 7, created_at: '2026-08-20T00:00:00Z' }
  ]
};

import RecommendationEffectivenessDashboard from '../components/RecommendationEffectivenessDashboard'
import PilotProgramManager from '../components/PilotProgramManager'

export default function Admin() {
  const { isDemoMode } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tenants' | 'analytics' | 'recommendations'>('overview')
  const [data, setData] = useState<PlatformOverviewData | null>(null)
  const [loading, setLoading] = useState<boolean>(!isDemoMode)
  const [recovering, setRecovering] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)

  // Users Directory State
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')

  // Tenants Directory State
  const [tenants, setTenants] = useState<{ institutions: any[]; companies: any[] }>({ institutions: [], companies: [] })
  const [loadingTenants, setLoadingTenants] = useState(false)

  // Operational Analytics State
  const [operationalAnalytics, setOperationalAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const fetchOverview = async () => {
    if (isDemoMode) return
    try {
      setLoading(true)
      const res = await api.get<PlatformOverviewData>('/admin/overview')
      setData(res)
    } catch (err: any) {
      console.warn('Failed to fetch real telemetry:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (isDemoMode) {
      setUsers(mockDemoUsers)
      return
    }
    try {
      setLoadingUsers(true)
      const res = await api.get<any>('/admin/users')
      if (res && res.success && Array.isArray(res.users)) {
        setUsers(res.users)
      } else {
        setUsers([])
      }
    } catch (err: any) {
      console.warn('Failed to fetch admin users:', err.message)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchTenants = async () => {
    if (isDemoMode) {
      setTenants(mockDemoTenants)
      return
    }
    try {
      setLoadingTenants(true)
      const res = await api.get<any>('/admin/tenants')
      if (res && res.success) {
        setTenants({
          institutions: res.institutions || [],
          companies: res.companies || []
        })
      } else {
        setTenants({ institutions: [], companies: [] })
      }
    } catch (err: any) {
      console.warn('Failed to fetch admin tenants:', err.message)
      setTenants({ institutions: [], companies: [] })
    } finally {
      setLoadingTenants(false)
    }
  }

  const fetchAnalytics = async () => {
    if (isDemoMode) return
    try {
      setLoadingAnalytics(true)
      const res = await api.get<any>('/analytics/operations')
      if (res && res.success) {
        setOperationalAnalytics(res)
      }
    } catch (err: any) {
      console.warn('Failed to fetch operational analytics:', err.message)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [isDemoMode])

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers()
    } else if (activeTab === 'tenants' && tenants.institutions.length === 0 && tenants.companies.length === 0) {
      fetchTenants()
    } else if (activeTab === 'analytics' && !operationalAnalytics) {
      fetchAnalytics()
    }
  }, [activeTab])

  const handleRecoverQueue = async () => {
    try {
      setRecovering(true)
      setMessage(null)
      const res = await api.post('/admin/indexing/recover')
      setMessage(res.message || 'Indexing queue processed successfully')
      await fetchOverview()
    } catch (err: any) {
      setMessage(`Recovery error: ${err.message}`)
    } finally {
      setRecovering(false)
    }
  }

  const candidateCount = isDemoMode ? '10,248' : String(data?.counts?.candidates ?? 0)
  const jobsCount = isDemoMode ? '1,856' : String(data?.counts?.jobs ?? 0)
  const institutionsCount = isDemoMode ? '12' : String(data?.counts?.institutions ?? 0)
  const companiesCount = isDemoMode ? '48' : String(data?.counts?.companies ?? 0)

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchUser || 
      (u.name || '').toLowerCase().includes(searchUser.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Super Administrator Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Platform governance, indexing infrastructure, and operational telemetry
          </p>
          {isDemoMode ? (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>
                <strong>Demonstration Baseline:</strong> Showing static simulation figures. Switch to Live mode for real PostgreSQL & FAISS telemetry.
              </span>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <Database size={14} className="text-emerald-600 shrink-0" />
              <span>
                <strong>PostgreSQL 18 Connected:</strong> Authoritative database telemetry. Live Candidate Index: {data?.ml_service?.live_index?.total_candidates ?? 0} vectors mapped.
              </span>
            </div>
          )}
        </div>

        {!isDemoMode && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                fetchOverview()
                if (activeTab === 'users') fetchUsers()
                if (activeTab === 'tenants') fetchTenants()
                if (activeTab === 'analytics') fetchAnalytics()
              }}
              disabled={loading || loadingUsers || loadingTenants || loadingAnalytics}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} className={(loading || loadingUsers || loadingTenants || loadingAnalytics) ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleRecoverQueue}
              disabled={recovering}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Cpu size={14} className={recovering ? 'animate-spin' : ''} />
              <span>Process Index Queue</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Infrastructure & Telemetry
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Users Directory
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'tenants'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Multi-Tenant Organizations
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Operational Intelligence & Audit
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'recommendations'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Recommendations & Pilot Readiness
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Users, label: 'Candidate Profiles', value: candidateCount, change: isDemoMode ? '+12%' : 'PostgreSQL Live', color: 'from-blue-500 to-cyan-500' },
              { icon: Briefcase, label: 'Active Jobs', value: jobsCount, change: isDemoMode ? '+5%' : 'PostgreSQL Live', color: 'from-purple-500 to-pink-500' },
              { icon: GraduationCap, label: 'Partner Colleges', value: institutionsCount, change: isDemoMode ? '12 Active' : 'Accredited', color: 'from-emerald-500 to-teal-500' },
              { icon: Building2, label: 'Corporate Partners', value: companiesCount, change: isDemoMode ? '48 Active' : 'Verified', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="mr-1" size={14} />
                    {stat.change}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Indexing Pipeline & Microservices */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  <span>Dynamic Indexing & Outbox Queue</span>
                  <span className="text-xs font-normal text-gray-500">PostgreSQL Queue</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-center border border-gray-200 dark:border-gray-800">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {isDemoMode ? '0' : data?.indexing_queue?.pending ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Pending Jobs</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-center border border-gray-200 dark:border-gray-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {isDemoMode ? '0' : data?.indexing_queue?.processing ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Processing</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-center border border-gray-200 dark:border-gray-800">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {isDemoMode ? '10,248' : data?.indexing_queue?.completed ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-center border border-gray-200 dark:border-gray-800">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {isDemoMode ? '0' : data?.indexing_queue?.failed ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Failed (Retryable)</div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">AI Retrieval Store Status</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <span className="text-gray-600 dark:text-gray-400">Live PostgreSQL Candidate FAISS Store</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {data?.ml_service?.live_index?.total_candidates ?? 0} candidates (384-d)
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <span className="text-gray-600 dark:text-gray-400">Snapshot Integrity (.bak)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {data?.ml_service?.live_index?.has_backup_snapshot ? 'Verified & Active' : 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <span className="text-gray-600 dark:text-gray-400">Synthetic Evaluation Benchmark</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {data?.ml_service?.benchmark_index?.total_candidates ?? 5000} records (Isolated)
                    </span>
                  </div>
                </div>
              </div>

              {/* User Distribution by Canonical Role */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Canonical Role Distribution
                </h2>
                <div className="space-y-3">
                  {['student', 'recruiter', 'college_admin', 'faculty', 'company_admin', 'super_admin'].map((role) => {
                    const count = isDemoMode ? (role === 'student' ? 1420 : 12) : (data?.users?.by_role?.[role] ?? 0)
                    return (
                      <div key={role} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">
                          {role.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">
                          {count} user(s)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Security & Infrastructure Telemetry */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800/50">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl mr-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Security & Boundary Policy
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PostgreSQL RBAC & Institution Isolation</p>
                  </div>
                </div>
                <div className="space-y-4 text-xs">
                  {[
                    { label: 'HttpOnly Session Cookies', value: 'Enforced (Strict / Lax)', status: 'secure' },
                    { label: 'Role Escalation Defense', value: 'Active (Server-Side)', status: 'secure' },
                    { label: 'ML Service-to-Service Secret', value: 'Protected (X-Service-Token)', status: 'secure' },
                    { label: 'Institution & Company Scoping', value: 'Enforced via Foreign Keys', status: 'secure' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 dark:bg-gray-900/40">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Administrative Operations
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleRecoverQueue}
                    disabled={recovering}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-xs text-center"
                  >
                    Sync Outbox Queue
                  </button>
                  <button 
                    onClick={fetchOverview}
                    className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:border-blue-500 transition-colors text-xs text-center"
                  >
                    Poll Telemetry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
                <option value="college_admin">College Admin</option>
                <option value="faculty">Faculty</option>
                <option value="company_admin">Company Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-1"
              >
                <RefreshCw size={12} className={loadingUsers ? 'animate-spin' : ''} />
                <span>Reload</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Canonical Role</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Credentials Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No users found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-400">#{u.id}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{u.name || 'Unnamed'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          u.role === 'super_admin' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                          u.role === 'college_admin' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                          u.role === 'company_admin' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' :
                          u.role === 'recruiter' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' :
                          u.role === 'faculty' ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300' :
                          'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Shield size={12} /> Password Omitted
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Institutions Section */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <School className="text-indigo-600" size={20} />
              <span>Higher Education Institutions ({tenants.institutions.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.institutions.map((inst: any) => (
                <div key={inst.id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{inst.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md font-mono">{inst.code}</span>
                  </div>
                  <div className="text-xs text-gray-500">Domain: {inst.domain}</div>
                  <div className="pt-2 flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-400">Enrolled Students: </span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{inst.student_count ?? 0}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Faculty Mentors: </span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{inst.faculty_count ?? 0}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Companies Section */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="text-purple-600" size={20} />
              <span>Corporate Employer Tenants ({tenants.companies.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.companies.map((comp: any) => (
                <div key={comp.id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{comp.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-md font-mono">#{comp.id}</span>
                  </div>
                  <div className="text-xs text-gray-500">Domain: {comp.domain || 'Direct Access'}</div>
                  <div className="pt-2 flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-400">Recruiters: </span>
                      <strong className="text-purple-600 dark:text-purple-400">{comp.recruiter_count ?? 0}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Job Requisitions: </span>
                      <strong className="text-blue-600 dark:text-blue-400">{comp.job_count ?? 0}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operational Intelligence & Audit Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs mb-1.5">
                <BarChart3 size={12} className="text-indigo-400" />
                <span>Authoritative Operational Intelligence</span>
              </div>
              <h2 className="text-xl font-bold">Platform-Wide Governance & Audit Telemetry</h2>
              <p className="text-indigo-200 text-xs mt-0.5">
                Derived directly from PostgreSQL transactional outbox, assessment logs, and sanitized audit events
              </p>
            </div>
            <div className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto font-mono">
              Timestamp: {operationalAnalytics?.timestamp ? new Date(operationalAnalytics.timestamp).toLocaleTimeString() : 'Live'}
            </div>
          </div>

          {/* Intervention Needed Alerts */}
          {operationalAnalytics?.failed_operations_needing_intervention && operationalAnalytics.failed_operations_needing_intervention.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Platform Operations Requiring Intervention ({operationalAnalytics.failed_operations_needing_intervention.length})</span>
              </h3>
              {operationalAnalytics.failed_operations_needing_intervention.map((op: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold">{op.type}:</span> {op.details}
                  </div>
                  <span className="font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-1 rounded-lg shrink-0">
                    Action: {op.action_required}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Role Distribution Grid */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <span>Platform Users by Canonical Role</span>
              <span className="text-xs font-normal text-gray-500">
                (Total: {operationalAnalytics?.total_users ?? users.length})
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { role: 'student', label: 'Students', color: 'from-blue-600 to-indigo-600' },
                { role: 'college_admin', label: 'College Admins', color: 'from-emerald-600 to-teal-600' },
                { role: 'faculty', label: 'Faculty Mentors', color: 'from-teal-600 to-cyan-600' },
                { role: 'company_admin', label: 'Company Admins', color: 'from-purple-600 to-indigo-600' },
                { role: 'recruiter', label: 'Recruiters', color: 'from-amber-600 to-orange-600' },
                { role: 'super_admin', label: 'Super Admins', color: 'from-rose-600 to-red-600' }
              ].map((r) => {
                const count = operationalAnalytics?.users_by_role?.[r.role] ?? 0;
                return (
                  <div key={r.role} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{r.label}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessments & Evidence Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assessment Telemetry */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                <span>Standardized Assessments Telemetry</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                  <div className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300">Catalog Assessments</div>
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {operationalAnalytics?.assessments_summary?.total_assessments ?? 3}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40">
                  <div className="text-[10px] uppercase font-semibold text-blue-800 dark:text-blue-300">Total Attempts</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-0.5">
                    {operationalAnalytics?.assessments_summary?.total_attempts ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40">
                  <div className="text-[10px] uppercase font-semibold text-purple-800 dark:text-purple-300">Passed Benchmark</div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-0.5">
                    {operationalAnalytics?.assessments_summary?.passed_attempts ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                  <div className="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-300">Average Score</div>
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                    {operationalAnalytics?.assessments_summary?.avg_score_pct ?? 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Records Summary */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield size={16} className="text-indigo-500" />
                <span>Skill Evidence Integrity Summary</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400">Total Records</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {operationalAnalytics?.skill_evidence_summary?.total_evidence_records ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                  <div className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300">Verified Evidence</div>
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {operationalAnalytics?.skill_evidence_summary?.verified_evidence ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                  <div className="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-300">Pending Reviews</div>
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                    {operationalAnalytics?.skill_evidence_summary?.pending_reviews ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
                  <div className="text-[10px] uppercase font-semibold text-rose-800 dark:text-rose-300">Rejected Reviews</div>
                  <div className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-0.5">
                    {operationalAnalytics?.skill_evidence_summary?.rejected_reviews ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sanitized Recent Audit Events */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  <span>Sanitized Audit Events Log</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Authoritative security audit log records with sanitized metadata (no leaked passwords or tokens)
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                {operationalAnalytics?.recent_audit_events?.length ?? 0} Events
              </span>
            </div>

            {operationalAnalytics?.recent_audit_events && operationalAnalytics.recent_audit_events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-[10px] tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-3.5 py-2.5 font-semibold">Timestamp</th>
                      <th className="px-3.5 py-2.5 font-semibold">User ID</th>
                      <th className="px-3.5 py-2.5 font-semibold">Role</th>
                      <th className="px-3.5 py-2.5 font-semibold">Action</th>
                      <th className="px-3.5 py-2.5 font-semibold">Resource</th>
                      <th className="px-3.5 py-2.5 font-semibold">Sanitized Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {operationalAnalytics.recent_audit_events.map((evt: any) => (
                      <tr key={evt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 font-mono text-[11px]">
                        <td className="px-3.5 py-2 text-gray-400">
                          {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : 'Recent'}
                        </td>
                        <td className="px-3.5 py-2 text-gray-600 dark:text-gray-300">#{evt.user_id || 'System'}</td>
                        <td className="px-3.5 py-2">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px]">
                            {evt.user_role || 'anon'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 font-bold text-gray-900 dark:text-white">{evt.action}</td>
                        <td className="px-3.5 py-2 text-indigo-600 dark:text-indigo-400">{evt.resource_type || '-'}</td>
                        <td className="px-3.5 py-2 text-gray-500 max-w-xs truncate">
                          {evt.details ? JSON.stringify(evt.details) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-400 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
                No recent audit events in the system log.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <PilotProgramManager role="super_admin" />
          <RecommendationEffectivenessDashboard role="super_admin" />
        </div>
      )}
    </div>
  )
}
