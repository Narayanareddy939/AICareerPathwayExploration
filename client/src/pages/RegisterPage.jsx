import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Building2, Globe, MapPin, Phone, Briefcase, FileText, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Role Tab: 'student' | 'recruiter'
  const [roleTab, setRoleTab] = useState('student');

  // Common & Student Form state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Recruiter & Company Form state
  const [recruiterForm, setRecruiterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    industry: 'Technology & Software',
    description: '',
    officialWebsite: '',
    location: '',
    contactPhone: ''
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStudent = () => {
    const errs = {};
    if (!studentForm.fullName.trim()) errs.fullName = 'Full name is required';
    if (!studentForm.email.match(/^\S+@\S+\.\S+$/)) errs.email = 'Valid email required';
    if (studentForm.password.length < 8) errs.password = 'Minimum 8 characters required';
    if (studentForm.password !== studentForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const validateRecruiter = () => {
    const errs = {};
    if (!recruiterForm.fullName.trim()) errs.fullName = 'Recruiter name is required';
    if (!recruiterForm.email.match(/^\S+@\S+\.\S+$/)) errs.email = 'Valid work email required';
    if (recruiterForm.password.length < 8) errs.password = 'Minimum 8 characters required';
    if (recruiterForm.password !== recruiterForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!recruiterForm.companyName.trim()) errs.companyName = 'Company name is required';
    if (!recruiterForm.description.trim()) errs.description = 'Short company description is required';
    if (!recruiterForm.location.trim()) errs.location = 'Company headquarters/location is required';
    return errs;
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStudent();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', studentForm);
      toast.success(res.data.message || 'Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecruiterSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRecruiter();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/company-register', recruiterForm);
      const { token, user, company } = res.data;
      login(token, { ...user, company });
      toast.success(res.data.message || 'Company registration submitted! Welcome to your recruiter portal.');
      navigate('/company/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Company registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentPw = roleTab === 'student' ? studentForm.password : recruiterForm.password;
  const strength = currentPw.length >= 12 ? 'Strong' : currentPw.length >= 8 ? 'Medium' : currentPw.length > 0 ? 'Weak' : '';
  const strengthColor = strength === 'Strong' ? '#10b981' : strength === 'Medium' ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: roleTab === 'recruiter' ? '620px' : '480px', transition: 'max-width 0.3s ease' }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg,#6366f1,#d946ef)', padding: '0.6rem 1.2rem', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <BrainCircuit size={24} color="#fff" />
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>AI Carrier</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
            {roleTab === 'student' ? 'Student Registration' : 'Company & Recruiter Portal'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {roleTab === 'student'
              ? 'Create your account to discover career paths, jobs, and mentorship'
              : 'Register your organization, post official job openings, and manage student talent'}
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          background: 'rgba(255,255,255,0.04)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => { setRoleTab('student'); setErrors({}); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: roleTab === 'student' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
              color: roleTab === 'student' ? '#fff' : 'var(--text-muted)',
              boxShadow: roleTab === 'student' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            <User size={16} /> Student
          </button>
          <button
            type="button"
            onClick={() => { setRoleTab('recruiter'); setErrors({}); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: roleTab === 'recruiter' ? 'linear-gradient(135deg,#d946ef,#9333ea)' : 'transparent',
              color: roleTab === 'recruiter' ? '#fff' : 'var(--text-muted)',
              boxShadow: roleTab === 'recruiter' ? '0 4px 12px rgba(217,70,239,0.3)' : 'none'
            }}
          >
            <Building2 size={16} /> Company / Recruiter
          </button>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          {roleTab === 'student' ? (
            /* STUDENT REGISTRATION FORM */
            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Aarav Sharma"
                    value={studentForm.fullName}
                    onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    style={{ paddingLeft: '2.5rem', borderColor: errors.fullName ? '#f43f5e' : undefined }}
                    required
                  />
                </div>
                {errors.fullName && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.fullName}</p>}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>EMAIL ADDRESS</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    placeholder="aarav@university.edu"
                    value={studentForm.email}
                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                    style={{ paddingLeft: '2.5rem', borderColor: errors.email ? '#f43f5e' : undefined }}
                    required
                  />
                </div>
                {errors.email && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={studentForm.password}
                    onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', borderColor: errors.password ? '#f43f5e' : undefined }}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {strength && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: strength === 'Strong' ? '100%' : strength === 'Medium' ? '60%' : '30%', height: '100%', background: strengthColor, transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: strengthColor, fontWeight: 700 }}>{strength}</span>
                  </div>
                )}
                {errors.password && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>CONFIRM PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={studentForm.confirmPassword}
                    onChange={e => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                    style={{ paddingLeft: '2.5rem', borderColor: errors.confirmPassword ? '#f43f5e' : undefined }}
                    required
                  />
                </div>
                {errors.confirmPassword && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                {loading ? 'Creating student account...' : <>Create Student Account <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            /* RECRUITER & COMPANY REGISTRATION FORM */
            <form onSubmit={handleRecruiterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(217,70,239,0.08)', borderRadius: '10px', border: '1px solid rgba(217,70,239,0.25)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <ShieldAlert size={18} color="#d946ef" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                  <strong>Company Verification Policy:</strong> Newly registered companies enter a <em>Pending Review</em> status. Once verified by an administrator, your job postings will be publicly featured for candidates.
                </p>
              </div>

              {/* Recruiter Details Sub-section */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#d946ef', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  1. Recruiter / Account Representative
                </p>

                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>YOUR NAME *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        value={recruiterForm.fullName}
                        onChange={e => setRecruiterForm({ ...recruiterForm, fullName: e.target.value })}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                        required
                      />
                    </div>
                    {errors.fullName && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.fullName}</p>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>WORK EMAIL *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="email"
                        placeholder="priya@company.com"
                        value={recruiterForm.email}
                        onChange={e => setRecruiterForm({ ...recruiterForm, email: e.target.value })}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                        required
                      />
                    </div>
                    {errors.email && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.email}</p>}
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PASSWORD (MIN 8 CHARS) *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={recruiterForm.password}
                        onChange={e => setRecruiterForm({ ...recruiterForm, password: e.target.value })}
                        style={{ paddingLeft: '2.2rem', paddingRight: '2.2rem', fontSize: '0.88rem' }}
                        required
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.password}</p>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CONFIRM PASSWORD *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={recruiterForm.confirmPassword}
                        onChange={e => setRecruiterForm({ ...recruiterForm, confirmPassword: e.target.value })}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                        required
                      />
                    </div>
                    {errors.confirmPassword && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Company Details Sub-section */}
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#d946ef', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  2. Organization / Employer Profile
                </p>

                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>COMPANY NAME *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Infosys, Razorpay, NexaTech"
                        value={recruiterForm.companyName}
                        onChange={e => setRecruiterForm({ ...recruiterForm, companyName: e.target.value })}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                        required
                      />
                    </div>
                    {errors.companyName && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.companyName}</p>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>INDUSTRY</label>
                    <select
                      value={recruiterForm.industry}
                      onChange={e => setRecruiterForm({ ...recruiterForm, industry: e.target.value })}
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="Technology & Software">Technology & Software</option>
                      <option value="Artificial Intelligence & Data">Artificial Intelligence & Data</option>
                      <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                      <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                      <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                      <option value="Telecommunications & Cloud">Telecommunications & Cloud</option>
                      <option value="Manufacturing & Automotive">Manufacturing & Automotive</option>
                      <option value="Consulting & Analytics">Consulting & Analytics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>COMPANY DESCRIPTION *</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe what your company does, products, and culture..."
                    value={recruiterForm.description}
                    onChange={e => setRecruiterForm({ ...recruiterForm, description: e.target.value })}
                    style={{ fontSize: '0.88rem' }}
                    required
                  />
                  {errors.description && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.description}</p>}
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>HEADQUARTERS / LOCATION *</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru, India"
                        value={recruiterForm.location}
                        onChange={e => setRecruiterForm({ ...recruiterForm, location: e.target.value })}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                        required
                      />
                    </div>
                    {errors.location && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.location}</p>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>OFFICIAL WEBSITE (OPTIONAL)</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="url"
                        placeholder="https://company.com"
                        value={recruiterForm.officialWebsite}
                        onChange={e => setRecruiterForm({ ...recruiterForm, officialWebsite: e.target.value })}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CONTACT PHONE NUMBER (OPTIONAL)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={recruiterForm.contactPhone}
                      onChange={e => setRecruiterForm({ ...recruiterForm, contactPhone: e.target.value })}
                      style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg,#d946ef,#7c3aed)'
                }}
              >
                {loading ? 'Registering company...' : <>Register Company & Launch Dashboard <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Sign In Link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
