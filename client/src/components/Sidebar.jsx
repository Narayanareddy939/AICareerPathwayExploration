import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import {
  BrainCircuit, LayoutDashboard, Sparkles, Users, FileText,
  MessageSquareCode, LogOut, UserCircle2, ChevronRight,
  Target, BookOpen, BarChart2, Briefcase, GraduationCap,
  TrendingUp, UserCog, Shield, ChevronDown, ChevronUp,
  Map, Sun, Moon
} from 'lucide-react';

// Grouped nav sections
const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { to: '/dashboard',              icon: LayoutDashboard,  label: 'Dashboard' },
      { to: '/complete-profile',       icon: UserCog,          label: 'Complete Profile' },
      { to: '/profile',                icon: UserCircle2,      label: 'My Profile' },
    ],
  },
  {
    title: 'Career AI',
    items: [
      { to: '/career-recommendation',  icon: Sparkles,         label: 'Career Recommendations' },
      { to: '/predictor',              icon: Target,           label: 'AI Career Predictor' },
      { to: '/skill-gap',              icon: TrendingUp,       label: 'Skill Gap Analysis' },
      { to: '/roadmap',                icon: Map,              label: 'Learning Roadmap' },
    ],
  },
  {
    title: 'Explore',
    items: [
      { to: '/companies-careers',      icon: Briefcase,        label: 'Jobs & Companies' },
      { to: '/alumni',                 icon: Users,            label: 'Alumni Directory' },
      { to: '/analytics',              icon: BarChart2,        label: 'Analytics' },
      { to: '/higher-studies',         icon: GraduationCap,    label: 'Higher Studies' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { to: '/resume',                 icon: FileText,         label: 'Resume Analyzer' },
      { to: '/advisor',                icon: MessageSquareCode,label: 'AI Advisor' },
      { to: '/progress',               icon: BookOpen,         label: 'My Progress' },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleSection = (title) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.85rem',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      boxShadow: 'var(--shadow-card)',
      transition: 'background 0.25s ease, border-color 0.25s ease'
    }}>
      {/* Brand Logo & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(79,70,229,0.25)', flexShrink: 0 }}>
            <BrainCircuit size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>AI<span style={{ color: 'var(--primary)' }}>Carrier</span></span>
            <p style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 600 }}>Career Intelligence</p>
          </div>
        </div>

        {/* Theme Toggle Pill (Black & White mode) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'White' : 'Black'} mode`}
          style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '999px',
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-main)',
            fontSize: '0.72rem',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          {isDark ? (
            <>
              <Sun size={13} color="#fbbf24" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={13} color="#6366f1" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsed[section.title];

          return (
            <div key={section.title} style={{ marginBottom: '0.5rem' }}>
              {/* Section Header */}
              <button onClick={() => toggleSection(section.title)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '0.25rem 0.5rem', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.68rem',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem',
                }}>
                <span>{section.title}</span>
                {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>

              {/* Nav Items */}
              {!isCollapsed && section.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease',
                  background: isActive ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(79, 70, 229, 0.08)') : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  marginBottom: '0.1rem',
                  boxShadow: isActive ? '0 2px 6px rgba(79, 70, 229, 0.08)' : 'none'
                })}>
                  {({ isActive }) => (
                    <>
                      <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-dim)'} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                      {isActive && <ChevronRight size={12} color="var(--primary)" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}

        {/* Admin Link (only for admins) */}
        {user?.role === 'admin' && (
          <NavLink to="/admin" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.65rem',
            padding: '0.55rem 0.85rem', borderRadius: '9px', textDecoration: 'none',
            fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s ease',
            background: isActive ? 'rgba(217,70,239,0.18)' : 'rgba(217,70,239,0.06)',
            color: isActive ? '#d946ef' : '#a855f7',
            border: isActive ? '1px solid rgba(217,70,239,0.3)' : '1px solid rgba(217,70,239,0.15)',
          })}>
            <Shield size={16} /> Admin Panel
          </NavLink>
        )}
      </nav>

      {/* User Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.75rem' }}>
        <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.85rem', borderRadius: '9px', textDecoration: 'none', marginBottom: '0.35rem', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', flexShrink: 0, boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}>
            {(user?.fullName || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'Student'}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
        </NavLink>

        <button onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.55rem 0.85rem', borderRadius: '9px',
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
