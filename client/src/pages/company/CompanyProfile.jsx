import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Globe, MapPin, Mail, Phone, Upload,
  CheckCircle2, AlertCircle, ShieldCheck, Clock,
  Save, Eye, Briefcase, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    industry: '',
    description: '',
    officialWebsite: '',
    careersUrl: '',
    headquarters: '',
    locations: [],
    contactEmail: '',
    contactPhone: '',
    logoUrl: null,
    verificationStatus: 'pending_review',
    status: 'active'
  });

  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await companyService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        if (Array.isArray(res.data.locations)) {
          setLocationInput(res.data.locations.join(', '));
        }
      }
    } catch (err) {
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (.png, .jpg, .webp)');
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await companyService.uploadLogo(file);
      if (res.success) {
        setProfile(prev => ({ ...prev, logoUrl: res.data.logoUrl }));
        toast.success('Company logo uploaded successfully!');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    setSaving(true);
    try {
      const locationsArr = locationInput
        .split(',')
        .map(l => l.trim())
        .filter(Boolean);

      const payload = {
        ...profile,
        locations: locationsArr
      };

      const res = await companyService.updateProfile(payload);
      if (res.success) {
        setProfile(res.data);
        toast.success('Company profile updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading company profile...</p>
      </div>
    );
  }

  const isVerified = profile.verificationStatus === 'officially_verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1100px', margin: '0 auto' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase' }}>
                Employer Identity & Branding
              </span>
              {isVerified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#d1fae5', color: '#065f46', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  <ShieldCheck size={12} /> Officially Verified
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  <Clock size={12} /> Pending Verification
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Company <span className="gradient-text">Profile</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Maintain your official branding, website credentials, and employer information for candidates.
            </p>
          </div>

          <button onClick={loadProfile} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Main Grid: Form + Live Candidate Preview */}
      <div className="grid-2" style={{ gap: '1.75rem', alignItems: 'start' }}>
        {/* Profile Edit Form */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Logo Upload Section */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                COMPANY LOGO
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  color: '#d946ef',
                  flexShrink: 0
                }}>
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    profile.name ? profile.name[0]?.toUpperCase() : <Building2 size={28} />
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(217,70,239,0.15)',
                      border: '1px solid rgba(217,70,239,0.3)',
                      color: '#d946ef',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={14} /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
                  </label>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '4px 0 0' }}>
                    PNG, JPG, or SVG. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                COMPANY NAME *
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>

            {/* Industry */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                INDUSTRY
              </label>
              <input
                type="text"
                value={profile.industry || ''}
                onChange={e => setProfile({ ...profile, industry: e.target.value })}
                placeholder="e.g. Technology & Cloud Computing, Financial Services"
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                COMPANY OVERVIEW / DESCRIPTION
              </label>
              <textarea
                rows={4}
                value={profile.description || ''}
                onChange={e => setProfile({ ...profile, description: e.target.value })}
                placeholder="Describe your organization, mission, products, and culture for prospective campus recruits..."
              />
            </div>

            {/* Headquarters & Locations */}
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  HEADQUARTERS
                </label>
                <input
                  type="text"
                  value={profile.headquarters || ''}
                  onChange={e => setProfile({ ...profile, headquarters: e.target.value })}
                  placeholder="e.g. Bengaluru, Karnataka"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  OPERATING LOCATIONS
                </label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  placeholder="e.g. Bengaluru, Hyderabad, Pune"
                />
              </div>
            </div>

            {/* Official Website & Careers URL */}
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  OFFICIAL WEBSITE
                </label>
                <input
                  type="url"
                  value={profile.officialWebsite || ''}
                  onChange={e => setProfile({ ...profile, officialWebsite: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  CAREERS PAGE URL
                </label>
                <input
                  type="url"
                  value={profile.careersUrl || ''}
                  onChange={e => setProfile({ ...profile, careersUrl: e.target.value })}
                  placeholder="https://careers.company.com"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  CONTACT EMAIL
                </label>
                <input
                  type="email"
                  value={profile.contactEmail || ''}
                  onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
                  placeholder="recruiting@company.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  CONTACT PHONE
                </label>
                <input
                  type="text"
                  value={profile.contactPhone || ''}
                  onChange={e => setProfile({ ...profile, contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{
                justifyContent: 'center',
                fontSize: '0.95rem',
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg,#d946ef,#7c3aed)'
              }}
            >
              <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Company Profile'}
            </button>
          </form>
        </div>

        {/* Live Candidate Preview Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
              <Eye size={13} /> Candidate Card Preview
            </span>

            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg,rgba(217,70,239,0.2),rgba(99,102,241,0.2))',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: '#d946ef',
                  overflow: 'hidden'
                }}>
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    profile.name ? profile.name[0]?.toUpperCase() : 'C'
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    {profile.name || 'Your Company Name'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                    {profile.industry || 'Industry'} • {profile.headquarters || 'Location'}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                {profile.description || 'Company description will appear here to prospective student applicants.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span>Verification: <strong>{profile.verificationStatus}</strong></span>
                {profile.officialWebsite && (
                  <a href={profile.officialWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                    Website <Globe size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Verification Helper Box */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#fff' }}>
              Why is Company Verification Important?
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
              AI Carrier ensures student safety by vetting registered employers. Verified organizations earn the official verification badge, boosting candidate application trust and placing your jobs at the top of recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
