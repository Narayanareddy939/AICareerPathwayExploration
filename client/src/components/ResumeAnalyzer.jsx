import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FileText, CheckCircle2, XCircle, AlertTriangle, Zap,
  UploadCloud, Sparkles, UserCheck, FileUp, Info,
  Target, Award, TrendingUp, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ─── Build a text resume from a profile object ────────────────────────────────
function buildResumeFromProfile(p, user) {
  if (!p && !user) return '';
  const name     = (p?.fullName   || user?.fullName   || 'Student User').toUpperCase();
  const email    = p?.email       || user?.email       || 'student@university.edu';
  const phone    = p?.phone       || '+91-9876543210';
  const location = p?.preferredLocation || p?.location || 'India';
  const linkedin = p?.linkedinUrl || 'linkedin.com/in/student';
  const github   = p?.githubUrl   || 'github.com/student-dev';
  const degree   = p?.degree      || 'Bachelor of Technology';
  const branch   = p?.branch      || 'Computer Science & Engineering';
  const univ     = p?.university  || 'University Institute of Technology';
  const gradYear = p?.graduationYear || '2026';
  const cgpa     = p?.cgpa ? `${p.cgpa} / 10.0` : '8.5 / 10.0';

  const skillsList = Array.isArray(p?.skills) && p.skills.length
    ? p.skills.join(', ')
    : 'Python, SQL, JavaScript, React, Git, Machine Learning';

  const certs = Array.isArray(p?.certifications) && p.certifications.length
    ? p.certifications.map(c => `- ${c}`).join('\n')
    : '- Professional Certification';

  const projects = Array.isArray(p?.projects) && p.projects.length
    ? p.projects.map((proj, i) =>
        `${i + 1}. ${typeof proj === 'string' ? proj : (proj.title || 'Technical Project')}: ` +
        `Applied industry technologies and delivered optimized solution.`
      ).join('\n')
    : `1. ML Recommendation System: Built end-to-end pipeline using Python, SQL, and Scikit-Learn.\n` +
      `2. Cloud App: Designed RESTful backend microservices with Docker and JWT authentication.`;

  const experience = Array.isArray(p?.internships) && p.internships.length
    ? p.internships.map(i => `- ${typeof i === 'string' ? i : (i.role || 'Software Intern')}`).join('\n')
    : `- Software Engineering Intern (Summer 2025)\n- Developed core features, optimized queries, automated testing.`;

  return `${name}
Email: ${email} | Phone: ${phone} | Location: ${location}
LinkedIn: ${linkedin} | GitHub: ${github}

EDUCATION
${degree} in ${branch} (${gradYear})
${univ} | CGPA: ${cgpa}

EXPERIENCE & INTERNSHIPS
${experience}

PROJECTS
${projects}

SKILLS
${skillsList}

CERTIFICATIONS
${certs}
`;
}

// ─── Score colour helper ──────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 75) return '#34d399';
  if (score >= 60) return '#60a5fa';
  if (score >= 40) return '#fbbf24';
  return '#f43f5e';
}

