import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Save, Send, ArrowLeft, X, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';

export default function PostJobPage() {
  const navigate = useNavigate();
  const { id: jobId } = useParams();
  const { user } = useAuth();

  const [companyProfile, setCompanyProfile] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingJob, setLoadingJob] = useState(Boolean(jobId));
  const [submitting, setSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [existingJobStatus, setExistingJobStatus] = useState('active');

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    responsibilities: '',
    requiredSkills: '',
    preferredSkills: '',
    eligibleDegrees: 'B.Tech, B.E., M.Tech, MCA, Dual Degree',
    eligibleBranches: 'Computer Science and Engineering, Information Technology, Data Science, AI & ML, Electronics and Communication',
    eligibleGraduationYears: '2025, 2026, 2027',
    minimumCGPA: '7.0',
    backlogCriteria: 'No active backlogs allowed',
    experienceLevel: 'fresher',
    employmentType: 'full_time',
    workMode: 'hybrid',
    location: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'INR',
    salaryPeriod: 'annual',
    vacancies: '5',
    applicationDeadline: '',
    applicationInstructions: 'Apply with your updated student profile and resume. Eligible candidates will receive an assessment invitation.',
    applicationUrl: '',
    hiringStages: 'Resume Screening, Technical Assessment, Technical Interview, HR / Leadership Round'
  });

  useEffect(() => {
    loadCompany();
    if (jobId) loadJob(jobId);
  }, [jobId]);

  const loadCompany = async () => {
    setLoadingCompany(true);
    try {
      const res = await companyService.getProfile();
      if (res.success && res.data) {
        setCompanyProfile(res.data);
        if (res.data.headquarters && !form.location) {
          setForm(prev => ({ ...prev, location: res.data.headquarters }));
        }
      }
    } catch {
      toast.error('Failed to load company information');
    } finally {
      setLoadingCompany(false);
    }
  };

  const loadJob = async (id) => {
    setLoadingJob(true);
    try {
      const res = await companyService.getJobById(id);
      if (!res.success || !res.data) throw new Error(res.message || 'Job opening not found');
      const job = res.data;
      const joinValues = value => Array.isArray(value) ? value.join(', ') : value || '';
      setExistingJobStatus(job.status || 'active');
      setForm(current => ({
        ...current,
        title: job.title || '',
        description: job.description || '',
        responsibilities: joinValues(job.responsibilities),
        requiredSkills: joinValues(job.requiredSkills),
        preferredSkills: joinValues(job.preferredSkills),
        eligibleDegrees: joinValues(job.eligibleDegrees),
        eligibleBranches: joinValues(job.eligibleBranches),
        eligibleGraduationYears: joinValues(job.eligibleGraduationYears),
        minimumCGPA: job.minimumCGPA ?? '',
        backlogCriteria: job.backlogCriteria || '',
        experienceLevel: job.experienceLevel || 'fresher',
        employmentType: job.employmentType || 'full_time',
        workMode: job.workMode || 'hybrid',
        location: job.location || '',
        salaryMin: job.salaryMin ?? '',
        salaryMax: job.salaryMax ?? '',
        salaryCurrency: job.salaryCurrency || 'INR',
        salaryPeriod: job.salaryPeriod || 'annual',
        vacancies: job.vacancies ?? 1,
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 10) : '',
        applicationInstructions: job.applicationInstructions || '',
        applicationUrl: job.applicationUrl || '',
        hiringStages: joinValues(job.hiringStages)
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load job opening');
      navigate('/company/jobs');
    } finally {
      setLoadingJob(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) { toast.error('Job title or role is required'); return false; }
    if (!form.description.trim()) { toast.error('Job description is required'); return false; }
    if (!form.requiredSkills.trim()) { toast.error('At least one required skill is required'); return false; }
    if (!form.location.trim()) { toast.error('Job location is required'); return false; }
    return true;
  };

  const handleSave = async (isDraft = false) => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        status: isDraft ? 'draft' : (jobId ? existingJobStatus : 'active'),
        eligibleGraduationYears: String(form.eligibleGraduationYears)
          .split(',')
          .map(year => Number(year.trim()))
          .filter(year => Number.isInteger(year)),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        vacancies: form.vacancies ? Number(form.vacancies) : 1,
        minimumCGPA: form.minimumCGPA ? Number(form.minimumCGPA) : null,
      };

      const res = jobId
        ? await companyService.updateJob(jobId, payload)
        : await companyService.createJob(payload);
      if (res.success) {
        toast.success(res.message || (jobId ? 'Job opening updated!' : isDraft ? 'Draft saved!' : 'Job opening published!'));
        navigate('/company/jobs');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job opening');
    } finally {
      setSubmitting(false);
    }
  };

  const companyName = companyProfile?.name || user?.company?.name || 'Registered Company';
  const isVerified = companyProfile?.verificationStatus === 'officially_verified';

  if (loadingCompany || loadingJob) {
    return <div className="rc-job-loading"><span className="rc-job-spinner" /> {loadingJob ? 'Loading job details...' : 'Loading company profile...'}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>
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
            <Link to="/company/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#d946ef', fontWeight: 700, textDecoration: 'none', marginBottom: '0.5rem' }}>
              <ArrowLeft size={14} /> Back to Job Openings
            </Link>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              {jobId ? 'Edit' : 'Post a New'} <span className="gradient-text">Job Opening</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Published positions appear to students across campus with complete eligibility verification.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Eye size={15} /> Preview Opening
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="btn-secondary"
              disabled={submitting}
              style={{ fontSize: '0.85rem' }}
            >
              <Save size={15} /> Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="btn-primary"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)', fontSize: '0.88rem' }}
            >
              <Send size={15} /> {submitting ? (jobId ? 'Saving...' : 'Publishing...') : jobId ? 'Save Changes' : 'Publish Job Opening'}
            </button>
          </div>
        </div>

        {!isVerified && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#fef3c7', lineHeight: 1.4 }}>
              <strong>Notice:</strong> Your company profile verification is currently pending review. This job will be saved and linked directly to your organization, and will become publicly visible as soon as your company is approved by administration.
            </p>
          </div>
        )}
      </motion.div>

      {/* Form Card */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Section 1: Core Role & Company */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              1. Role Identification
            </h3>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  JOB TITLE / ROLE *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Associate Software Engineer, AI Research Intern, Cloud Developer"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  HIRING COMPANY (LOCKED TO PROFILE)
                </label>
                <input
                  type="text"
                  value={companyName}
                  disabled
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#818cf8', fontWeight: 700, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                JOB DESCRIPTION *
              </label>
              <textarea
                rows={4}
                placeholder="Overview of the job role, team mission, and what the candidate will be doing..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                KEY RESPONSIBILITIES (ONE PER LINE)
              </label>
              <textarea
                rows={3}
                placeholder="Design and develop full-stack web applications&#10;Collaborate with engineering teams&#10;Write unit and integration tests"
                value={form.responsibilities}
                onChange={e => setForm({ ...form, responsibilities: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Skills & Qualifications */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              2. Skills & Candidate Competencies
            </h3>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  REQUIRED SKILLS (COMMA-SEPARATED) *
                </label>
                <input
                  type="text"
                  placeholder="Python, React, Node.js, SQL, Data Structures"
                  value={form.requiredSkills}
                  onChange={e => setForm({ ...form, requiredSkills: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  PREFERRED SKILLS (COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  placeholder="AWS, Docker, Redis, TypeScript, GraphQL"
                  value={form.preferredSkills}
                  onChange={e => setForm({ ...form, preferredSkills: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic Eligibility */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              3. Student Academic Eligibility Criteria
            </h3>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  ELIGIBLE DEGREES (COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  placeholder="B.Tech, B.E., M.Tech, MCA, Dual Degree"
                  value={form.eligibleDegrees}
                  onChange={e => setForm({ ...form, eligibleDegrees: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  ELIGIBLE ACADEMIC BRANCHES
                </label>
                <input
                  type="text"
                  placeholder="Computer Science, IT, Data Science, AI, ECE"
                  value={form.eligibleBranches}
                  onChange={e => setForm({ ...form, eligibleBranches: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  GRADUATION YEARS
                </label>
                <input
                  type="text"
                  placeholder="2025, 2026, 2027"
                  value={form.eligibleGraduationYears}
                  onChange={e => setForm({ ...form, eligibleGraduationYears: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  MINIMUM CGPA (0 - 10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.0 or 7.5"
                  value={form.minimumCGPA}
                  onChange={e => setForm({ ...form, minimumCGPA: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  BACKLOG CRITERIA
                </label>
                <input
                  type="text"
                  placeholder="No active backlogs"
                  value={form.backlogCriteria}
                  onChange={e => setForm({ ...form, backlogCriteria: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Employment Details, Mode & Location */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              4. Employment Type, Mode & Location
            </h3>

            <div className="grid-3" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  EMPLOYMENT TYPE
                </label>
                <select
                  value={form.employmentType}
                  onChange={e => setForm({ ...form, employmentType: e.target.value })}
                >
                  <option value="full_time">Full-time</option>
                  <option value="internship">Internship</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  EXPERIENCE LEVEL
                </label>
                <select
                  value={form.experienceLevel}
                  onChange={e => setForm({ ...form, experienceLevel: e.target.value })}
                >
                  <option value="fresher">Fresher (0 years)</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (2-5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  WORK MODE
                </label>
                <select
                  value={form.workMode}
                  onChange={e => setForm({ ...form, workMode: e.target.value })}
                >
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  JOB LOCATION *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Hyderabad, Pune, Remote"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  NUMBER OF VACANCIES (OPTIONAL)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 5 or 10"
                  value={form.vacancies}
                  onChange={e => setForm({ ...form, vacancies: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Salary & Compensation (Optional) */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              5. Compensation (Optional)
            </h3>

            <div className="grid-4" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  MIN SALARY
                </label>
                <input
                  type="number"
                  placeholder="e.g. 800000"
                  value={form.salaryMin}
                  onChange={e => setForm({ ...form, salaryMin: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  MAX SALARY
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1400000"
                  value={form.salaryMax}
                  onChange={e => setForm({ ...form, salaryMax: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  CURRENCY
                </label>
                <select
                  value={form.salaryCurrency}
                  onChange={e => setForm({ ...form, salaryCurrency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  PERIOD
                </label>
                <select
                  value={form.salaryPeriod}
                  onChange={e => setForm({ ...form, salaryPeriod: e.target.value })}
                >
                  <option value="annual">Per Annum (Annual)</option>
                  <option value="monthly">Per Month (Stipend)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Deadline, Hiring Stages & Application Instructions */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              6. Timeline, Hiring Stages & Instructions
            </h3>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  APPLICATION DEADLINE (OPTIONAL)
                </label>
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={e => setForm({ ...form, applicationDeadline: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  EXTERNAL APPLICATION URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  placeholder="https://careers.company.com/apply/123"
                  value={form.applicationUrl}
                  onChange={e => setForm({ ...form, applicationUrl: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                HIRING STAGES (COMMA-SEPARATED)
              </label>
              <input
                type="text"
                placeholder="Resume Screening, Technical Assessment, Technical Interview, HR Round"
                value={form.hiringStages}
                onChange={e => setForm({ ...form, hiringStages: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                APPLICATION INSTRUCTIONS
              </label>
              <textarea
                rows={2}
                placeholder="Specific guidance for candidates applying for this opening..."
                value={form.applicationInstructions}
                onChange={e => setForm({ ...form, applicationInstructions: e.target.value })}
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="btn-secondary"
              disabled={submitting}
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
            >
              <Send size={15} /> {submitting ? (jobId ? 'Saving...' : 'Publishing...') : jobId ? 'Save Changes' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
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
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '680px',
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
                  <span style={{ fontSize: '0.72rem', background: 'rgba(217,70,239,0.15)', color: '#d946ef', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>
                    Candidate Preview
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.4rem 0 0', color: '#fff' }}>
                    {form.title || 'Untitled Opening'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '2px 0 0' }}>
                    {companyName} • {form.location || 'Location'}
                  </p>
                </div>
                <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ padding: '3px 8px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {form.employmentType.replace(/_/g, ' ')}
                </span>
                <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {form.workMode}
                </span>
                {form.salaryMin && (
                  <span style={{ padding: '3px 8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    ₹{Number(form.salaryMin).toLocaleString()} {form.salaryMax ? `- ₹${Number(form.salaryMax).toLocaleString()}` : ''} / yr
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Description
                  </h4>
                  <p style={{ color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                    {form.description || 'No description provided.'}
                  </p>
                </div>

                {form.requiredSkills && (
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Required Skills
                    </h4>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {form.requiredSkills.split(',').map((s, i) => (
                        <span key={i} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.78rem', color: '#818cf8' }}>
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Eligibility
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                    Degrees: {form.eligibleDegrees}<br />
                    Min CGPA: {form.minimumCGPA || 'None'}<br />
                    Graduation: {form.eligibleGraduationYears}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={() => setShowPreviewModal(false)} className="btn-primary">
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
