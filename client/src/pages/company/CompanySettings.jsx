import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings, User, Building2, ShieldCheck, Mail,
  Lock, AlertCircle, ArrowRight, CheckCircle2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import companyService from '../../services/companyService';

export default function CompanySettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyService.getProfile()
      .then(res => {
        if (res.success) setProfile(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isVerified = profile?.verificationStatus === 'officially_verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '900px', margin: '0 auto' }}>
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
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase' }}>
          Account Preferences
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.2rem 0', color: '#fff' }}>
          Company <span className="gradient-text">Settings</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Manage your recruiter credentials, company authorization, and data policies.
        </p>
      </motion.div>

      {/* Recruiter Details Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#d946ef" /> Recruiter Account Profile
        </h3>

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Representative Name</span>
            <p style={{ fontWeight: 800, margin: '2px 0 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {user?.fullName || 'Recruiter'}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Registered Work Email</span>
            <p style={{ fontWeight: 800, margin: '2px 0 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Role-Based Authentication: <strong>Authorized Recruiter</strong></span>
        </div>
      </div>

      {/* Linked Organization Profile Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#d946ef" /> Associated Organization
          </h3>
          <Link to="/company/profile" className="btn-secondary" style={{ fontSize: '0.78rem' }}>
            Edit Organization Details <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              {profile?.name || user?.company?.name || 'Company'}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '3px 0 0' }}>
              {profile?.industry || 'Technology'} • {profile?.headquarters || 'India'}
            </p>
          </div>

          <div>
            {isVerified ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#d1fae5', color: '#065f46', fontSize: '0.78rem', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
                <CheckCircle2 size={13} /> Officially Verified
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fef3c7', color: '#92400e', fontSize: '0.78rem', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
                <Clock size={13} /> Pending Verification
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recruitment Security & Compliance Policy */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>
          Data Privacy & Student Confidentiality Notice
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          Student applications, academic CGPA records, and uploaded resume documents are protected. Employers may only access data for candidates who voluntarily apply for their posted job openings. Sharing student contact details outside the hiring process is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
