// Frontend/src/components/common/DomainPagePreview.tsx
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Filter, Download, Plus, Clock } from 'lucide-react';
import { UserRole, ROLE_LABELS, getRoleDashboardPath } from '../../types/roles';

interface MetricItem {
  label: string;
  value: string;
  change?: string;
  status?: 'positive' | 'neutral' | 'attention';
}

interface TableColumn {
  key: string;
  header: string;
}

interface DomainPagePreviewProps {
  role: UserRole;
  title: string;
  category: string;
  description: string;
  metrics?: MetricItem[];
  columns?: TableColumn[];
  mockRows?: Record<string, any>[];
  primaryActionLabel?: string;
}

export default function DomainPagePreview({
  role,
  title,
  category,
  description,
  metrics = [
    { label: 'Registered Entities', value: '142', change: '+12% this month', status: 'positive' },
    { label: 'Active Pipeline Flow', value: '88%', change: 'Normal range', status: 'positive' },
    { label: 'Pending Review', value: '7', change: 'Action required', status: 'attention' },
    { label: 'Sync Status', value: 'Realtime', status: 'neutral' }
  ],
  columns = [
    { key: 'name', header: 'Entity Name / Subject' },
    { key: 'category', header: 'Track / Domain' },
    { key: 'status', header: 'Lifecycle Status' },
    { key: 'updated', header: 'Last Activity' }
  ],
  mockRows = [
    { id: '1', name: 'Advanced Machine Learning Track', category: 'Artificial Intelligence', status: 'Active Evaluation', updated: '2 hours ago' },
    { id: '2', name: 'Cloud Infrastructure & SRE', category: 'DevOps & Systems', status: 'Curriculum Matched', updated: 'Yesterday' },
    { id: '3', name: 'Full-Stack Distributed Systems', category: 'Software Engineering', status: 'Verification Pending', updated: '3 days ago' },
    { id: '4', name: 'Cybersecurity & Zero-Trust', category: 'Information Security', status: 'Drafting Objectives', updated: '1 week ago' }
  ],
  primaryActionLabel = 'Create New Record'
}: DomainPagePreviewProps) {
  const dashboardPath = getRoleDashboardPath(role);
  const roleName = ROLE_LABELS[role];

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/60 dark:border-gray-800/80">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Link to={dashboardPath} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
              <ArrowLeft size={13} />
              <span>{roleName} Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-200 font-medium">{category}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {title}
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
              <Sparkles size={11} />
              Phase 5 Capability Preview
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-3xl">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Download size={14} />
            Export Schema
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={14} />
            {primaryActionLabel}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/60 shadow-sm"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{metric.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metric.value}</div>
            {metric.change && (
              <div
                className={`text-xs mt-1 font-medium ${
                  metric.status === 'positive'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : metric.status === 'attention'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {metric.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800/70 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-200/60 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Sample Domain Records</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({mockRows.length} displayed)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter size={13} />
              Filter Records
            </button>
            <div className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2">
              <Clock size={13} />
              Simulated Data
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-900/40 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-800/80">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-5 py-3 font-semibold">
                    {col.header}
                  </th>
                ))}
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {mockRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-gray-800 dark:text-gray-200">
                      {col.key === 'status' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {row[col.key]}
                        </span>
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notice Footer */}
        <div className="p-4 bg-gray-50/60 dark:bg-gray-900/30 border-t border-gray-200/60 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div>
            Data displayed here is grounded in the Phase 4 domain architecture specifications. Dedicated REST & WebSocket controllers for this module roll out in Phase 5.
          </div>
          <Link
            to={dashboardPath}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Return to {roleName} Dashboard</span>
            <ArrowLeft className="rotate-180" size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
