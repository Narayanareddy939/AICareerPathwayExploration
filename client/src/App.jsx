import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
const ChatbotAI = lazy(() => import('./components/ChatbotAI'));

// Auth Pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));

// Student Core Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CareerRecommendation = lazy(() => import('./pages/CareerRecommendation'));
const SkillGap = lazy(() => import('./pages/SkillGap'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Analytics = lazy(() => import('./pages/Analytics'));
const CompaniesCareers = lazy(() => import('./pages/CompaniesCareers'));
const MyApplications = lazy(() => import('./pages/MyApplications'));
const HigherStudies = lazy(() => import('./pages/HigherStudies'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const AlumniDetails = lazy(() => import('./pages/AlumniDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Company / Recruiter Pages
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'));
const CompanyProfile = lazy(() => import('./pages/company/CompanyProfile'));
const CompanyJobs = lazy(() => import('./pages/company/CompanyJobs'));
const PostJobPage = lazy(() => import('./pages/company/PostJobPage'));
const CompanyApplicants = lazy(() => import('./pages/company/CompanyApplicants'));
const CompanySettings = lazy(() => import('./pages/company/CompanySettings'));
const RecruiterLayout = lazy(() => import('./pages/company/RecruiterLayout'));

// Legacy Components (preserved)
const CareerPredictor = lazy(() => import('./components/CareerPredictor'));
const AlumniNetwork = lazy(() => import('./components/AlumniNetwork'));
const ResumeAnalyzer = lazy(() => import('./components/ResumeAnalyzer'));
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'));

// ─────────────────────────────────────────────
//  Protected Route Guard with RBAC
// ─────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false, recruiterOnly = false, studentOnly = false }) {
  const { user, loading, isRecruiter, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-ring" />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={isRecruiter ? '/company/dashboard' : '/dashboard'} replace />;
  }

  if (recruiterOnly && !isRecruiter && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (studentOnly && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (studentOnly && isRecruiter && !isAdmin) {
    return <Navigate to="/company/dashboard" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
//  App Layout: Sidebar + Content
// ─────────────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        maxWidth: 'calc(100vw - 260px)',
        minHeight: '100vh',
      }}>
        {children}
      </main>
      <ChatbotAI />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Public Route — redirect if already logged in
// ─────────────────────────────────────────────
function PublicRoute({ children }) {
  const { user, loading, isRecruiter, isAdmin } = useAuth();
  if (loading) return null;
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isRecruiter) return <Navigate to="/company/dashboard" replace />;
    return <Navigate to={user.profileCompleted ? '/dashboard' : '/complete-profile'} replace />;
  }
  return children;
}

// Helper to wrap with AppLayout + ProtectedRoute
const Protected = ({ children, adminOnly = false, recruiterOnly = false, studentOnly = false }) => (
  <ProtectedRoute adminOnly={adminOnly} recruiterOnly={recruiterOnly} studentOnly={studentOnly}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const RecruiterProtected = ({ children }) => (
  <ProtectedRoute recruiterOnly>
    <RecruiterLayout>{children}</RecruiterLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Suspense fallback={(
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
        Loading workspace...
      </div>
    )}>
    <Routes>
      {/* Public routes */}
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Profile completion — auth required */}
      <Route path="/complete-profile" element={
        <ProtectedRoute studentOnly>
          <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <CompleteProfile />
          </div>
        </ProtectedRoute>
      } />

      {/* ── Student Core App Routes ── */}
      <Route path="/dashboard"             element={<Protected studentOnly><DashboardPage /></Protected>} />
      <Route path="/career-recommendation" element={<Protected studentOnly><CareerRecommendation /></Protected>} />
      <Route path="/skill-gap"             element={<Protected studentOnly><SkillGap /></Protected>} />
      <Route path="/roadmap"               element={<Protected studentOnly><Roadmap /></Protected>} />
      <Route path="/analytics"             element={<Protected><Analytics /></Protected>} />
      <Route path="/companies-careers"     element={<Protected><CompaniesCareers /></Protected>} />
      <Route path="/jobs"                  element={<Protected><CompaniesCareers /></Protected>} />
      <Route path="/my-applications"       element={<Protected><MyApplications /></Protected>} />
      <Route path="/higher-studies"        element={<Protected studentOnly><HigherStudies /></Protected>} />
      <Route path="/progress"              element={<Protected studentOnly><Progress /></Protected>} />
      <Route path="/profile"               element={<Protected><Profile /></Protected>} />

      {/* ── Recruiter / Company Portal Routes ── */}
      <Route path="/company/dashboard"     element={<RecruiterProtected><CompanyDashboard /></RecruiterProtected>} />
      <Route path="/company/profile"       element={<RecruiterProtected><CompanyProfile /></RecruiterProtected>} />
      <Route path="/company/jobs"          element={<RecruiterProtected><CompanyJobs /></RecruiterProtected>} />
      <Route path="/company/jobs/new"      element={<RecruiterProtected><PostJobPage /></RecruiterProtected>} />
      <Route path="/company/jobs/:id/edit" element={<RecruiterProtected><PostJobPage /></RecruiterProtected>} />
      <Route path="/company/applicants"    element={<RecruiterProtected><CompanyApplicants /></RecruiterProtected>} />
      <Route path="/company/settings"      element={<RecruiterProtected><CompanySettings /></RecruiterProtected>} />

      {/* ── Admin Route ── */}
      <Route path="/admin"                 element={<ProtectedRoute adminOnly><AdminConsole /></ProtectedRoute>} />
      <Route path="/admin/legacy"          element={<Protected adminOnly><AdminDashboard /></Protected>} />

      {/* ── Alumni Routes ── */}
      <Route path="/alumni"                element={<Protected><AlumniNetwork /></Protected>} />
      <Route path="/alumni/:id"            element={<Protected><AlumniDetails /></Protected>} />

      {/* ── Legacy Routes (preserved) ── */}
      <Route path="/predictor"             element={<Protected studentOnly><CareerPredictor /></Protected>} />
      <Route path="/resume"                element={<Protected studentOnly><ResumeAnalyzer /></Protected>} />
      <Route path="/advisor"               element={<Protected studentOnly><ChatbotWidget /></Protected>} />

      {/* ── Default redirects ── */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Protected><NotFound /></Protected>} />
    </Routes>
    </Suspense>
  );
}
