import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BrainCircuit, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.match(/^\S+@\S+\.\S+$/)) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters required';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      toast.success(res.data.message || 'Account created! Please login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Check your connection.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length >= 12 ? 'Strong' : form.password.length >= 8 ? 'Medium' : form.password.length > 0 ? 'Weak' : '';
  const strengthColor = strength === 'Strong' ? '#10b981' : strength === 'Medium' ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '460px' }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg,#6366f1,#d946ef)', padding: '0.6rem 1.2rem', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <BrainCircuit size={24} color="#fff" />
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>AI Carrier</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start your AI-powered career journey</p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>FULL NAME</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Ananya Sharma"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  style={{ paddingLeft: '2.5rem', borderColor: errors.fullName ? '#f43f5e' : undefined }}
                />
              </div>
              {errors.fullName && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="ananya@university.edu"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ paddingLeft: '2.5rem', borderColor: errors.email ? '#f43f5e' : undefined }}
                />
              </div>
              {errors.email && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', borderColor: errors.password ? '#f43f5e' : undefined }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: '#1f293d' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: strengthColor, width: strength === 'Strong' ? '100%' : strength === 'Medium' ? '60%' : '30%', transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strengthColor, fontWeight: 600 }}>{strength}</span>
                </div>
              )}
              {errors.password && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  style={{ paddingLeft: '2.5rem', borderColor: errors.confirmPassword ? '#f43f5e' : (form.confirmPassword && form.password === form.confirmPassword ? '#10b981' : undefined) }}
                />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 size={16} color="#10b981" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </div>
              {errors.confirmPassword && <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontSize: '1rem' }}>
              {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={18} /></>}
            </button>

          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
