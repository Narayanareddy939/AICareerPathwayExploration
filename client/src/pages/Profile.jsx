import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Book, Code, MapPin, Target, Save, Upload, Camera, Edit2, CheckCircle } from 'lucide-react';

const BRANCHES = ['CSE','IT','ECE','EEE','Mechanical','Civil','Chemical','MBA','MCA','Data Science','AI & ML','Other'];
const DEGREES = ['B.Tech','B.E.','B.Sc','BCA','MCA','M.Tech','MBA','Ph.D','Other'];
const CAREER_GOALS = ['Software Engineer','Full Stack Developer','Data Scientist','Data Analyst','Machine Learning Engineer','DevOps Engineer','Cloud Engineer','Frontend Developer','Backend Developer','Product Manager','Cybersecurity Engineer','Mobile Developer','AI/ML Researcher'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','Graduated'];
const SKILL_OPTIONS = ['Python','JavaScript','React','Node.js','Java','C++','SQL','Machine Learning','Docker','AWS','TypeScript','Git','Django','Flask','MongoDB','PostgreSQL','TensorFlow','PyTorch','Data Structures','System Design','CSS','HTML','Kubernetes','Redux','Vue.js','Angular','Spring Boot','Go','Rust','Scala'];
const INTEREST_OPTIONS = ['Web Development','Data Science','Machine Learning','AI','Cloud Computing','Cybersecurity','Mobile Development','DevOps','Blockchain','Embedded Systems','Research','Product Management','UI/UX Design'];
const LOCATIONS = ['Bangalore','Hyderabad','Mumbai','Delhi/NCR','Chennai','Pune','Kolkata','Ahmedabad','Anywhere in India','USA','Europe','Remote'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/profile');
      const p = res.data.student || {};
      setProfile(p);
      setForm({
        fullName: p.fullName || user?.fullName || '',
        email: p.email || user?.email || '',
        phone: p.phone || '',
        branch: p.branch || '',
        degree: p.degree || '',
        yearOfStudy: p.yearOfStudy || '',
        university: p.university || '',
        cgpa: p.cgpa || '',
        careerGoal: p.careerGoal || '',
        skills: p.skills || [],
        interests: p.interests || p.domains || [],
        preferredLocation: p.preferredLocation || '',
        linkedinUrl: p.linkedinUrl || '',
        githubUrl: p.githubUrl || '',
        bio: p.bio || '',
      });
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const toggleSkill = (skill) => {
    const current = form.skills || [];
    if (current.includes(skill)) {
      handleChange('skills', current.filter(s => s !== skill));
    } else if (current.length < 20) {
      handleChange('skills', [...current, skill]);
    }
  };

  const toggleInterest = (interest) => {
    const current = form.interests || [];
    if (current.includes(interest)) {
      handleChange('interests', current.filter(i => i !== interest));
    } else {
      handleChange('interests', [...current, interest]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/student/profile', form);
      toast.success('Profile updated successfully!');
      setEditing(false);
      await loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
      </div>
    );
  }

  const completionFields = ['branch', 'cgpa', 'careerGoal', 'skills', 'interests', 'preferredLocation', 'university'];
  const filled = completionFields.filter(f => {
    const val = profile?.[f];
    return val && (Array.isArray(val) ? val.length > 0 : val !== '');
  }).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0 }}>
              {(profile?.fullName || user?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{profile?.fullName || user?.fullName || 'Student'}</h1>
              <p style={{ color: '#818cf8', fontSize: '0.9rem' }}>{profile?.branch} • {profile?.university || 'University'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <div style={{ height: '5px', width: '130px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completion}%`, background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: '3px', transition: 'width 0.8s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>{completion}% complete</span>
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className={editing ? 'btn-secondary' : 'btn-primary'} style={{ fontSize: '0.88rem' }}>
            <Edit2 size={15} /> {editing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </motion.div>

      {/* Basic Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={16} color="#818cf8" /> Personal Information
        </h3>
        <div className="grid-2">
          {[
            { label: 'Full Name', field: 'fullName', icon: User },
            { label: 'Email', field: 'email', icon: Mail, disabled: true },
            { label: 'Phone', field: 'phone', icon: Phone },
            { label: 'LinkedIn', field: 'linkedinUrl', icon: null, placeholder: 'linkedin.com/in/username' },
            { label: 'GitHub', field: 'githubUrl', icon: null, placeholder: 'github.com/username' },
          ].map(({ label, field, icon: Icon, disabled, placeholder }) => (
            <div key={field}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>{label}</label>
              {editing && !disabled ? (
                <input type="text" value={form[field] || ''} onChange={e => handleChange(field, e.target.value)}
                  placeholder={placeholder || label} style={{ fontSize: '0.9rem' }} />
              ) : (
                <p style={{ fontSize: '0.92rem', color: form[field] ? '#e2e8f0' : 'var(--text-dim)', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  {form[field] || '—'}
                </p>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Bio / About</label>
            <textarea value={form.bio || ''} onChange={e => handleChange('bio', e.target.value)} rows={3}
              placeholder="Brief description about yourself, goals, and achievements" style={{ fontSize: '0.9rem', resize: 'vertical' }} />
          </div>
        )}
      </motion.div>

      {/* Academic Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Book size={16} color="#22d3ee" /> Academic Information
        </h3>
        <div className="grid-2">
          {[
            { label: 'University/College', field: 'university' },
            { label: 'Degree', field: 'degree', options: DEGREES },
            { label: 'Branch/Major', field: 'branch', options: BRANCHES },
            { label: 'Year of Study', field: 'yearOfStudy', options: YEARS },
            { label: 'CGPA', field: 'cgpa', type: 'number', min: '0', max: '10', step: '0.01' },
          ].map(({ label, field, options, type, min, max, step }) => (
            <div key={field}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>{label}</label>
              {editing ? (
                options ? (
                  <select value={form[field] || ''} onChange={e => handleChange(field, e.target.value)} style={{ fontSize: '0.9rem' }}>
                    <option value="">Select {label}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={type || 'text'} value={form[field] || ''} onChange={e => handleChange(field, e.target.value)}
                    placeholder={label} min={min} max={max} step={step} style={{ fontSize: '0.9rem' }} />
                )
              ) : (
                <p style={{ fontSize: '0.92rem', color: form[field] ? '#e2e8f0' : 'var(--text-dim)', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  {form[field] || '—'}
                </p>
              )}
            </div>
          ))}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Career Goal</label>
            {editing ? (
              <select value={form.careerGoal || ''} onChange={e => handleChange('careerGoal', e.target.value)} style={{ fontSize: '0.9rem' }}>
                <option value="">Select Target Career</option>
                {CAREER_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <p style={{ fontSize: '0.92rem', color: form.careerGoal ? '#818cf8' : 'var(--text-dim)', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: form.careerGoal ? 700 : 400 }}>
                {form.careerGoal || '—'}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code size={16} color="#f59e0b" /> Technical Skills
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({(form.skills || []).length}/20 selected)</span>
        </h3>
        {editing && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Click to toggle. Max 20 skills.</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {SKILL_OPTIONS.map(skill => {
            const isSelected = (form.skills || []).includes(skill);
            return (
              <button key={skill} onClick={editing ? () => toggleSkill(skill) : undefined}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600,
                  cursor: editing ? 'pointer' : 'default', border: 'none',
                  background: isSelected ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
                  color: isSelected ? '#fbbf24' : 'var(--text-muted)',
                  outline: isSelected ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}>
                {isSelected && <CheckCircle size={11} style={{ display: 'inline', marginRight: '0.3rem' }} />}
                {skill}
              </button>
            );
          })}
        </div>
        {editing && (
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Add custom skill:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" id="custom-skill" placeholder="e.g. Rust, Kafka, Figma" style={{ fontSize: '0.88rem' }} />
              <button onClick={() => {
                const input = document.getElementById('custom-skill');
                const val = input?.value?.trim();
                if (val && !(form.skills || []).includes(val)) {
                  handleChange('skills', [...(form.skills || []), val]);
                  input.value = '';
                }
              }} className="btn-secondary" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Interests + Location */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card">
        <div className="grid-2">
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={16} color="#d946ef" /> Interests
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {INTEREST_OPTIONS.map(interest => {
                const isSelected = (form.interests || []).includes(interest);
                return (
                  <button key={interest} onClick={editing ? () => toggleInterest(interest) : undefined}
                    style={{
                      padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                      cursor: editing ? 'pointer' : 'default', border: 'none',
                      background: isSelected ? 'rgba(217,70,239,0.15)' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#e879f9' : 'var(--text-muted)',
                      outline: isSelected ? '1px solid rgba(217,70,239,0.4)' : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}>
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#22d3ee" /> Preferred Location
            </h3>
            {editing ? (
              <select value={form.preferredLocation || ''} onChange={e => handleChange('preferredLocation', e.target.value)} style={{ fontSize: '0.9rem' }}>
                <option value="">Select Location</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <p style={{ fontSize: '0.92rem', color: form.preferredLocation ? '#22d3ee' : 'var(--text-dim)', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                {form.preferredLocation || '—'}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
            {saving ? <><div className="loading-ring" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Saving...</> : <><Save size={16} /> Save Profile Changes</>}
          </button>
        </motion.div>
      )}
    </div>
  );
}
