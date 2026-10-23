import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Briefcase, Calendar, Award, FileText,
  CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw,
  X, Download, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';

export default function CompanyApplicants() {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [applicants, setApplicants] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minCGPA, setMinCGPA] = useState('');
  const [gradYear, setGradYear] = useState('');

  // Selected applicant for drawer/modal
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [newStatusValue, setNewStatusValue] = useState('');

  useEffect(() => {
    loadJobsForFilter();
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [selectedJobId, selectedStatus, minCGPA, gradYear]);

  const loadJobsForFilter = async () => {
    try {
      const res = await companyService.getJobs({ limit: 100 });
      if (res.success) {
        setJobsList(res.data || []);
      }
    } catch {}
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedJobId) params.jobId = selectedJobId;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (minCGPA) params.minCGPA = minCGPA;
      if (gradYear) params.graduationYear = gradYear;

      const res = await companyService.getApplicants(params);
      if (res.success) {
        setApplicants(res.data || []);
      }
    } catch {
      toast.error('Failed to load candidate applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, status, note = '') => {
    setUpdatingStatus(true);
    try {
      const res = await companyService.updateApplicationStatus(appId, status, note);
      if (res.success) {
        toast.success(`Application status updated to ${status.replace(/_/g, ' ')}`);
        // Update local state
        setApplicants(prev => prev.map(a => a._id === appId ? { ...a, status, statusHistory: res.data.statusHistory } : a));
        if (activeApplicant?._id === appId) {
          setActiveApplicant(prev => ({ ...prev, status, statusHistory: res.data.statusHistory }));
        }
        setStatusUpdateNote('');
        setNewStatusValue('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      applied: { label: 'Applied', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)', icon: Clock },
      under_review: { label: 'Under Review', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)', icon: Clock },
      shortlisted: { label: 'Shortlisted', bg: 'rgba(168, 85, 247, 0.14)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)', icon: Award },
      interview_scheduled: { label: 'Interview Scheduled', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)', icon: Calendar },
      selected: { label: 'Selected / Offer', bg: 'rgba(16, 185, 129, 0.14)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 },
      rejected: { label: 'Not Selected', bg: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)', icon: XCircle },
      withdrawn: { label: 'Withdrawn by Candidate', bg: 'rgba(100, 116, 139, 0.12)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.25)', icon: AlertCircle }
    };

    const s = map[status] || { label: status, bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'var(--border-color)', icon: Clock };
    const Icon = s.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        <Icon size={11} />
        {s.label}
      </span>
    );
  };

  const filtered = applicants.filter(app => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (app.applicantData?.fullName || app.studentId?.fullName || '').toLowerCase();
    const email = (app.applicantData?.email || app.studentId?.email || '').toLowerCase();
    const skills = (app.applicantData?.skills || []).join(' ').toLowerCase();
    return name.includes(q) || email.includes(q) || skills.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1280px', margin: '0 auto' }}>
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
              Candidate Pipeline
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
              Applicants <span className="gradient-text">Management</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Review candidate resumes, evaluate academic credentials, and advance applicants through your hiring pipeline.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/company/jobs" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Briefcase size={14} /> My Openings
            </Link>
            <button onClick={fetchApplicants} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search candidate name or skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.3rem', fontSize: '0.85rem', width: '100%' }}
            />
          </div>

          {/* Job Filter */}
          <div>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              style={{ fontSize: '0.85rem', width: '100%' }}
            >
              <option value="">All Job Openings ({jobsList.length})</option>
              {jobsList.map(j => (
                <option key={j._id} value={j._id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ fontSize: '0.85rem', width: '100%' }}
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied (New)</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="selected">Selected / Offer</option>
              <option value="rejected">Not Selected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Min CGPA */}
          <div>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              placeholder="Min CGPA (e.g. 7.5)"
              value={minCGPA}
              onChange={e => setMinCGPA(e.target.value)}
              style={{ fontSize: '0.85rem', width: '100%' }}
            />
          </div>

          <div>
            <input
              type="number"
              min="2000"
              max="2100"
              placeholder="Graduation year (e.g. 2026)"
              value={gradYear}
              onChange={e => setGradYear(e.target.value)}
              style={{ fontSize: '0.85rem', width: '100%' }}
            />
          </div>

          <div>
            <input
              type="number"
              min="2000"
              max="2100"
              placeholder="Graduation year (e.g. 2026)"
              value={gradYear}
              onChange={e => setGradYear(e.target.value)}
              style={{ fontSize: '0.85rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Applicants Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <div className="loading-ring" />
          <p style={{ color: 'var(--text-muted)' }}>Filtering candidate applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Users size={38} color="#d946ef" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>No Applicants Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
            {selectedJobId || selectedStatus !== 'all' || searchQuery
              ? 'No candidate records match your current filter parameters. Try clearing some filters.'
              : 'Candidates will appear here as soon as they submit applications to your active job openings.'}
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Candidate</th>
                  <th style={{ padding: '1rem 1rem' }}>Applied Role</th>
                  <th style={{ padding: '1rem 1rem' }}>Degree & CGPA</th>
                  <th style={{ padding: '1rem 1rem' }}>Applied On</th>
                  <th style={{ padding: '1rem 1rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const student = app.applicantData || {};
                  const job = app.jobId || {};
                  const name = student.fullName || app.studentId?.fullName || 'Candidate';
                  const email = student.email || app.studentId?.email || '';

                  return (
                    <tr
                      key={app._id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Candidate */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg,#d946ef,#7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#fff',
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {name[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0, fontSize: '0.92rem' }}>
                              {name}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>
                              {email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Job Opening */}
                      <td style={{ padding: '1rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {job.title || 'Job Opening'}
                      </td>

                      {/* Academic & CGPA */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {student.branch || student.university || 'Engineering'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            CGPA: <strong style={{ color: student.cgpa >= 8 ? '#10b981' : '#818cf8' }}>{student.cgpa || 'N/A'}</strong> • Grad: {student.graduationYear || '2026'}
                          </span>
                        </div>
                      </td>

                      {/* Applied On */}
                      <td style={{ padding: '1rem 1rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Current Status */}
                      <td style={{ padding: '1rem 1rem' }}>
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setActiveApplicant(app);
                              setNewStatusValue(['shortlisted', 'interview_scheduled', 'selected', 'rejected'].includes(app.status) ? app.status : 'shortlisted');
                            }}
                            className="btn-primary"
                            style={{
                              background: 'rgba(217,70,239,0.15)',
                              color: '#d946ef',
                              border: '1px solid rgba(217,70,239,0.3)',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.78rem'
                            }}
                          >
                            Review & Status
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

      {/* Applicant Detail & Status Management Drawer/Modal */}
      <AnimatePresence>
        {activeApplicant && (
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
            onClick={() => setActiveApplicant(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#d946ef,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>
                    {(activeApplicant.applicantData?.fullName || 'C')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                      {activeApplicant.applicantData?.fullName || 'Candidate Profile'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>
                      {activeApplicant.applicantData?.email} {activeApplicant.applicantData?.phone && `• ${activeApplicant.applicantData.phone}`}
                    </p>
                  </div>
                </div>

                <button onClick={() => setActiveApplicant(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Position Tag & Current Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Position Applied</span>
                  <p style={{ fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0' }}>
                    {activeApplicant.jobId?.title || 'Job Opening'}
                  </p>
                </div>
                <div>{getStatusBadge(activeApplicant.status)}</div>
              </div>

              {/* Academic & Skills Snapshot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div className="grid-3" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Academic Branch</span>
                    <p style={{ fontWeight: 700, margin: '2px 0 0', fontSize: '0.85rem' }}>
                      {activeApplicant.applicantData?.branch || 'Computer Science'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cumulative CGPA</span>
                    <p style={{ fontWeight: 800, margin: '2px 0 0', fontSize: '0.9rem', color: '#10b981' }}>
                      {activeApplicant.applicantData?.cgpa || 'N/A'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Graduation Year</span>
                    <p style={{ fontWeight: 700, margin: '2px 0 0', fontSize: '0.85rem' }}>
                      {activeApplicant.applicantData?.graduationYear || '2026'}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                {activeApplicant.applicantData?.skills?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                      Candidate Skills
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {activeApplicant.applicantData.skills.map((sk, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Candidate Resume */}
                {activeApplicant.resumePath ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} color="#818cf8" />
                      <div>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>
                          {activeApplicant.resumeOriginalName || 'Candidate_Resume.pdf'}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0 }}>
                          Submitted for this vacancy
                        </p>
                      </div>
                    </div>
                    <a
                      href={`http://localhost:5000/uploads/${activeApplicant.resumePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    >
                      <Download size={13} /> View Resume
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    Candidate applied using completed profile portfolio credentials.
                  </div>
                )}

                {/* Cover Note */}
                {activeApplicant.coverNote && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      Candidate Cover Note
                    </span>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                      "{activeApplicant.coverNote}"
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Control Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#d946ef', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Update Hiring Pipeline Stage
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>NEW STATUS</label>
                    <select
                      value={newStatusValue}
                      onChange={e => setNewStatusValue(e.target.value)}
                      style={{ fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="selected">Selected / Offer</option>
                      <option value="rejected">Not Selected</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>INTERNAL NOTE / REASON</label>
                    <input
                      type="text"
                      placeholder="e.g. Cleared technical interview round 1"
                      value={statusUpdateNote}
                      onChange={e => setStatusUpdateNote(e.target.value)}
                      style={{ fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button onClick={() => setActiveApplicant(null)} className="btn-secondary">
                    Close
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeApplicant._id, newStatusValue || activeApplicant.status, statusUpdateNote)}
                    className="btn-primary"
                    disabled={updatingStatus}
                    style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
                  >
                    <Check size={14} /> {updatingStatus ? 'Saving...' : 'Update Application Status'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
