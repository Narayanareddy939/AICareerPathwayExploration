import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatbotAI from './components/ChatbotAI';

// Auth Pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CompleteProfile from './pages/CompleteProfile';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';

// Legacy Components as pages
import Dashboard from './components/Dashboard';
import CareerPredictor from './components/CareerPredictor';
import AlumniNetwork from './components/AlumniNetwork';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import ChatbotWidget from './components/ChatbotWidget';

// ─────────────────────────────────────────────
//  Protected Route Guard
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
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

  return children;
}

// ─────────────────────────────────────────────
//  App Layout: Sidebar + Content
// ─────────────────────────────────────────────
function AppLayout({ children }) {
  const { user } = useAuth();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: 'calc(100vw - 260px)' }}>
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

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Profile completion — requires auth but not profile completion */}
      <Route path="/complete-profile" element={
        <ProtectedRoute>
          <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <CompleteProfile />
          </div>
        </ProtectedRoute>
      } />

      {/* Protected App Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><DashboardPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/predictor" element={
        <ProtectedRoute>
          <AppLayout><CareerPredictor /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/alumni" element={
        <ProtectedRoute>
          <AppLayout><AlumniNetwork /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/resume" element={
        <ProtectedRoute>
          <AppLayout><ResumeAnalyzer /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/advisor" element={
        <ProtectedRoute>
          <AppLayout><ChatbotWidget /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
