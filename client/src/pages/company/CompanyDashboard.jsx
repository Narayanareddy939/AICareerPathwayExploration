import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Briefcase, Users, FileText, CheckCircle2,
  Clock, Award, Calendar, AlertCircle, PlusCircle,
  ArrowRight, RefreshCw, ExternalLink, ShieldCheck,
  TrendingUp, Eye, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await companyService.getStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading recruiter intelligence...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const company = data?.company || {};
  const recentApps = data?.recentApplications || [];
  const recentJobs = data?.recentJobs || [];
  const isVerified = company.verificationStatus === 'officially_verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(217,70,239,0.12) 0%, rgba(99,102,241,0.08) 100%)',
          border: '1px solid rgba(217,70,239,0.25)',
          padding: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Employer Command Center
              </span>
              {isVerified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#d1fae5', color: '#065f46', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  <ShieldCheck size={12} /> Officially Verified
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  <Clock size={12} /> Verification Pending
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              {company.name || 'Company Portal'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Welcome back, <strong>{user?.fullName || 'Recruiter'}</strong>. Manage campus drives, job vacancies, and student candidate pipelines.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/company/jobs/new" className="btn-primary" style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)', fontSize: '0.88rem' }}>
              <PlusCircle size={16} /> Post a Job Opening
            </Link>
            <button onClick={loadDashboard} className="btn-secondary" style={{ fontSize: '0.88rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Verification Status Warning if pending */}
        {!isVerified && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#fef3c7', lineHeight: 1.4 }}>
              <strong>Verification in Progress:</strong> Your company profile is currently being reviewed by platform administrators. You can create and prepare job postings now; they will automatically become visible to all students once your company verification is approved.
            </p>
          </div>
        )}
      </motion.div>

      {/* Primary KPI Grid (All computed strictly from database records) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Jobs Posted', value: kpis.totalJobs || 0, icon: Briefcase, color: '#6366f1' },
          { label: 'Active Job Openings', value: kpis.activeJobs || 0, icon: TrendingUp, color: '#10b981' },
          { label: 'Total Applications', value: kpis.totalApplications || 0, icon: Users, color: '#d946ef' },
          { label: 'Awaiting Review', value: kpis.awaitingReview || 0, icon: Clock, color: '#f59e0b' },
          { label: 'Shortlisted Candidates', value: kpis.shortlisted || 0, icon: Award, color: '#a855f7' },
          { label: 'Interviews Scheduled', value: kpis.interviewsScheduled || 0, icon: Calendar, color: '#06b6d4' },
          { label: 'Selected / Offers', value: kpis.selected || 0, icon: UserCheck, color: '#10b981' },
          { label: 'Draft Postings', value: kpis.draftJobs || 0, icon: FileText, color: '#94a3b8' },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="glass-card"
            style={{ padding: '1.1rem 1.25rem', borderLeft: `3px solid ${item.color}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {item.label}
              </span>
              <div style={{ background: `${item.color}18`, padding: '6px', borderRadius: '8px' }}>
                <item.icon size={16} color={item.color} />
              </div>
            </div>
            <p style={{ fontSize: '1.9rem', fontWeight: 800, color: item.color, margin: 0, lineHeight: 1 }}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Split Section: Recent Applications & Active Job Openings */}
      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Recent Applications Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Recent Applicants
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                Latest candidates who applied to your positions
              </p>
            </div>
            <Link to="/company/applicants" style={{ fontSize: '0.8rem', color: '#d946ef', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              View All ({kpis.totalApplications || 0}) <ChevronRight size={14} />
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
              <Users size={32} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No student applications received yet.</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>Once students discover and apply to your jobs, they will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentApps.map(app => {
                const name = app.applicantData?.fullName || app.studentId?.fullName || 'Candidate';
                const email = app.applicantData?.email || app.studentId?.email || '';
                const jobTitle = app.jobId?.title || 'Job Opening';

                return (
                  <div
                    key={app._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#d946ef,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', color: '#fff' }}>
                        {name[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0, color: 'var(--text-main)' }}>
                          {name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                          For: {jobTitle}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: app.status === 'shortlisted' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                        color: app.status === 'shortlisted' ? '#a855f7' : '#3b82f6',
                        textTransform: 'capitalize'
                      }}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '3px 0 0' }}>
                        {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Jobs Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Active Job Openings
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                Openings published under your company name
              </p>
            </div>
            <Link to="/company/jobs" style={{ fontSize: '0.8rem', color: '#d946ef', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              View All ({kpis.totalJobs || 0}) <ChevronRight size={14} />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
              <Briefcase size={32} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No job openings created yet.</p>
              <Link to="/company/jobs/new" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem', fontSize: '0.85rem' }}>
                <PlusCircle size={14} /> Post Your First Job Opening
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentJobs.map(job => (
                <div
                  key={job._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.92rem', margin: 0, color: 'var(--text-main)' }}>
                      {job.title}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                      {job.location || 'India'} • <span style={{ textTransform: 'capitalize' }}>{job.employmentType?.replace(/_/g, ' ')}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#d946ef' }}>
                        {job.applicantCount || 0}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', margin: 0, textTransform: 'uppercase' }}>
                        Applicants
                      </p>
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: job.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
                      color: job.status === 'active' ? '#10b981' : '#94a3b8',
                      textTransform: 'uppercase'
                    }}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="glass-card" style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Company Representation</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
            Ensure your company logo, description, and website are up to date for candidate credibility.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/company/profile" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Building2 size={14} /> Edit Company Profile
          </Link>
          <Link to="/companies-careers" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Eye size={14} /> Preview Live Openings
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
