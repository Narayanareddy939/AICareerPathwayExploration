import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BrainCircuit, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      const { token, user } = res.data;
      login(token, user);
      toast.success(`Welcome back, ${user.fullName}!`);
      // Redirect based on profile completion
      if (!user.profileCompleted) {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg,#6366f1,#d946ef)', padding: '0.6rem 1.2rem', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <BrainCircuit size={24} color="#fff" />
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>AI Carrier</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to your career dashboard</p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', marginTop: '0.25rem' }}>
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ textAlign: 'center', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            or
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Demo login hint */}
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.25rem' }}>💡 Demo Mode</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Register first, then login. MongoDB required for authentication.</p>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            New here?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