// ─── Score arc SVG ────────────────────────────────────────────────────────────
function ScoreArc({ score }) {
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = scoreColor(score);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="70" y="68" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: color, fontSize: '28px', fontWeight: 800 }}>
        {score}
      </text>
      <text x="70" y="90" textAnchor="middle"
        style={{ fill: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
        / 100
      </text>
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function Bar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
        <span>{label}</span>
        <span style={{ color: color || '#60a5fa', fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: '6px', borderRadius: '4px',
        background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color || '#60a5fa',
          borderRadius: '4px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Collapsible({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', color: 'var(--text-primary)', padding: 0,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
          {icon} {title}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div style={{ marginTop: '0.75rem' }}>{children}</div>}
    </div>
  );
}

// ─── Keyword chip ─────────────────────────────────────────────────────────────
function Chip({ label, variant = 'neutral' }) {
  const colors = {
    green:  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#34d399' },
    red:    { bg: 'rgba(244,63,94,0.15)',  border: 'rgba(244,63,94,0.4)',  text: '#f87171' },
    amber:  { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' },
    blue:   { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: '#60a5fa' },
    purple: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', text: '#a78bfa' },
    neutral:{ bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', text: 'var(--text-secondary)' },
  };
  const c = colors[variant] || colors.neutral;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: '6px', padding: '0.2rem 0.55rem',
      fontSize: '0.75rem', fontWeight: 600, display: 'inline-block',
      margin: '0.2rem 0.2rem 0 0',
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ResumeAnalyzer({ activeStudent }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [resumeText,      setResumeText]      = useState('');
  const [targetRole,      setTargetRole]       = useState('Data Scientist');
  const [jobDescription,  setJobDescription]   = useState('');
  const [showJD,          setShowJD]           = useState(false);
  const [analysis,        setAnalysis]         = useState(null);
  const [loading,         setLoading]          = useState(false);
  const [uploading,       setUploading]        = useState(false);
  const [profileData,     setProfileData]      = useState(null);
  const [serviceError,    setServiceError]     = useState(null);

  // ── Trigger analysis ────────────────────────────────────────────────────────
  const triggerAnalysis = async (text, role, jd) => {
    if (!text || text.trim().length < 20) {
      if (text && text.trim().length > 0) {
        toast.error('Resume text is too short (minimum 20 characters required).');
      }
      return;
    }
    setLoading(true);
    setServiceError(null);
    try {
      const res = await axios.post('/api/analyze-resume', {
        resumeText:     text,
        targetRole:     role || targetRole || '',
        jobDescription: jd   || jobDescription || '',
      });
      if (res.data?.success) {
        setAnalysis(res.data);
      }
    } catch (err) {
      if (err.response?.data?.serviceUnavailable) {
        setServiceError('ATS analysis service is offline. Please start the Python engine.');
      } else {
        toast.error(err.response?.data?.message || 'Analysis failed');
      }
      console.error('[ResumeAnalyzer] error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Load profile on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/resume/my-resume');
        const p = res.data?.studentProfile;
        if (p) setProfileData(p);

        const role = p?.careerGoal || p?.targetRole || activeStudent?.careerGoal || 'Data Scientist';
        setTargetRole(role);

        if (res.data?.extractedText && res.data.extractedText.trim().length > 40) {
          setResumeText(res.data.extractedText);
          triggerAnalysis(res.data.extractedText, role, '');
          return;
        }
        if (p && (p.fullName || p.skills?.length)) {
          const txt = buildResumeFromProfile(p, user);
          setResumeText(txt);
          triggerAnalysis(txt, role, '');
        }
      } catch {
        const txt = buildResumeFromProfile(activeStudent || user, user);
        setResumeText(txt);
        triggerAnalysis(txt, targetRole, '');
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAnalyze = (e) => {
    if (e) e.preventDefault();
    triggerAnalysis(resumeText, targetRole, jobDescription);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        setResumeText(text);
        toast.success(`Loaded ${file.name}`);
        triggerAnalysis(text, targetRole, jobDescription);
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      const res = await axios.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.extractedText?.trim().length > 30) {
        setResumeText(res.data.extractedText);
        toast.success(`Extracted text from ${file.name}`);
        triggerAnalysis(res.data.extractedText, targetRole, jobDescription);
      } else {
        toast.success(`Uploaded ${file.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExtractFromProfile = () => {
    const txt = buildResumeFromProfile(profileData || activeStudent || user, user);
    setResumeText(txt);
    const role = profileData?.careerGoal || targetRole;
    setTargetRole(role);
    toast.success('Extracted from your profile!');
    triggerAnalysis(txt, role, jobDescription);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  const a = analysis;
  const kw = a?.keywordAnalysis || {};
  const bd = a?.breakdown || {};
  const weights = { keywordMatch: 40, sections: 15, experience: 15, projects: 10, contact: 5, achievements: 5, readability: 5, educationCertifications: 5 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(217,70,239,0.12) 100%)',
        border: '1px solid rgba(99,102,241,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-indigo">ATS-Style Compatibility Analyzer</span>
          <span className="badge badge-emerald">Job-Description Aware</span>
          {a && (
            <span className="badge" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              ⚠ Not a real company ATS — Simulated score only
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          Resume <span className="gradient-text">ATS Compatibility</span> Analyzer
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '700px', marginTop: '0.25rem' }}>
          Paste your resume, enter a target role and optionally a job description.
          The engine compares your resume against real job requirements — required vs preferred skills.
        </p>
      </div>

      {/* ── Input + Results grid ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Input panel */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="#d946ef" /> Resume Input
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload}
                accept=".pdf,.txt,.docx" style={{ display: 'none' }} />
              <button type="button" className="btn-secondary" disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: '0.73rem', padding: '0.3rem 0.7rem' }}>
                <FileUp size={12} color="#38bdf8" />
                {uploading ? 'Extracting…' : 'Upload File'}
              </button>
              <button type="button" className="btn-secondary"
                onClick={handleExtractFromProfile}
                style={{ fontSize: '0.73rem', padding: '0.3rem 0.7rem' }}>
                <UserCheck size={12} color="#34d399" /> From Profile
              </button>
            </div>
          </div>

          <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Target role */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                TARGET JOB ROLE
              </label>
              <input type="text" value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Data Scientist, Software Engineer" required />
            </div>

            {/* Job description toggle */}
            <div>
              <button type="button"
                onClick={() => setShowJD(!showJD)}
                style={{
                  background: 'none', border: '1px dashed rgba(99,102,241,0.4)',
                  color: '#818cf8', borderRadius: '8px', padding: '0.4rem 0.8rem',
                  cursor: 'pointer', fontSize: '0.78rem', width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}>
                <Target size={13} />
                {showJD ? 'Hide' : '+ Add'} Job Description (for more accurate keyword matching)
              </button>
              {showJD && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                    JOB DESCRIPTION (paste full JD for best results)
                  </label>
                  <textarea rows={8} value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here… Required skills, preferred skills, responsibilities, etc."
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', lineHeight: 1.5 }} />
                  {jobDescription && (
                    <p style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: '0.25rem' }}>
                      ✓ JD provided — keyword matching will use actual JD skills
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resume text */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                RESUME TEXT
              </label>
              <textarea rows={14} value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here…"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.5 }}
                required />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ justifyContent: 'center' }}>
              {loading ? <Zap size={16} className="spin" /> : <Sparkles size={16} />}
              {loading ? 'Analyzing…' : 'Run ATS Compatibility Analysis'}
            </button>
          </form>
        </div>

        {/* Right: Results panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {serviceError && (
            <div className="glass-card" style={{
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
              textAlign: 'center', padding: '1.5rem',
            }}>
              <AlertTriangle size={32} color="#f43f5e" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: '#f43f5e', fontWeight: 600 }}>{serviceError}</p>
            </div>
          )}

          {!a && !serviceError && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
              <Shield size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>
                Fill in your resume and target role, then click <strong>Run ATS Compatibility Analysis</strong>.
              </p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Add a Job Description for the most accurate keyword matching.
              </p>
            </div>
          )}

          {a && (
            <>
              {/* Score card */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(30,27,75,0.7) 100%)',
                border: `1px solid ${scoreColor(a.atsScore)}44`,
                textAlign: 'center', padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <ScoreArc score={a.atsScore} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: scoreColor(a.atsScore) }}>
                  {a.scoreCategory}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {a.disclaimer || 'ATS-Style score — not a real company ATS'}
                </div>
                {a.keywordSource && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`badge ${a.keywordSource === 'job_description' ? 'badge-emerald' : a.keywordSource === 'role_knowledge_base' ? 'badge-indigo' : 'badge-amber'}`}
                      style={{ fontSize: '0.72rem' }}>
                      {a.keywordSource === 'job_description'   ? '✓ Matched against actual Job Description'
                        : a.keywordSource === 'role_knowledge_base' ? '⚡ Matched using role knowledge base'
                        : '⚠ No role/JD — general quality only'}
                    </span>
                  </div>
                )}
              </div>

              {/* Actionable Improvement Plan (Points to Change) — shown prominently if resume is bad/suboptimal */}
              {(a.isBadResume || a.atsScore < 65 || a.actionableImprovements?.pointsToChange?.length > 0) && (
                <div className="glass-card" style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.08) 100%)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={18} color="#f87171" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>
                      Points to Change (Actionable Improvement Plan)
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Your ATS score is currently {a.atsScore}/100 ({a.scoreCategory}). Follow these exact points to optimize your resume for applicant tracking systems:
                  </p>

                  {/* Diagnostic: What lowered the score */}
                  {a.actionableImprovements?.criticalIssues?.length > 0 && (
                    <div style={{ marginBottom: '0.85rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Diagnostic: What Is Lowering Your Score
                      </p>
                      <ul style={{ paddingLeft: '1.1rem', fontSize: '0.78rem', color: '#fda4af', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {a.actionableImprovements.criticalIssues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Step by step fixes */}
                  {a.actionableImprovements?.pointsToChange?.length > 0 && (
                    <div style={{ marginBottom: '0.85rem' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                        Exact Points to Fix & Rewrite
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {a.actionableImprovements.pointsToChange.map((pt, idx) => (
                          <div key={idx} style={{
                            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                            background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.65rem', borderRadius: '6px',
                            borderLeft: '3px solid #fbbf24'
                          }}>
                            <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#fbbf24' }}>{idx + 1}.</span>
                            <span style={{ fontSize: '0.78rem', color: '#f3f4f6', lineHeight: 1.4 }}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Before / After Example */}
                  {a.actionableImprovements?.exampleTemplate && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', border: '1px dashed rgba(255,255,255,0.15)' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Bullet Point Rewrite Example
                      </p>
                      <p style={{ fontSize: '0.74rem', color: '#f87171', marginBottom: '0.25rem' }}>
                        <strong>✗ Weak:</strong> "{a.actionableImprovements.exampleTemplate.before}"
                      </p>
                      <p style={{ fontSize: '0.74rem', color: '#34d399' }}>
                        <strong>✓ ATS-Optimized:</strong> "{a.actionableImprovements.exampleTemplate.after}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Score breakdown */}
              <div className="glass-card">
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={15} color="#60a5fa" /> Score Breakdown
                </h4>
                <Bar label="Keyword / Skill Match"    value={bd.keywordMatch ?? 0}              max={weights.keywordMatch}          color="#818cf8" />
                <Bar label="Resume Structure"         value={bd.sections ?? 0}                  max={weights.sections}              color="#60a5fa" />
                <Bar label="Experience Relevance"     value={bd.experience ?? 0}                max={weights.experience}            color="#34d399" />
                <Bar label="Projects / Evidence"      value={bd.projects ?? 0}                  max={weights.projects}              color="#a78bfa" />
                <Bar label="Contact / Profiles"       value={bd.contact ?? 0}                   max={weights.contact}               color="#f472b6" />
                <Bar label="Achievements"             value={bd.achievements ?? 0}              max={weights.achievements}          color="#fb923c" />
                <Bar label="Readability / Safety"     value={bd.readability ?? 0}               max={weights.readability}           color="#22d3ee" />
                <Bar label="Education / Certs"        value={bd.educationCertifications ?? 0}   max={weights.educationCertifications} color="#fbbf24" />
              </div>

              {/* Keyword analysis */}
              {kw.source !== 'none' && (
                <div className="glass-card">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Target size={15} color="#818cf8" /> Keyword / Skill Match
                  </h4>

                  {/* Match % bars */}
                  {kw.requiredMatchPercentage != null && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                      {[
                        { label: 'Required Skills', pct: kw.requiredMatchPercentage,  color: '#34d399' },
                        { label: 'Preferred Skills', pct: kw.preferredMatchPercentage ?? 0, color: '#60a5fa' },
                      ].map(({ label, pct, color }) => (
                        <div key={label} style={{
                          background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                          padding: '0.65rem', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{pct}%</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                          <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', marginTop: '0.4rem' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {kw.matchedRequired?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>
                        ✓ REQUIRED SKILLS MATCHED ({kw.matchedRequired.length})
                      </p>
                      <div>{kw.matchedRequired.map((k, i) => <Chip key={i} label={k} variant="green" />)}</div>
                    </div>
                  )}
                  {kw.matchedPreferred?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>
                        ✓ PREFERRED SKILLS MATCHED ({kw.matchedPreferred.length})
                      </p>
                      <div>{kw.matchedPreferred.map((k, i) => <Chip key={i} label={k} variant="blue" />)}</div>
                    </div>
                  )}
                  {kw.missingRequired?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.73rem', color: '#f87171', fontWeight: 600, marginBottom: '0.3rem' }}>
                        ✗ REQUIRED SKILLS MISSING ({kw.missingRequired.length})
                      </p>
                      <div>{kw.missingRequired.map((k, i) => <Chip key={i} label={k} variant="red" />)}</div>
                    </div>
                  )}
                  {kw.missingPreferred?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.73rem', color: '#fbbf24', fontWeight: 600, marginBottom: '0.3rem' }}>
                        ~ PREFERRED SKILLS MISSING ({kw.missingPreferred.length})
                      </p>
                      <div>{kw.missingPreferred.map((k, i) => <Chip key={i} label={k} variant="amber" />)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Detected Skills */}
              {a.detectedSkills?.length > 0 && (
                <Collapsible title={`Detected Skills (${a.detectedSkills.length})`}
                  icon={<Award size={15} color="#a78bfa" />}>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {a.detectedSkills.map((s, i) => (
                      <Chip key={i}
                        label={`${s.name} ${s.evidence === 'high' ? '★★' : s.evidence === 'medium' ? '★' : ''}`}
                        variant={s.evidence === 'high' ? 'purple' : s.evidence === 'medium' ? 'blue' : 'neutral'}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    ★★ found in skills section + elsewhere | ★ found in multiple sections
                  </p>
                </Collapsible>
              )}

              {/* Resume Sections */}
              <Collapsible title="Resume Sections" icon={<CheckCircle2 size={15} color="#34d399" />} defaultOpen>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.4rem' }}>
                  {a.sections && Object.entries(a.sections).map(([sec, present]) => (
                    <div key={sec} style={{
                      background: present ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.08)',
                      border: `1px solid ${present ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.25)'}`,
                      borderRadius: '8px', padding: '0.35rem 0.5rem',
                      fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                      color: present ? '#34d399' : '#f87171', textTransform: 'capitalize',
                    }}>
                      {present ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {sec}
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Contact */}
              <Collapsible title="Contact Information" icon={<Info size={15} color="#60a5fa" />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.4rem' }}>
                  {a.contact && Object.entries(a.contact).map(([field, present]) => (
                    <div key={field} style={{
                      background: present ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${present ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', padding: '0.35rem 0.6rem',
                      fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                      color: present ? '#34d399' : 'var(--text-muted)', textTransform: 'capitalize',
                    }}>
                      {present ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {field}
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Achievements */}
              <Collapsible title="Achievements & Action" icon={<TrendingUp size={15} color="#fb923c" />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'Action Verbs', value: a.achievements?.actionVerbCount ?? 0, color: '#fb923c' },
                    { label: 'Quantified Metrics', value: a.achievements?.quantifiedAchievementCount ?? 0, color: '#34d399' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                      padding: '0.65rem', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Note: Dates, phone numbers, and years are excluded from quantified metrics.
                </p>
              </Collapsible>

              {/* Recommendations */}
              {a.recommendations?.length > 0 && (
                <Collapsible title={`Recommendations (${a.recommendations.length})`}
                  icon={<AlertTriangle size={15} color="#fbbf24" />} defaultOpen>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.82rem',
                    color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {a.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem',
                    fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem' }}>
                    ⚠ Only add skills you genuinely possess. Never fabricate experience, metrics, or certifications.
                  </p>
                </Collapsible>
              )}

              {/* Strengths */}
              {a.strengths?.length > 0 && (
                <Collapsible title="Strengths" icon={<Award size={15} color="#34d399" />}>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.82rem',
                    color: '#34d399', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {a.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                  </ul>
                </Collapsible>
              )}

              {/* Limitations */}
              {a.limitations?.length > 0 && (
                <Collapsible title="Analyzer Limitations" icon={<Info size={15} color="var(--text-muted)" />}>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.78rem',
                    color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {a.limitations.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
