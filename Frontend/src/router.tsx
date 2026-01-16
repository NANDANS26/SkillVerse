import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard'
import CreateJob from './pages/recruiter/CreateJob'
import JobListings from './pages/recruiter/JobListings'
import Candidates from './pages/recruiter/Candidates'
import Matches from './pages/recruiter/Matches'
import Analytics from './pages/recruiter/Analytics'
import Interviews from './pages/recruiter/Interviews'
import Settings from './pages/recruiter/Settings'
import JobDetails from './pages/recruiter/JobDetails'
import CandidateMatches from './pages/recruiter/CandidateMatches'
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import CandidateJobs from './pages/candidate/CandidateJobs'
import CandidateApplications from './pages/candidate/CandidateApplications'
import CandidateLearning from './pages/candidate/CandidateLearning'
import CandidateAchievements from './pages/candidate/CandidateAchievements'
import CandidateSettings from './pages/candidate/CandidateSettings'
import ProfileBuilder from './pages/ProfileBuilder'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Recruiter Interface Routes */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/create-job"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <CreateJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/jobs"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <JobListings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/candidates"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <Candidates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/matches"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <Matches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/analytics"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/interviews"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <Interviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/settings"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/job/:id"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <JobDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/job/:id/matches"
        element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <CandidateMatches />
          </ProtectedRoute>
        }
      />
      {/* Candidate routes */}
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ProfileBuilder />
          </ProtectedRoute>
        }
      />
      <Route
  path="/candidate/profile"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <ProfileBuilder />
    </ProtectedRoute>
  }
/>
<Route
  path="/candidate/jobs"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <CandidateJobs />
    </ProtectedRoute>
  }
/>
<Route
  path="/candidate/applications"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <CandidateApplications />
    </ProtectedRoute>
  }
/>
<Route
  path="/candidate/learning"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <CandidateLearning />
    </ProtectedRoute>
  }
/>
<Route
  path="/candidate/achievements"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <CandidateAchievements />
    </ProtectedRoute>
  }
/>
<Route
  path="/candidate/settings"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <CandidateSettings />
    </ProtectedRoute>
  }
/>
      <Route
        path="/candidate/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ProfileBuilder />
          </ProtectedRoute>
        }
      />
      
      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}