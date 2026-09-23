import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatbotAI from './components/ChatbotAI';

// Auth Pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CompleteProfile from './pages/CompleteProfile';

// Core Pages
import DashboardPage from './pages/DashboardPage';
import CareerRecommendation from './pages/CareerRecommendation';
import SkillGap from './pages/SkillGap';
import Roadmap from './pages/Roadmap';
import Analytics from './pages/Analytics';
import Jobs from './pages/Jobs';
import HigherStudies from './pages/HigherStudies';
import ScenarioExplorer from './pages/ScenarioExplorer';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import AlumniDetails from './pages/AlumniDetails';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Legacy Components (preserved)
import CareerPredictor from './components/CareerPredictor';
import AlumniNetwork from './components/AlumniNetwork';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import ChatbotWidget from './components/ChatbotWidget';

// ─────────────────────────────────────────────
//  Protected Route Guard
// ─────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
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

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
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
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.profileCompleted ? '/dashboard' : '/complete-profile'} replace />;
  return children;
}

// Helper to wrap with AppLayout + ProtectedRoute
const Protected = ({ children, adminOnly = false }) => (
  <ProtectedRoute adminOnly={adminOnly}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Profile completion — auth required */}
      <Route path="/complete-profile" element={
        <ProtectedRoute>
          <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <CompleteProfile />
          </div>
        </ProtectedRoute>
      } />

      {/* ── Core App Routes ── */}
      <Route path="/dashboard"           element={<Protected><DashboardPage /></Protected>} />
      <Route path="/career-recommendation" element={<Protected><CareerRecommendation /></Protected>} />
      <Route path="/skill-gap"           element={<Protected><SkillGap /></Protected>} />
      <Route path="/roadmap"             element={<Protected><Roadmap /></Protected>} />
      <Route path="/analytics"           element={<Protected><Analytics /></Protected>} />
      <Route path="/jobs"                element={<Protected><Jobs /></Protected>} />
      <Route path="/higher-studies"      element={<Protected><HigherStudies /></Protected>} />
      <Route path="/scenarios"           element={<Protected><ScenarioExplorer /></Protected>} />
      <Route path="/progress"            element={<Protected><Progress /></Protected>} />
      <Route path="/profile"             element={<Protected><Profile /></Protected>} />
      <Route path="/admin"               element={<Protected adminOnly><AdminDashboard /></Protected>} />

      {/* ── Alumni Routes ── */}
      <Route path="/alumni"              element={<Protected><AlumniNetwork /></Protected>} />
      <Route path="/alumni/:id"          element={<Protected><AlumniDetails /></Protected>} />

      {/* ── Legacy Routes (preserved) ── */}
      <Route path="/predictor"           element={<Protected><CareerPredictor /></Protected>} />
      <Route path="/resume"              element={<Protected><ResumeAnalyzer /></Protected>} />
      <Route path="/advisor"             element={<Protected><ChatbotWidget /></Protected>} />

      {/* ── Default redirects ── */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Protected><NotFound /></Protected>} />
    </Routes>
  );
}
