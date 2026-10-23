import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, Briefcase, FileText, CheckCircle2, XCircle,
  AlertCircle, ShieldCheck, RefreshCw, Search, Filter, Eye,
  Trash2, Ban, Check, ExternalLink, Calendar, Mail, MapPin,
  TrendingUp, Award, Clock, ArrowUpRight, ShieldAlert, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';

const STATUS_COLORS = {
  active: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  suspended: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  pending: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  officially_verified: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  pending_review: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  rejected: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search & Filter states
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('');
  const [companyVerifyFilter, setCompanyVerifyFilter] = useState('');

  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');

  const [studentSearch, setStudentSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('');

  // Modals & Active Selections
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [verificationModal, setVerificationModal] = useState(null); // { company, action: 'officially_verified'|'rejected', notes: '' }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [ovRes, compRes, jobsRes, studRes, appsRes, logsRes] = await Promise.allSettled([
        adminService.getOverview(),
        adminService.getCompanies({ limit: 100 }),
        adminService.getJobs({ limit: 100 }),
        adminService.getStudents({ limit: 100 }),
        adminService.getApplications({ limit: 100 }),
        adminService.getAuditLogs({ limit: 50 })
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value?.success) {
        setOverview(ovRes.value.data);
      }
      if (compRes.status === 'fulfilled' && compRes.value?.success) {
        setCompanies(compRes.value.data.companies || []);
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value?.success) {
        setJobs(jobsRes.value.data.jobs || []);
      }
      if (studRes.status === 'fulfilled' && studRes.value?.success) {
        setStudents(studRes.value.data.students || []);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value?.success) {
        setApplications(appsRes.value.data.applications || []);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.success) {
        setAuditLogs(logsRes.value.data || []);
      }
    } catch (err) {
      toast.error('Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  // Company Verification Handlers
  const handleVerifyCompany = async (companyId, status, notes = '') => {
    try {
      setActionLoading(true);
      const res = await adminService.verifyCompany(companyId, { verificationStatus: status, reason: notes });
      if (res.success) {
        toast.success(`Company status updated to ${status.replace('_', ' ')}`);
        setVerificationModal(null);
        loadAllData();
      } else {
        toast.error(res.message || 'Verification update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCompanyStatus = async (company) => {
    const newStatus = company.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = newStatus === 'suspended'
      ? `Are you sure you want to SUSPEND ${company.companyName}? All their job postings will be hidden.`
      : `Reactivate ${company.companyName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminService.updateCompanyStatus(company._id, { status: newStatus });
      if (res.success) {
        toast.success(`${company.companyName} is now ${newStatus}`);
        loadAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company account status');
    }
  };

  // Job Moderation Handlers
  const handleToggleJobVerify = async (job) => {
    try {
      const res = await adminService.verifyJob(job._id, { isVerified: !job.isVerified });
      if (res.success) {
        toast.success(`Job marked as ${!job.isVerified ? 'Verified' : 'Unverified'}`);
        loadAllData();
      }
    } catch (err) {
      toast.error('Failed to update job verification status');
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to DELETE job opening "${job.title}" at "${job.companyName}"? This cannot be undone.`)) return;

    try {
      const res = await adminService.deleteJob(job._id);
      if (res.success) {
        toast.success('Job listing removed successfully');
        loadAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job listing');
    }
  };

  // Filtered lists
  const filteredCompanies = companies.filter(c => {
    const matchSearch = !companySearch ||
      c.companyName?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.industry?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.ownerId?.email?.toLowerCase().includes(companySearch.toLowerCase());
    const matchStatus = !companyStatusFilter || c.status === companyStatusFilter;
    const matchVerify = !companyVerifyFilter || c.verificationStatus === companyVerifyFilter;
    return matchSearch && matchStatus && matchVerify;
  });

  const filteredJobs = jobs.filter(j => {
    const matchSearch = !jobSearch ||
      j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.companyName?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location?.toLowerCase().includes(jobSearch.toLowerCase());
    const matchStatus = !jobStatusFilter || j.status === jobStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredStudents = students.filter(s => {
    return !studentSearch ||
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.degree?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.branch?.toLowerCase().includes(studentSearch.toLowerCase());
  });

  const filteredApplications = applications.filter(a => {
    return !appStatusFilter || a.status === appStatusFilter;
  });

  const TABS = [
    { id: 'overview', label: 'Platform Overview', icon: Activity },
    { id: 'companies', label: 'Companies & Verification', icon: Building2, count: overview?.companies?.pendingReview || 0 },
    { id: 'jobs', label: 'Job Moderation', icon: Briefcase },
    { id: 'students', label: 'Students Directory', icon: Users },
    { id: 'applications', label: 'Platform Applications', icon: FileText },
    { id: 'audit', label: 'Audit Logs', icon: Clock }
  ];

  if (loading && !overview) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading administrator portal...</p>
      </div>
    );
  }

  const s = overview || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid rgba(217, 70, 239, 0.25)',
          padding: '1.5rem 2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{
                background: 'rgba(217, 70, 239, 0.15)',
                color: '#d946ef',
                border: '1px solid rgba(217, 70, 239, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={12} /> Master Administrator
              </span>
              {s.companies?.pendingReview > 0 && (
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700
                }}>
                  ⚠️ {s.companies.pendingReview} Companies Awaiting Verification
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Platform <span className="gradient-text">Administration Console</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Full institutional oversight across students, recruiter registrations, live job listings, and hiring workflows.
            </p>
          </div>
          <button
            onClick={loadAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={15} /> Refresh Data
          </button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '0.35rem',
        flexWrap: 'wrap'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              background: activeTab === tab.id ? 'var(--primary-gradient)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none'
            }}
          >
            <tab.icon size={15} /> {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#ef4444',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Registered Students', value: s.students?.total || 0, icon: Users, color: '#4f46e5', sub: 'Active job-seekers' },
              { label: 'Registered Companies', value: s.companies?.total || 0, icon: Building2, color: '#059669', sub: `${s.companies?.verified || 0} officially verified` },
              { label: 'Pending Verifications', value: s.companies?.pendingReview || 0, icon: ShieldAlert, color: '#d97706', sub: 'Needs admin review' },
              { label: 'Live Active Jobs', value: s.jobs?.active || 0, icon: Briefcase, color: '#2563eb', sub: `${s.jobs?.total || 0} total listings` },
              { label: 'Total Applications', value: s.applications?.total || 0, icon: FileText, color: '#7c3aed', sub: 'Submitted in portal' },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff'
                }}
              >
                <div style={{ background: `${kpi.color}15`, padding: '0.85rem', borderRadius: '12px' }}>
                  <kpi.icon size={24} color={kpi.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{kpi.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Action Tables in Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {/* Urgent: Companies Awaiting Verification */}
            <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={18} color="#d97706" /> Companies Needing Verification
                </h3>
                <button onClick={() => setActiveTab('companies')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  View All →
                </button>
              </div>

              {companies.filter(c => c.verificationStatus === 'pending_review').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>All company registrations have been processed! No pending items.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {companies.filter(c => c.verificationStatus === 'pending_review').slice(0, 4).map(comp => (
                    <div key={comp._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{comp.companyName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{comp.industry || 'General Industry'} • {comp.location || 'Location undisclosed'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleVerifyCompany(comp._id, 'officially_verified')}
                          style={{
                            padding: '0.35rem 0.65rem',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setVerificationModal({ company: comp, action: 'rejected', notes: '' })}
                          style={{
                            padding: '0.35rem 0.65rem',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#991b1b',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Applications Pipeline Status */}
            <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#0f172a' }}>
                Hiring Pipeline Distribution
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Applied / New', count: applications.filter(a => a.status === 'applied').length, color: '#3b82f6' },
                  { label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length, color: '#8b5cf6' },
                  { label: 'Shortlisted', count: applications.filter(a => a.status === 'shortlisted').length, color: '#f59e0b' },
                  { label: 'Interview Scheduled', count: applications.filter(a => a.status === 'interview_scheduled').length, color: '#06b6d4' },
                  { label: 'Selected / Hired', count: applications.filter(a => a.status === 'selected').length, color: '#10b981' },
                  { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: '#ef4444' }
                ].map((item, i) => (
                  <div key={i} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color, marginTop: '2px' }}>{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANIES & VERIFICATION */}
      {activeTab === 'companies' && (
        <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Registered Companies Directory
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Audit company authenticity, verify legal employers, or suspend misbehaving organizations.
              </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search company or email..."
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <select
                value={companyVerifyFilter}
                onChange={e => setCompanyVerifyFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="">All Verification</option>
                <option value="officially_verified">Verified</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={companyStatusFilter}
                onChange={e => setCompanyStatusFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>Company</th>
                  <th style={{ padding: '0.75rem' }}>Recruiter Email</th>
                  <th style={{ padding: '0.75rem' }}>Industry & Location</th>
                  <th style={{ padding: '0.75rem' }}>Verification</th>
                  <th style={{ padding: '0.75rem' }}>Account Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(c => {
                  const vStyle = STATUS_COLORS[c.verificationStatus] || STATUS_COLORS.pending;
                  const aStyle = STATUS_COLORS[c.status] || STATUS_COLORS.active;

                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#334155',
                            overflow: 'hidden'
                          }}>
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              c.companyName?.charAt(0) || 'C'
                            )}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{c.companyName}</strong>
                            {c.website && (
                              <div>
                                <a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                  Website <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#475569' }}>
                        {c.ownerId?.email || c.contactEmail || 'N/A'}
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.ownerId?.name || 'Recruiter'}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#475569' }}>
                        <div>{c.industry || 'General'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.location || 'Undisclosed'}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: vStyle.bg,
                          color: vStyle.text,
                          border: `1px solid ${vStyle.border}`,
                          textTransform: 'capitalize'
                        }}>
                          {c.verificationStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: aStyle.bg,
                          color: aStyle.text,
                          border: `1px solid ${aStyle.border}`,
                          textTransform: 'capitalize'
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {c.verificationStatus !== 'officially_verified' && (
                            <button
                              onClick={() => handleVerifyCompany(c._id, 'officially_verified')}
                              title="Approve verification"
                              style={{
                                padding: '0.35rem 0.6rem',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#065f46',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              Approve
                            </button>
                          )}
                          {c.verificationStatus !== 'rejected' && (
                            <button
                              onClick={() => setVerificationModal({ company: c, action: 'rejected', notes: '' })}
                              title="Reject verification"
                              style={{
                                padding: '0.35rem 0.6rem',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleCompanyStatus(c)}
                            title={c.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                            style={{
                              padding: '0.35rem 0.6rem',
                              background: c.status === 'active' ? '#fff1f2' : '#ecfdf5',
                              border: c.status === 'active' ? '1px solid #fecdd3' : '1px solid #a7f3d0',
                              color: c.status === 'active' ? '#e11d48' : '#059669',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {c.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: JOB MODERATION */}
      {activeTab === 'jobs' && (
        <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Job Listings Moderation
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Review live and draft vacancies posted across the network. Flag, verify, or remove inappropriate postings.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search job title or company..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <select
                value={jobStatusFilter}
                onChange={e => setJobStatusFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>Job Title</th>
                  <th style={{ padding: '0.75rem' }}>Company</th>
                  <th style={{ padding: '0.75rem' }}>Type & Mode</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Verification</th>
                  <th style={{ padding: '0.75rem' }}>Posted</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(j => (
                  <tr key={j._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#0f172a' }}>{j.title}</strong>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {j.vacancies ? `${j.vacancies} vacancies • ` : ''}
                        {j.experienceLevel || 'Experience not specified'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      {j.companyName}
                      {j.isDemonstration && (
                        <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                          Dataset
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      <div>{j.employmentType}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{j.workMode || 'On-site'} • {j.location}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: j.status === 'active' ? '#ecfdf5' : '#f8fafc',
                        color: j.status === 'active' ? '#065f46' : '#64748b',
                        border: '1px solid #cbd5e1',
                        textTransform: 'capitalize'
                      }}>
                        {j.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {j.isVerified ? (
                        <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={13} /> Verified
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Unverified</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.78rem' }}>
                      {new Date(j.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleToggleJobVerify(j)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: j.isVerified ? '#f1f5f9' : '#ecfdf5',
                            border: '1px solid #cbd5e1',
                            color: j.isVerified ? '#64748b' : '#065f46',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {j.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(j)}
                          style={{
                            padding: '0.35rem 0.5rem',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#ef4444',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Delete job listing"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Registered Students Directory ({students.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Students who have registered and maintain career exploration profiles.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  minWidth: '240px'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>Student Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Academic Degree & Branch</th>
                  <th style={{ padding: '0.75rem' }}>Graduation Year</th>
                  <th style={{ padding: '0.75rem' }}>CGPA</th>
                  <th style={{ padding: '0.75rem' }}>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(st => (
                  <tr key={st._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#0f172a' }}>{st.name}</strong>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>{st.email}</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      {st.degree || 'Not specified'} {st.branch ? `• ${st.branch}` : ''}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>{st.graduationYear || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>{st.cgpa || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {new Date(st.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM APPLICATIONS AUDIT */}
      {activeTab === 'applications' && (
        <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Platform-Wide Applications Audit ({applications.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Institutional monitoring of candidate applications and recruiter hiring actions.
              </p>
            </div>

            <select
              value={appStatusFilter}
              onChange={e => setAppStatusFilter(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>Candidate</th>
                  <th style={{ padding: '0.75rem' }}>Job Title</th>
                  <th style={{ padding: '0.75rem' }}>Company</th>
                  <th style={{ padding: '0.75rem' }}>Application Date</th>
                  <th style={{ padding: '0.75rem' }}>Current Status</th>
                  <th style={{ padding: '0.75rem' }}>Resume</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(app => (
                  <tr key={app._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#0f172a' }}>{app.studentId?.name || app.applicantData?.name || 'Student'}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{app.studentId?.email || app.applicantData?.email}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#0f172a', fontWeight: 600 }}>
                      {app.jobId?.title || 'Job Opening'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569' }}>
                      {app.companyId?.companyName || app.jobId?.companyName || 'Company'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.78rem' }}>
                      {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        textTransform: 'capitalize'
                      }}>
                        {app.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {app.resumePath ? (
                        <a href={app.resumePath} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>
                          View Resume
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Profile Record</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#0f172a' }}>
            System Administrative Audit Logs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {auditLogs.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No audit log entries recorded yet.</p>
            ) : (
              auditLogs.map(log => (
                <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{log.action?.replace('_', ' ').toUpperCase()}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Target: {log.targetModel} ({log.targetId}) • By Admin: {log.performedBy?.name || 'Administrator'}
                    </div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VERIFICATION MODAL */}
      <AnimatePresence>
        {verificationModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.75rem',
                border: '1px solid #e2e8f0'
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                {verificationModal.action === 'officially_verified' ? 'Approve Verification' : 'Reject Verification'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                You are updating the verification status for <strong>{verificationModal.company?.companyName}</strong>.
              </p>

              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Reason / Internal Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={verificationModal.notes}
                onChange={e => setVerificationModal({ ...verificationModal, notes: e.target.value })}
                placeholder="e.g. Verified via official corporate domain and corporate filings."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: '1.25rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setVerificationModal(null)}
                  disabled={actionLoading}
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyCompany(verificationModal.company._id, verificationModal.action, verificationModal.notes)}
                  disabled={actionLoading}
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: verificationModal.action === 'officially_verified' ? '#059669' : '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Status Change'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
