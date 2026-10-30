// Frontend/src/pages/college/CollegeFaculty.tsx
import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  GraduationCap, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const mockDemoFaculty = [
  { id: 201, name: 'Prof. David Vance', email: 'd.vance@apex.edu', mentee_count: 14, department: 'Computer Science' },
  { id: 202, name: 'Prof. Sarah Jenkins', email: 's.jenkins@apex.edu', mentee_count: 12, department: 'Artificial Intelligence' },
  { id: 203, name: 'Dr. Michael Chang', email: 'm.chang@apex.edu', mentee_count: 10, department: 'Information Systems' }
];

export default function CollegeFaculty() {
  const { isDemoMode } = useAuth();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setFaculty(mockDemoFaculty);
      return;
    }

    async function loadFaculty() {
      try {
        setLoading(true);
        const res = await api.get('/institutions/faculty');
        if (res && res.success && Array.isArray(res.faculty)) {
          setFaculty(res.faculty);
        } else {
          setFaculty([]);
        }
      } catch (err) {
        console.warn('Failed to load institution faculty:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFaculty();
  }, [isDemoMode]);

  const filteredFaculty = faculty.filter(f =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <Users size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Faculty & Advisor Directory
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Institutional academic mentors and their current active student mentee workloads.
          </p>
        </div>
        <Link
          to="/college/students"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all self-start md:self-auto"
        >
          <GraduationCap size={14} />
          <span>Assign Mentees</span>
        </Link>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing simulated faculty advisor records. Live faculty members are retrieved from PostgreSQL institution memberships.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search faculty advisors by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((f) => (
          <div
            key={f.id}
            className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-base">
                  {f.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {f.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail size={12} />
                    <span>{f.email}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Active Student Mentees
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  {f.mentee_count ?? 0} Mentees
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Advisor ID #{f.id}
              </span>
              <Link
                to="/college/students"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Manage Assignments</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredFaculty.length === 0 && !loading && (
        <div className="text-center py-12 text-sm text-gray-500">
          No faculty advisors found in this institution.
        </div>
      )}
    </div>
  );
}
