import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  BrainCircuit, Mail, Lock, User, Eye, EyeOff, ArrowRight
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();

  // Student Form state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  const currentPw = studentForm.password;
  const strength = currentPw.length >= 12 ? 'Strong' : currentPw.length >= 8 ? 'Medium' : currentPw.length > 0 ? 'Weak' : '';
  const strengthColor = strength === 'Strong' ? '#10b981' : strength === 'Medium' ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '480px' }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg,#6366f1,#d946ef)', padding: '0.6rem 1.2rem', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <BrainCircuit size={24} color="#fff" />
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>AI Carrier</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Create Student Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Start your personalized AI career trajectory today
          </p>
        </div>

        {/* Content Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          {/* STUDENT REGISTRATION FORM */}
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
                  placeholder="Min. 8 characters"
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
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: strength === 'Strong' ? '100%' : strength === 'Medium' ? '60%' : '30%', height: '100%', background: strengthColor, transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strengthColor, fontWeight: 700 }}>{strength}</span>
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
                  placeholder="Confirm your password"
                  value={studentForm.confirmPassword}
                  onChange={e => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                  style={{ paddingLeft: '2.5rem', borderColor: errors.confirmPassword ? '#f43f5e' : undefined }}
                  required
                />
              </div>
              {errors.confirmPassword && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.8rem' }}
            >
              {loading ? <span className="loading-ring" style={{ width: '18px', height: '18px' }} /> : <><span>Create Student Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Footer Navigation */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              Sign In here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
