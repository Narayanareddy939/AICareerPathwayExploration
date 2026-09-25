import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BrainCircuit, LayoutDashboard, Sparkles, Users, FileText,
  MessageSquareCode, LogOut, UserCircle2, ChevronRight,
  Target, BookOpen, BarChart2, Briefcase, GraduationCap,
  TrendingUp, UserCog, Shield, ChevronDown, ChevronUp,
  Map
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
      { to: '/alumni',                 icon: Users,            label: 'Alumni Directory' },
      { to: '/jobs',                   icon: Briefcase,        label: 'Job Market' },
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
      background: 'rgba(8, 12, 22, 0.97)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.85rem',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem', padding: '0 0.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 0 20px rgba(99,102,241,0.3)', flexShrink: 0 }}>
          <BrainCircuit size={20} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>AI<span style={{ color: '#818cf8' }}>Carrier</span></span>
          <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Career Intelligence Platform</p>
        </div>
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
                  background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: isActive ? '#818cf8' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  marginBottom: '0.1rem',
                })}>
                  {({ isActive }) => (
                    <>
                      <Icon size={16} color={isActive ? '#818cf8' : '#4b5563'} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                      {isActive && <ChevronRight size={12} color="#818cf8" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
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
            background: isActive ? 'rgba(217,70,239,0.18)' : 'rgba(217,70,239,0.05)',
            color: isActive ? '#e879f9' : '#9333ea',
            border: isActive ? '1px solid rgba(217,70,239,0.25)' : '1px solid rgba(217,70,239,0.15)',
          })}>
            <Shield size={16} /> Admin Panel
          </NavLink>
        )}
      </nav>

      {/* User Section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.75rem' }}>
        <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.85rem', borderRadius: '9px', textDecoration: 'none', marginBottom: '0.35rem', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0 }}>
            {(user?.fullName || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'Student'}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
        </NavLink>

        <button onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.55rem 0.85rem', borderRadius: '9px',
            background: 'transparent', border: '1px solid transparent',
            color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
