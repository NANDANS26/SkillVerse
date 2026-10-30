// Frontend/src/router.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ExtensionImport from './pages/ExtensionImport';

// Layout and Protection
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import DomainPagePreview from './components/common/DomainPagePreview';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CreateJob from './pages/recruiter/CreateJob';
import JobListings from './pages/recruiter/JobListings';
import Candidates from './pages/recruiter/Candidates';
import RecruiterCandidateProfile from './pages/recruiter/CandidateProfile';
import Matches from './pages/recruiter/Matches';
import Analytics from './pages/recruiter/Analytics';
import Interviews from './pages/recruiter/Interviews';
import Settings from './pages/recruiter/Settings';
import JobDetails from './pages/recruiter/JobDetails';
import CandidateMatches from './pages/recruiter/CandidateMatches';

// Student Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateJobs from './pages/candidate/CandidateJobs';
import CandidateApplications from './pages/candidate/CandidateApplications';
import CandidateLearning from './pages/candidate/CandidateLearning';
import CandidateAchievements from './pages/candidate/CandidateAchievements';
import CandidateSettings from './pages/candidate/CandidateSettings';
import CandidateSkillDNA from './pages/candidate/CandidateSkillDNA';
import CandidateAssessments from './pages/candidate/CandidateAssessments';
import ProfileBuilder from './pages/ProfileBuilder';

