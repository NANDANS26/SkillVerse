// Frontend/src/pages/college/CollegeStudents.tsx
import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const mockDemoStudents = [
  {
    user_id: 101,
    name: 'Maya Lin',
    email: 'maya.lin@apex.edu',
    headline: 'Distributed Systems & Go Engineer',
    skills: ['Go', 'Kubernetes', 'Docker', 'Raft Consensus'],
    assigned_faculty_name: 'Prof. David Vance',
    assigned_faculty_id: 201
  },
  {
    user_id: 102,
    name: 'Alex Chen',
    email: 'alex.chen@apex.edu',
    headline: 'Machine Learning & NLP Specialist',
    skills: ['Python', 'PyTorch', 'FAISS', 'FastAPI'],
    assigned_faculty_name: 'Prof. Sarah Jenkins',
    assigned_faculty_id: 202
  },
  {
    user_id: 103,
    name: 'Rohan Sharma',
    email: 'rohan.sharma@apex.edu',
    headline: 'Cybersecurity & Cryptography Researcher',
    skills: ['C++', 'Rust', 'Post-Quantum Algorithms'],
    assigned_faculty_name: null,
    assigned_faculty_id: null
  }
];

export default function CollegeStudents() {
  const { isDemoMode } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  const loadData = async () => {
    if (isDemoMode) {
      setStudents(mockDemoStudents);
      setFaculty([
        { id: 201, name: 'Prof. David Vance', email: 'd.vance@apex.edu' },
        { id: 202, name: 'Prof. Sarah Jenkins', email: 's.jenkins@apex.edu' }
      ]);
      return;
    }

    try {
      setLoading(true);
      const [stuRes, facRes, assignRes] = await Promise.allSettled([
        api.get('/institutions/students'),
        api.get('/institutions/faculty'),
        api.get('/institutions/assignments')
      ]);

      if (stuRes.status === 'fulfilled' && Array.isArray(stuRes.value?.students)) {
        setStudents(stuRes.value.students);
      }
      if (facRes.status === 'fulfilled' && Array.isArray(facRes.value?.faculty)) {
        setFaculty(facRes.value.faculty);
      }
      if (assignRes.status === 'fulfilled' && Array.isArray(assignRes.value?.assignments)) {
        setAssignments(assignRes.value.assignments);
      }
    } catch (err) {
      console.warn('Failed to load institution directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleAssign = async (studentUserId: number) => {
    const facId = selectedFacultyId[studentUserId];
    if (!facId) {
      setFeedback({ type: 'error', text: 'Please select an authorized faculty advisor' });
      return;
    }

    if (isDemoMode) {
      setFeedback({ type: 'success', text: '(Demo Exploration) Mentorship assigned in browser session.' });
      return;
    }

    try {
      const res = await api.post('/institutions/assign-faculty', {
        faculty_id: facId,
        student_id: studentUserId,
        notes: 'Academic & Placement Advising'
      });

      if (res && res.success) {
        setFeedback({ type: 'success', text: 'Faculty mentor assigned successfully!' });
        await loadData();
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Failed to assign faculty' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error assigning faculty' });
    }
  };

  const handleUnassign = async (assignmentId: number) => {
    if (isDemoMode) {
      setFeedback({ type: 'success', text: '(Demo Exploration) Mentorship removed.' });
      return;
    }

    try {
      const res = await api.delete(`/institutions/assignments/${assignmentId}`);
      if (res && res.success) {
        setFeedback({ type: 'success', text: 'Mentorship assignment removed.' });
        await loadData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error removing assignment' });
    }
  };

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.headline || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
              <GraduationCap size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Enrolled Students Directory
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Authoritative student roster scoped to your institution with active mentorship assignment controls.
          </p>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>DEMONSTRATION PREVIEW:</strong> Showing simulated student cohort roster. Live data is retrieved from PostgreSQL institution memberships when authenticated.
          </span>
        </div>
      )}

      {feedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search enrolled students by name, email, or technical specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 uppercase text-[10px] tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Student Name & Email</th>
                <th className="px-5 py-3.5 font-semibold">Headline & Specialty</th>
                <th className="px-5 py-3.5 font-semibold">Verified Skills</th>
                <th className="px-5 py-3.5 font-semibold">Assigned Faculty Advisor</th>
                <th className="px-5 py-3.5 font-semibold text-right">Assign Mentorship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStudents.map((s) => {
                const existingAssignment = assignments.find(a => a.student_id === s.user_id);
                const assignedFacName = existingAssignment?.faculty_name || s.assigned_faculty_name;

                return (
                  <tr key={s.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{s.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{s.email}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {s.headline || 'Student Candidate'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {Array.isArray(s.skills) && s.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.skills.slice(0, 3).map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-800/60">
                              {sk}
                            </span>
                          ))}
                          {s.skills.length > 3 && (
                            <span className="text-[10px] text-gray-400 font-semibold self-center">
                              +{s.skills.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No skills listed</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {assignedFacName ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{assignedFacName}</span>
                          </span>
                          {existingAssignment && (
                            <button
                              onClick={() => handleUnassign(existingAssignment.id)}
                              title="Remove mentorship assignment"
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={selectedFacultyId[s.user_id] || ''}
                          onChange={(e) => setSelectedFacultyId(prev => ({ ...prev, [s.user_id]: Number(e.target.value) }))}
                          className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                        >
                          <option value="">Select Faculty Mentor...</option>
                          {faculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.mentee_count ?? 0} mentees)
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(s.user_id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12 text-sm text-gray-500">
            No students found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
