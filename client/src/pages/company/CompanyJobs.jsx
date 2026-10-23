import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, PlusCircle, Search, Users, MapPin, Calendar, Edit, Trash2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';

export default function CompanyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await companyService.getJobs({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined
      });
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load your job openings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      const res = await companyService.updateJobStatus(jobId, newStatus);
      if (res.success) {
        toast.success(`Job marked as ${newStatus}`);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    }
  };

  const handleDelete = async (jobId) => {
    try {
      const res = await companyService.deleteJob(jobId);
      if (res.success) {
        toast.success(res.message || 'Job opening updated');
        setDeletingId(null);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = job.title?.toLowerCase() || '';
    const loc = job.location?.toLowerCase() || '';
    const skills = (job.requiredSkills || []).join(' ').toLowerCase();
    return title.includes(q) || loc.includes(q) || skills.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
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
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase' }}>
              Vacancy Inventory
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
              My <span className="gradient-text">Job Openings</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Manage recruitment listings, review applicant counts, and control job availability.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/company/jobs/new" className="btn-primary" style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)', fontSize: '0.88rem' }}>
              <PlusCircle size={16} /> Post a New Opening
            </Link>
            <button onClick={fetchJobs} className="btn-secondary" style={{ fontSize: '0.88rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'active', label: 'Active' },
            { id: 'draft', label: 'Drafts' },
            { id: 'closed', label: 'Closed / Expired' },
            { id: 'archived', label: 'Archived' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                background: statusFilter === tab.id ? '#d946ef' : 'transparent',
                color: statusFilter === tab.id ? '#fff' : 'var(--text-muted)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search role, location, skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.3rem', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Job Openings Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <div className="loading-ring" />
          <p style={{ color: 'var(--text-muted)' }}>Loading job openings...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Briefcase size={38} color="#d946ef" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>No Job Openings Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {statusFilter !== 'all'
              ? `No job records currently matching "${statusFilter}". Try switching filters or search terms.`
              : 'You have not published any job openings yet. Create your first opening to receive candidate applications.'}
          </p>
          <Link to="/company/jobs/new" className="btn-primary" style={{ display: 'inline-flex', background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}>
            <PlusCircle size={15} /> Create Job Opening
          </Link>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Role & Work Mode</th>
                  <th style={{ padding: '1rem 1rem' }}>Location</th>
                  <th style={{ padding: '1rem 1rem' }}>Deadline</th>
                  <th style={{ padding: '1rem 1rem', textAlign: 'center' }}>Applicants</th>
                  <th style={{ padding: '1rem 1rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr
                    key={job._id}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Role & Work Mode */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <p style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0, fontSize: '0.95rem' }}>
                        {job.title}
                      </p>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', textTransform: 'capitalize' }}>
                          {job.employmentType?.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                          {job.workMode}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--text-dim)" />
                        <span>{job.location || 'Remote / India'}</span>
                      </div>
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: '1rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {job.applicationDeadline ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} color="var(--text-dim)" />
                          <span>{new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Open</span>
                      )}
                    </td>

                    {/* Applicants */}
                    <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                      <Link
                        to={`/company/applicants?jobId=${job._id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: 'rgba(217,70,239,0.12)',
                          color: '#d946ef',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Users size={12} /> {job.applicantCount || 0}
                      </Link>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: job.status === 'active' ? 'rgba(16,185,129,0.12)' : job.status === 'draft' ? 'rgba(148,163,184,0.12)' : 'rgba(244,63,94,0.12)',
                        color: job.status === 'active' ? '#10b981' : job.status === 'draft' ? '#94a3b8' : '#f43f5e',
                        border: `1px solid ${job.status === 'active' ? 'rgba(16,185,129,0.3)' : job.status === 'draft' ? 'rgba(148,163,184,0.25)' : 'rgba(244,63,94,0.25)'}`
                      }}>
                        {job.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <Link
                          to={`/company/applicants?jobId=${job._id}`}
                          title="Manage Applicants"
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Users size={13} /> Candidates
                        </Link>

                        <Link
                          to={`/company/jobs/${job._id}/edit`}
                          title={`Edit ${job.title}`}
                          aria-label={`Edit ${job.title}`}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Edit size={13} /> Edit
                        </Link>

                        <button
                          onClick={() => handleToggleStatus(job._id, job.status)}
                          title={job.status === 'active' ? 'Close Opening' : 'Reopen Job'}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: job.status === 'active' ? '#f59e0b' : '#10b981',
                            borderRadius: '6px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {job.status === 'active' ? 'Close' : 'Activate'}
                        </button>

                        <button
                          onClick={() => setDeletingId(job._id)}
                          title="Delete / Archive Job"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(244,63,94,0.25)',
                            color: '#f43f5e',
                            borderRadius: '6px',
                            padding: '0.35rem 0.55rem',
                            cursor: 'pointer'
                          }}
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

      {/* Delete/Archive Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
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
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '1.75rem',
                background: 'var(--bg-card)',
                border: '1px solid rgba(244,63,94,0.3)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', flexShrink: 0 }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>Remove Job Opening?</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                    If students have already applied, the job will be safely archived to protect candidate records.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => setDeletingId(null)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  style={{
                    background: '#f43f5e',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0.55rem 1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Delete / Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
