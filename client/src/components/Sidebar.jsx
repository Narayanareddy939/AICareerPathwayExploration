import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BrainCircuit,
  LayoutDashboard,
  Sparkles,
  Users,
  FileText,
  MessageSquareCode,
  LogOut,
  UserCircle2,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predictor', icon: Sparkles, label: 'AI Career Match' },
  { to: '/alumni', icon: Users, label: 'Alumni Directory' },
  { to: '/resume', icon: FileText, label: 'Resume Scorer' },
  { to: '/advisor', icon: MessageSquareCode, label: 'AI Advisor' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      position: 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
          <BrainCircuit size={20} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>AI<span style={{ color: '#818cf8' }}>Carrier</span></span>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Career Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.7rem 0.9rem',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.18s ease',
            background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
            color: isActive ? '#818cf8' : 'var(--text-muted)',
            border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent'
          })}>
            {({ isActive }) => (
              <>
                <Icon size={18} color={isActive ? '#818cf8' : '#6b7280'} />
                <span>{label}</span>
                {isActive && <ChevronRight size={14} color="#818cf8" style={{ marginLeft: 'auto' }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
        {/* User Avatar & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.9rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCircle2 size={22} color="#fff" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'Student'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid transparent',
            color: '#6b7280',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