// Role Dashboards and Management Views
import CollegeAdminDashboard from './pages/college/CollegeAdminDashboard';
import CollegeStudents from './pages/college/CollegeStudents';
import CollegeFaculty from './pages/college/CollegeFaculty';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyStudents from './pages/faculty/FacultyStudents';
import CompanyAdminDashboard from './pages/company/CompanyAdminDashboard';
import CompanyRecruiters from './pages/company/CompanyRecruiters';
import CompanyJobs from './pages/company/CompanyJobs';
import Admin from './pages/Admin';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/extension/import" element={<ExtensionImport />} />

      {/* ======================================================== */}
      {/* 1. STUDENT ROUTES (allowedRoles: ['student'])            */}
      {/* ======================================================== */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <ProfileBuilder />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/skill-dna"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateSkillDNA />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateAssessments />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/learning"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateLearning />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <DomainPagePreview
                role="student"
                title="Projects & Portfolio Proof"
                category="Projects & Portfolio"
                description="Verified Git repositories, commit velocity, and test suite execution logs establishing objective proof of engineering capability."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/jobs"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateJobs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/activity"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <DomainPagePreview
                role="student"
                title="Activity & Focus Telemetry"
                category="Activity & Focus"
                description="Productivity telemetry streamed from the SkillVerse Chrome Extension, LeetCode problem time, and local IDE sessions."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/achievements"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateAchievements />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/settings"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateSettings />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/applications"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppShell>
              <CandidateApplications />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Backward-compatible Candidate redirects */}
      <Route path="/candidate/dashboard" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/candidate/profile" element={<Navigate to="/student/profile" replace />} />
      <Route path="/candidate/jobs" element={<Navigate to="/student/jobs" replace />} />
      <Route path="/candidate/applications" element={<Navigate to="/student/applications" replace />} />
      <Route path="/candidate/learning" element={<Navigate to="/student/learning" replace />} />
      <Route path="/candidate/achievements" element={<Navigate to="/student/achievements" replace />} />
      <Route path="/candidate/settings" element={<Navigate to="/student/settings" replace />} />

      {/* ======================================================== */}
      {/* 2. COLLEGE ADMIN ROUTES (allowedRoles: ['college_admin'])*/}
      {/* ======================================================== */}
      <Route
        path="/college/dashboard"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <CollegeAdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/students"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <CollegeStudents />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/faculty"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <CollegeFaculty />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/cohorts"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <DomainPagePreview
                role="college_admin"
                title="Departments & Cohort Clusters"
                category="Cohorts"
                description="Curriculum tracking, cohort graduation benchmarks, and departmental skill gaps."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/assignments"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <DomainPagePreview
                role="college_admin"
                title="Faculty Mentorship Assignments"
                category="Faculty Assignments"
                description="Configure student-to-advisor allocations and placement intervention guidelines."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/analytics"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <DomainPagePreview
                role="college_admin"
                title="Institutional Placement Analytics"
                category="Institutional Analytics"
                description="Placement velocity, enterprise employer demand alignment, and historical hiring trends."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/reports"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <DomainPagePreview
                role="college_admin"
                title="Accreditation & Placement Reports"
                category="Accreditation Reports"
                description="Generate NAAC, ABET, and institutional compliance reports detailing verified graduate outcomes."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/settings"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AppShell>
              <DomainPagePreview
                role="college_admin"
                title="Campus Portal Settings"
                category="Settings"
                description="Manage institution domain whitelists, branding preferences, and campus drive policies."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* ======================================================== */}
      {/* 3. FACULTY ROUTES (allowedRoles: ['faculty'])            */}
      {/* ======================================================== */}
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <FacultyDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/students"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <FacultyStudents />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/classes"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Classes & Course Cohorts"
                category="Classes & Cohorts"
                description="Manage active course sections, syllabi, and skill benchmark milestones."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/assessments"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Course Skill Benchmarks"
                category="Skill Benchmarks"
                description="Author and assign standardized programming assignments and test-suite benchmarks for enrolled classes."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/submissions"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Lab & Project Submissions"
                category="Submissions"
                description="Review automated unit test reports and commit histories for student code submissions."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/mentoring"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Mentoring Intervention Alerts"
                category="Mentoring Alerts"
                description="Identify students falling below placement readiness thresholds and schedule targeted 1-on-1 coaching."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/skills"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Longitudinal Skill Progress"
                category="Skill Progress"
                description="Evaluate student mastery curves and skill progression over the academic semester."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/reports"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Cohort Performance Reports"
                category="Cohort Reports"
                description="Export class grading summaries and skill proficiency distributions for departmental review."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/settings"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <AppShell>
              <DomainPagePreview
                role="faculty"
                title="Faculty Profile & Preferences"
                category="Settings"
                description="Configure office hours, mentoring availability, and grading notification thresholds."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* ======================================================== */}
      {/* 4. COMPANY ADMIN ROUTES (allowedRoles: ['company_admin'])*/}
      {/* ======================================================== */}
      <Route
        path="/company/dashboard"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <CompanyAdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/recruiters"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <CompanyRecruiters />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/jobs"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <CompanyJobs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/teams"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <DomainPagePreview
                role="company_admin"
                title="Hiring Teams & Divisions"
                category="Hiring Teams"
                description="Configure engineering clusters, hiring managers, and interview panel member associations."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/skills"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <DomainPagePreview
                role="company_admin"
                title="Workforce Skills Intelligence"
                category="Workforce Skills"
                description="Analyze internal employee technical competencies against market availability and hiring targets."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/analytics"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <DomainPagePreview
                role="company_admin"
                title="Executive Talent Acquisition Analytics"
                category="Talent Analytics"
                description="Track offer conversion rates, sourcing channel efficacy, and time-to-hire velocity."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/reports"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <DomainPagePreview
                role="company_admin"
                title="Enterprise Hiring Reports"
                category="Hiring Reports"
                description="Export compliance, EEO/DEI analytics, and quarterly recruiting performance summaries."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/settings"
        element={
          <ProtectedRoute allowedRoles={['company_admin']}>
            <AppShell>
              <DomainPagePreview
                role="company_admin"
                title="Enterprise Account Settings"
                category="Settings"
                description="Configure corporate billing, single sign-on federation, and ATS webhook connectors."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* ======================================================== */}
      {/* 5. RECRUITER ROUTES (allowedRoles: ['recruiter'])        */}
      {/* ======================================================== */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <RecruiterDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/create-job"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <CreateJob />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/jobs"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <JobListings />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/candidates"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <Candidates />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/candidate/:id"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <RecruiterCandidateProfile />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/matches"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <Matches />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/analytics"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <Analytics />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/interviews"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <Interviews />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/settings"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <Settings />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/job/:id"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <JobDetails />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/job/:id/matches"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <AppShell>
              <CandidateMatches />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* ======================================================== */}
      {/* 6. SUPER ADMIN ROUTES (allowedRoles: ['super_admin'])    */}
      {/* ======================================================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <Admin />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Global User Directory"
                category="User Directory"
                description="Multi-tenant user roster with role assignments, MFA enforcement, and account lifecycle status."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Registered Institutions"
                category="Institutions"
                description="University tenants, campus domain registries, and academic license tiers."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Enterprise Corporate Tenants"
                category="Companies"
                description="Corporate accounts, team seat allocations, and API usage quotas."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/access"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Role-Based Access Control"
                category="Role & Access Control"
                description="Permission matrices, custom policy definitions, and administrative delegation rules."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/plugins"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Plugin Ecosystem Governance"
                category="Plugin Governance"
                description="Registered extensions, sandboxed Chrome telemetry connectors, and third-party API keys."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Immutable System Audit Logs"
                category="Audit Logs"
                description="Cryptographically chained audit trails of administrative actions and authentication events."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/health"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="Platform Health & Microservice Telemetry"
                category="Platform Health"
                description="Live heartbeat metrics, FAISS vector index query latency, and database connection pool monitors."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppShell>
              <DomainPagePreview
                role="super_admin"
                title="System Settings & Feature Flags"
                category="System Settings"
                description="Global platform environment parameters, maintenance modes, and model checkpoint configurations."
              />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
