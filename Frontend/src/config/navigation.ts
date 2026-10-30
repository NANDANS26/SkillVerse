// Frontend/src/config/navigation.ts
import { 
  LayoutDashboard, 
  Brain, 
  Award, 
  BookOpen, 
  Briefcase, 
  Activity, 
  Trophy, 
  Settings, 
  Users, 
  GraduationCap, 
  Building2, 
  UserCheck, 
  BarChart3, 
  FileSpreadsheet, 
  CheckSquare, 
  Network, 
  FolderGit2, 
  Cpu, 
  HeartPulse, 
  Puzzle, 
  ScrollText, 
  Calendar, 
  UserPlus,
  LucideIcon
} from 'lucide-react';
import { UserRole, normalizeRole } from '../types/roles';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
  category?: 'primary' | 'workspace' | 'governance' | 'system';
}

export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
  student: [
    {
      id: 'student-dashboard',
      label: 'Dashboard',
      path: '/student/dashboard',
      icon: LayoutDashboard,
      description: 'Overview of learning progression and matches'
    },
    {
      id: 'student-dna',
      label: 'Skill DNA',
      path: '/student/skill-dna',
      icon: Brain,
      badge: '94%',
      description: 'Multidimensional skill taxonomy and radar'
    },
    {
      id: 'student-assessments',
      label: 'Assessments',
      path: '/student/assessments',
      icon: CheckSquare,
      badge: '2 Due',
      description: 'Standardized skill benchmark tests'
    },
    {
      id: 'student-learning',
      label: 'Learning Path',
      path: '/student/learning',
      icon: BookOpen,
      description: 'Curated courses and milestone goals'
    },
    {
      id: 'student-projects',
      label: 'Projects & Portfolio',
      path: '/student/projects',
      icon: FolderGit2,
      description: 'Verified GitHub code and project proof'
    },
    {
      id: 'student-jobs',
      label: 'Opportunities',
      path: '/student/jobs',
      icon: Briefcase,
      badge: '12 New',
      description: 'AI-matched job requisitions and internships'
    },
    {
      id: 'student-activity',
      label: 'Activity & Focus',
      path: '/student/activity',
      icon: Activity,
      description: 'Telemetry from browser extension and IDE'
    },
    {
      id: 'student-achievements',
      label: 'Achievements',
      path: '/student/achievements',
      icon: Trophy,
      description: 'Skill badges and verified milestones'
    },
    {
      id: 'student-settings',
      label: 'Settings',
      path: '/student/settings',
      icon: Settings,
      description: 'Profile and privacy preferences'
    }
  ],

  college_admin: [
    {
      id: 'college-dashboard',
      label: 'Dashboard',
      path: '/college/dashboard',
      icon: LayoutDashboard,
      description: 'Institutional metrics, cohort health, and placement KPIs'
    },
    {
      id: 'college-students',
      label: 'Students Directory',
      path: '/college/students',
      icon: GraduationCap,
      description: 'Search, filter, and track enrolled students'
    },
    {
      id: 'college-faculty',
      label: 'Faculty Directory',
      path: '/college/faculty',
      icon: Users,
      description: 'Departmental mentors and professors'
    },
    {
      id: 'college-cohorts',
      label: 'Departments & Cohorts',
      path: '/college/cohorts',
      icon: Network,
      description: 'Curriculum tracks and graduating classes'
    },
    {
      id: 'college-assignments',
      label: 'Faculty Assignments',
      path: '/college/assignments',
      icon: UserCheck,
      description: 'Assign mentor ratios and cohort oversight'
    },
    {
      id: 'college-analytics',
      label: 'Institutional Analytics',
      path: '/college/analytics',
      icon: BarChart3,
      description: 'Skill demand heatmaps and hiring outcomes'
    },
    {
      id: 'college-reports',
      label: 'Accreditation Reports',
      path: '/college/reports',
      icon: FileSpreadsheet,
      description: 'Export compliance and placement outcomes'
    },
    {
      id: 'college-settings',
      label: 'Settings',
      path: '/college/settings',
      icon: Settings,
      description: 'Campus branding and access policies'
    }
  ],

  faculty: [
    {
      id: 'faculty-dashboard',
      label: 'Dashboard',
      path: '/faculty/dashboard',
      icon: LayoutDashboard,
      description: 'Mentee progress and assessment status'
    },
    {
      id: 'faculty-students',
      label: 'My Students',
      path: '/faculty/students',
      icon: GraduationCap,
      description: 'Directly assigned mentee roster'
    },
    {
      id: 'faculty-classes',
      label: 'Classes & Cohorts',
      path: '/faculty/classes',
      icon: Network,
      description: 'Class syllabus and cohort breakdown'
    },
    {
      id: 'faculty-assessments',
      label: 'Skill Benchmarks',
      path: '/faculty/assessments',
      icon: CheckSquare,
      description: 'Class-wide skill assessments'
    },
    {
      id: 'faculty-submissions',
      label: 'Submissions',
      path: '/faculty/submissions',
      icon: Award,
      badge: '18 New',
      description: 'Project code and lab reviews'
    },
    {
      id: 'faculty-mentoring',
      label: 'Mentoring Alerts',
      path: '/faculty/mentoring',
      icon: UserCheck,
      badge: '3 At-Risk',
      description: 'Students needing skill interventions'
    },
    {
      id: 'faculty-skills',
      label: 'Skill Progression',
      path: '/faculty/skills',
      icon: Brain,
      description: 'Longitudinal mastery curves across courses'
    },
    {
      id: 'faculty-reports',
      label: 'Cohort Reports',
      path: '/faculty/reports',
      icon: FileSpreadsheet,
      description: 'Academic skill benchmarks and exports'
    },
    {
      id: 'faculty-settings',
      label: 'Settings',
      path: '/faculty/settings',
      icon: Settings,
      description: 'Availability and office hours'
    }
  ],

  company_admin: [
    {
      id: 'company-dashboard',
      label: 'Dashboard',
      path: '/company/dashboard',
      icon: LayoutDashboard,
      description: 'Executive hiring pipeline and workforce skill radar'
    },
    {
      id: 'company-recruiters',
      label: 'Recruiters & HR',
      path: '/company/recruiters',
      icon: Users,
      description: 'Team members and assigned search quotas'
    },
    {
      id: 'company-jobs',
      label: 'Job Requisitions',
      path: '/company/jobs',
      icon: Briefcase,
      badge: '14 Active',
      description: 'Company-wide open positions'
    },
    {
      id: 'company-teams',
      label: 'Hiring Teams',
      path: '/company/teams',
      icon: Network,
      description: 'Engineering, product, and data team clusters'
    },
    {
      id: 'company-skills',
      label: 'Workforce Skills',
      path: '/company/skills',
      icon: Brain,
      description: 'Internal skill gaps vs external market availability'
    },
    {
      id: 'company-analytics',
      label: 'Talent Analytics',
      path: '/company/analytics',
      icon: BarChart3,
      description: 'Offer conversion and time-to-hire metrics'
    },
    {
      id: 'company-reports',
      label: 'Hiring Reports',
      path: '/company/reports',
      icon: FileSpreadsheet,
      description: 'Compliance, DEI, and sourcing reports'
    },
    {
      id: 'company-settings',
      label: 'Settings',
      path: '/company/settings',
      icon: Settings,
      description: 'ATS integration and enterprise billing'
    }
  ],

  recruiter: [
    {
      id: 'recruiter-dashboard',
      label: 'Dashboard',
      path: '/recruiter/dashboard',
      icon: LayoutDashboard,
      description: 'Active requisitions and top matching talent'
    },
    {
      id: 'recruiter-jobs',
      label: 'Job Listings',
      path: '/recruiter/jobs',
      icon: Briefcase,
      description: 'Manage active job postings'
    },
    {
      id: 'recruiter-create-job',
      label: 'Create Job',
      path: '/recruiter/create-job',
      icon: UserPlus,
      description: 'Post new JD with skill extraction'
    },
    {
      id: 'recruiter-candidates',
      label: 'Candidate Discovery',
      path: '/recruiter/candidates',
      icon: Users,
      description: 'Search talent pool with semantic filters'
    },
    {
      id: 'recruiter-matches',
      label: 'AI Matches',
      path: '/recruiter/matches',
      icon: Brain,
      badge: 'Faiss Ready',
      description: 'Vector-matched candidates with explainability'
    },
    {
      id: 'recruiter-interviews',
      label: 'Interviews',
      path: '/recruiter/interviews',
      icon: Calendar,
      description: 'Scheduled interviews and candidate feedback'
    },
    {
      id: 'recruiter-analytics',
      label: 'Hiring Pipeline',
      path: '/recruiter/analytics',
      icon: BarChart3,
      description: 'Stage conversion and pipeline velocity'
    },
    {
      id: 'recruiter-settings',
      label: 'Settings',
      path: '/recruiter/settings',
      icon: Settings,
      description: 'Notification preferences and templates'
    }
  ],

  super_admin: [
    {
      id: 'admin-dashboard',
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      description: 'Global system overview and tenant health'
    },
    {
      id: 'admin-users',
      label: 'User Directory',
      path: '/admin/users',
      icon: Users,
      description: 'Multi-tenant user and role management'
    },
    {
      id: 'admin-institutions',
      label: 'Institutions',
      path: '/admin/institutions',
      icon: GraduationCap,
      description: 'Registered colleges and universities'
    },
    {
      id: 'admin-companies',
      label: 'Companies',
      path: '/admin/companies',
      icon: Building2,
      description: 'Corporate tenants and enterprise accounts'
    },
    {
      id: 'admin-access',
      label: 'Role & Access Control',
      path: '/admin/access',
      icon: Cpu,
      description: 'RBAC policies and permission matrices'
    },
    {
      id: 'admin-plugins',
      label: 'Plugin Governance',
      path: '/admin/plugins',
      icon: Puzzle,
      description: 'Ecosystem extensions and API keys'
    },
    {
      id: 'admin-logs',
      label: 'Audit & Security Logs',
      path: '/admin/logs',
      icon: ScrollText,
      description: 'Immutable system audit trails'
    },
    {
      id: 'admin-health',
      label: 'Platform Health',
      path: '/admin/health',
      icon: HeartPulse,
      badge: '99.9%',
      description: 'Microservice uptime and latency telemetry'
    },
    {
      id: 'admin-settings',
      label: 'System Settings',
      path: '/admin/settings',
      icon: Settings,
      description: 'Global environment variables and maintenance'
    }
  ]
};

export function getNavigationForRole(role: UserRole | string | undefined | null): NavItem[] {
  if (!role) return [];
  const normalized = normalizeRole(role);
  return ROLE_NAVIGATION[normalized] || [];
}
