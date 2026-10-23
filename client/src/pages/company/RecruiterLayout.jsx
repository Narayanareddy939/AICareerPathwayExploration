import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowUpRight, BriefcaseBusiness, Building2, FileText,
  LayoutDashboard, LogOut, Settings, ShieldCheck, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './RecruiterLayout.css';

const NAV_ITEMS = [
  { to: '/company/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/company/jobs', label: 'Job openings', icon: BriefcaseBusiness, end: true },
  { to: '/company/jobs/new', label: 'Post a job', icon: FileText, end: true },
  { to: '/company/applicants', label: 'Applicants', icon: Users },
  { to: '/company/profile', label: 'Company profile', icon: Building2 },
  { to: '/company/settings', label: 'Settings', icon: Settings }
];

const PAGE_TITLES = {
  '/company/dashboard': 'Overview',
  '/company/jobs': 'Job openings',
  '/company/jobs/new': 'Post a job',
  '/company/applicants': 'Applicants',
  '/company/profile': 'Company profile',
  '/company/settings': 'Settings'
};

export default function RecruiterLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const company = user?.company || {};
  const companyName = company.name || 'Your company';
  const verificationStatus = company.verificationStatus || 'pending_review';
  const pageTitle = location.pathname.includes('/edit') ? 'Edit job' : PAGE_TITLES[location.pathname] || 'Recruiter workspace';

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="rc-shell">
      <aside className="rc-sidebar">
        <a className="rc-brand" href="/company/dashboard" onClick={event => { event.preventDefault(); navigate('/company/dashboard'); }}>
          <span className="rc-brand-mark"><Activity size={18} /></span>
          <span><strong>AI Career</strong><small>Recruiter workspace</small></span>
        </a>

        <div className="rc-company-card">
          <span className="rc-company-monogram">{companyName.slice(0, 1).toUpperCase()}</span>
          <span className="rc-company-copy"><strong>{companyName}</strong><small>Company account</small></span>
          <span className={`rc-verification-dot ${verificationStatus === 'officially_verified' ? 'is-verified' : ''}`} title={verificationStatus === 'officially_verified' ? 'Verified' : 'Verification pending'} />
        </div>

        <div className="rc-nav-label">RECRUITMENT</div>
        <nav className="rc-nav" aria-label="Recruiter sections">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `rc-nav-item ${isActive || (item.to === '/company/jobs' && location.pathname.includes('/edit')) ? 'is-active' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.to === '/company/jobs/new' && <ArrowUpRight className="rc-nav-arrow" size={14} />}
              </NavLink>
            );
          })}
        </nav>

        <div className="rc-sidebar-bottom">
          <div className="rc-admin-identity">
            <span className="rc-avatar">{(user?.fullName || 'R').slice(0, 1).toUpperCase()}</span>
            <span><strong>{user?.fullName || 'Recruiter'}</strong><small>{user?.email || 'Recruiter account'}</small></span>
          </div>
          <button className="rc-signout" type="button" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <main className="rc-main">
        <header className="rc-topbar">
          <div className="rc-breadcrumb"><span>Recruitment</span><span className="rc-breadcrumb-separator">/</span><strong>{pageTitle}</strong></div>
          <div className="rc-topbar-actions">
            <span className={`rc-verification-pill ${verificationStatus === 'officially_verified' ? 'is-verified' : ''}`}>
              <ShieldCheck size={14} />
              {verificationStatus === 'officially_verified' ? 'Company verified' : 'Verification pending'}
            </span>
            <span className="rc-topbar-company">{companyName}</span>
          </div>
        </header>

        <nav className="rc-mobile-nav" aria-label="Recruiter sections">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'is-active' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rc-content">{children}</div>
      </main>
    </div>
  );
}
