import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Target, 
  AlertCircle, 
  Database, 
  Search,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function Analytics() {
  const { isDemoMode } = useAuth();
  const [loading, setLoading] = useState<boolean>(!isDemoMode);
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    async function fetchWorkforceData() {
      try {
        setLoading(true);
        const res = await api.get('/analytics/workforce');
        if (res && res.success) {
          setData(res);
        }
      } catch (err) {
        console.warn('Failed to load workforce demand analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkforceData();
  }, [isDemoMode]);

  // Demo Fallback
  const demoSkills = [
    { skill_id: 1, name: 'React', category: 'Frontend', distinct_open_jobs_requiring: 14, percentage_of_open_jobs: 77.8, candidate_supply: { assessed_evidence_count: 24, faculty_reviewed_evidence_count: 18, demonstrated_evidence_total: 28 }, demand_vs_supply_ratio: 0.50 },
    { skill_id: 2, name: 'PostgreSQL', category: 'Database', distinct_open_jobs_requiring: 12, percentage_of_open_jobs: 66.7, candidate_supply: { assessed_evidence_count: 19, faculty_reviewed_evidence_count: 15, demonstrated_evidence_total: 22 }, demand_vs_supply_ratio: 0.55 },
    { skill_id: 3, name: 'Python', category: 'Backend', distinct_open_jobs_requiring: 11, percentage_of_open_jobs: 61.1, candidate_supply: { assessed_evidence_count: 16, faculty_reviewed_evidence_count: 12, demonstrated_evidence_total: 18 }, demand_vs_supply_ratio: 0.61 },
    { skill_id: 4, name: 'Docker', category: 'DevOps', distinct_open_jobs_requiring: 8, percentage_of_open_jobs: 44.4, candidate_supply: { assessed_evidence_count: 10, faculty_reviewed_evidence_count: 8, demonstrated_evidence_total: 12 }, demand_vs_supply_ratio: 0.67 }
  ];

  const demoUnresolved = [
    { raw_name: 'FastAPI', distinct_open_jobs_requiring: 4 },
    { raw_name: 'Kubernetes', distinct_open_jobs_requiring: 3 }
  ];

  const skillIntelligence = isDemoMode
    ? demoSkills
    : (data?.skill_intelligence || []);

  const unresolvedRequirements = isDemoMode
    ? demoUnresolved
    : (data?.unresolved_requirements || []);

  const totalOpenJobs = isDemoMode
    ? 18
    : (data?.population_scope?.total_open_jobs_analyzed ?? 0);

  const totalCandidates = isDemoMode
    ? 156
    : (data?.population_scope?.total_candidates_pool ?? 0);

  const skillsInDemand = skillIntelligence.filter((s: any) => s.distinct_open_jobs_requiring > 0);

  // Filter skills
  const filteredSkills = skillIntelligence.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(skillIntelligence.map((s: any) => s.category).filter(Boolean)))];

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Workforce Skill Demand & Supply
            </h1>
            {isDemoMode ? (
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full">
                Demo Sandbox Data
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full flex items-center space-x-1">
                <Database size={12} className="mr-1" />
                Live PostgreSQL Telemetry
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Evidence-backed skill demand from active requisitions compared against verified candidate competencies.
          </p>
        </div>
      </div>

      {/* Disclaimers & Methodology Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 flex items-start space-x-3 text-sm text-blue-900 dark:text-blue-200">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Explainable Telemetry Scope:</span>{' '}
          {data?.disclaimer || 'Workforce demand and supply intelligence compares recorded open requisitions on SkillVerse with observable evidence in the candidate database. This metric is an internal telemetry sample and does not constitute national labour market forecasts or hiring predictions.'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
              <Briefcase className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requisitions</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? '...' : totalOpenJobs}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Open Requisitions Analyzed</div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidate Pool</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? '...' : totalCandidates}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Available Candidates</div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
              <Target className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Canonical Skills</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? '...' : skillsInDemand.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Competencies Under Demand</div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white">
              <AlertCircle className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unresolved</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? '...' : unresolvedRequirements.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Non-Taxonomy Requirements</div>
        </div>
      </div>

      {/* Main Intelligence Table */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Canonical Skill Demand vs Observable Supply
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Distinct open jobs requesting each competency versus candidates with passing assessments or verified faculty reviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              {categories.map((cat: any) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-6">Skill Competency</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Open Jobs Requiring</th>
                <th className="py-3 px-6">% of Open Requisitions</th>
                <th className="py-3 px-6">Assessed Candidates</th>
                <th className="py-3 px-6">Faculty Verified</th>
                <th className="py-3 px-6">Demand / Supply Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading workforce demand telemetry...
                  </td>
                </tr>
              ) : filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No matching canonical skill requirements recorded in active requisitions.
                  </td>
                </tr>
              ) : (
                filteredSkills.map((item: any) => (
                  <tr key={item.skill_id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                      {item.distinct_open_jobs_requiring}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(item.percentage_of_open_jobs, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs">{item.percentage_of_open_jobs}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {item.candidate_supply?.assessed_evidence_count ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {item.candidate_supply?.faculty_reviewed_evidence_count ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {item.candidate_supply?.demonstrated_evidence_total === 0 && item.distinct_open_jobs_requiring > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          Unmet (0 Verified Candidates)
                        </span>
                      ) : item.demand_vs_supply_ratio !== null && item.demand_vs_supply_ratio > 1.0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {item.demand_vs_supply_ratio}x (Talent Deficit)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {item.demand_vs_supply_ratio !== null ? `${item.demand_vs_supply_ratio}x` : '0x'} (Adequate Supply)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unresolved Non-Taxonomy Requirements Section */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>Unresolved Requisition Requirements</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Skills extracted from active requisitions that could not be mapped to the canonical taxonomy.
            </p>
          </div>
          <span className="text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full font-medium">
            Requires Taxonomy Curation
          </span>
        </div>

        {unresolvedRequirements.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic py-4">
            Zero unresolved requirements. All open job skills successfully resolved to canonical taxonomy.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {unresolvedRequirements.map((unres: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {unres.raw_name}
                </span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-mono">
                  {unres.distinct_open_jobs_requiring} job{unres.distinct_open_jobs_requiring > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
