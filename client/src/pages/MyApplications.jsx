import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks, Briefcase, Calendar, Clock,
  CheckCircle2, XCircle,
  ExternalLink, FileText, Search, RefreshCw,
  ArrowRight, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import portalService from '../services/portalService';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    selected: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchMyApplications();
  }, [filterStatus]);

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const res = await portalService.getMyApplications({
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      if (res.success) {
        setApplications(res.data.applications || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch {
      toast.error('Failed to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status) => {
    const map = {
      applied: { label: 'Applied', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)', icon: Clock },
      under_review: { label: 'Under Review', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)', icon: Clock },
      shortlisted: { label: 'Shortlisted', bg: 'rgba(168, 85, 247, 0.14)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)', icon: Award },
      interview_scheduled: { label: 'Interview Scheduled', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)', icon: Calendar },
      interview: { label: 'Interview Scheduled', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)', icon: Calendar },
      selected: { label: 'Selected / Offer', bg: 'rgba(16, 185, 129, 0.14)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 },
      offered: { label: 'Offered', bg: 'rgba(16, 185, 129, 0.14)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 },
      rejected: { label: 'Not Selected', bg: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)', icon: XCircle },
      withdrawn: { label: 'Withdrawn', bg: 'rgba(100, 116, 139, 0.12)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.25)', icon: XCircle }
    };

    const s = map[status] || { label: status, bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'var(--border-color)', icon: Clock };
    const Icon = s.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        <Icon size={12} />
        {s.label}
      </span>
    );
  };

  const filtered = applications.filter(app => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = app.jobId?.title?.toLowerCase() || '';
    const company = (app.companyId?.name || app.jobId?.companyName || '').toLowerCase();
    return title.includes(q) || company.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(217,70,239,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          padding: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ListChecks size={13} /> Candidate Application Tracker
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              My <span className="gradient-text">Job Applications</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Real-time recruitment status updates, interview schedules, and application history
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/companies-careers" className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Briefcase size={15} /> Browse Openings
            </Link>
            <button onClick={fetchMyApplications} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Real-time KPI Stats Cards */}
      <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Submitted', count: stats.total, color: '#6366f1' },
          { label: 'Under Review', count: stats.underReview, color: '#f59e0b' },
          { label: 'Shortlisted', count: stats.shortlisted, color: '#a855f7' },
          { label: 'Interviews', count: stats.interviewScheduled, color: '#38bdf8' },
          { label: 'Selected / Offers', count: stats.selected, color: '#10b981' },
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card"
            style={{ padding: '1rem 1.25rem', borderLeft: `3px solid ${kpi.color}` }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              {kpi.label}
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: kpi.color, margin: '0.2rem 0 0', lineHeight: 1.1 }}>
              {kpi.count}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'all', label: 'All Applications' },
            { id: 'applied', label: 'Applied' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'shortlisted', label: 'Shortlisted' },
            { id: 'interview_scheduled', label: 'Interview Scheduled' },
            { id: 'selected', label: 'Selected' },
            { id: 'rejected', label: 'Not Selected' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                background: filterStatus === tab.id ? 'var(--primary)' : 'transparent',
                color: filterStatus === tab.id ? '#fff' : 'var(--text-muted)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by job or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.3rem', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <div className="loading-ring" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your application records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
            <Briefcase size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Applications Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {filterStatus !== 'all'
              ? `You don't have any applications marked as "${filterStatus}". Try choosing another status.`
              : `You haven't submitted any job applications yet. Browse registered company openings to apply!`}
          </p>
          <Link to="/companies-careers" className="btn-primary" style={{ display: 'inline-flex' }}>
            Explore Jobs & Openings <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Job Role & Organization</th>
                  <th style={{ padding: '1rem 1rem' }}>Applied On</th>
                  <th style={{ padding: '1rem 1rem' }}>Current Status</th>
                  <th style={{ padding: '1rem 1rem' }}>Last Update</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const job = app.jobId || {};
                  const company = app.companyId || {};
                  const companyName = company.name || job.companyName || 'Registered Employer';

                  return (
                    <tr
                      key={app._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Job & Company */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(217,70,239,0.2))',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: 'var(--primary)',
                            flexShrink: 0
                          }}>
                            {company.logoUrl ? (
                              <img src={company.logoUrl} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} />
                            ) : (
                              companyName[0]?.toUpperCase() || 'C'
                            )}
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0, fontSize: '0.95rem' }}>
                              {job.title || 'Job Opening'}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                              {companyName} • <span style={{ color: 'var(--text-dim)' }}>{job.location || 'India'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Applied On */}
                      <td style={{ padding: '1rem 1rem', color: 'var(--text-muted)' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </td>

                      {/* Current Status */}
                      <td style={{ padding: '1rem 1rem' }}>
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Last Update */}
                      <td style={{ padding: '1rem 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          >
                            View Details
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

      {/* Application Details Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 1000
            }}
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Application Summary</span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
                    {selectedApp.jobId?.title || 'Job Opening'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {selectedApp.companyId?.name || selectedApp.jobId?.companyName}
                  </p>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              {/* Status Timeline History */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Application Timeline
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(selectedApp.statusHistory || []).map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                            {step.status.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {new Date(step.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {step.note && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                            {step.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Applied On: </span>
                  <span style={{ color: 'var(--text-main)' }}>
                    {new Date(selectedApp.appliedAt || selectedApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {selectedApp.resumePath && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Submitted Resume: </span>
                    <a
                      href={`http://localhost:5000/uploads/${selectedApp.resumePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileText size={14} /> {selectedApp.resumeOriginalName || 'View Resume'} <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {selectedApp.coverNote && (
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Candidate Cover Note:</span>
                    <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                      "{selectedApp.coverNote}"
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setSelectedApp(null)} className="btn-secondary">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
