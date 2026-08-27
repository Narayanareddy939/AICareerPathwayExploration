import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  User, GraduationCap, Code2, Heart, Target, FileUp,
  ChevronRight, ChevronLeft, Check, Upload, X
} from 'lucide-react';

const STEPS = ['Personal', 'Academic', 'Skills', 'Interests & Goals', 'Resume'];

const ALL_SKILLS = ['Java', 'Python', 'C++', 'SQL', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Machine Learning', 'Deep Learning', 'Data Analysis', 'Power BI', 'Tableau', 'Git', 'Docker', 'AWS', 'TypeScript', 'Spring Boot', 'Flutter', 'Kotlin'];
const ALL_INTERESTS = ['Artificial Intelligence', 'Data Science', 'Web Development', 'Cyber Security', 'Cloud Computing', 'DevOps', 'Mobile Development', 'Software Engineering', 'UI/UX', 'Game Development', 'Blockchain', 'IoT'];
const CAREER_GOALS = ['Software Engineer', 'Full Stack Developer', 'AI Engineer', 'Machine Learning Engineer', 'Data Scientist', 'Data Analyst', 'Backend Developer', 'Frontend Developer', 'DevOps Engineer', 'Cloud Engineer', 'Cyber Security Engineer', 'Product Manager'];
const LOCATIONS = ['Hyderabad', 'Bangalore', 'Chennai', 'Pune', 'Mumbai', 'Delhi', 'Ahmedabad', 'Remote', 'Open to Anywhere'];

export default function CompleteProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    university: '',
    branch: '',
    department: '',
    semester: '',
    graduationYear: '',
    cgpa: '',
    skills: [],
    interests: [],
    careerGoal: '',
    preferredLocation: []
  });

  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const res = await axios.get('/api/student/profile');
        if (res.data?.student) {
          const s = res.data.student;
          setForm(f => ({
            ...f,
            fullName: s.fullName || user?.fullName || '',
            email: s.email || user?.email || '',
            phone: s.phone || '',
            gender: s.gender || '',
            dateOfBirth: s.dateOfBirth ? String(s.dateOfBirth).split('T')[0] : '',
            address: s.address || '',
            university: s.university || '',
            branch: s.branch || '',
            department: s.department || '',
            semester: s.semester ? String(s.semester) : '',
            graduationYear: s.graduationYear ? String(s.graduationYear) : '',
            cgpa: s.cgpa ? String(s.cgpa) : '',
            skills: Array.isArray(s.skills) ? s.skills : [],
            interests: Array.isArray(s.interests) ? s.interests : [],
            careerGoal: s.careerGoal || '',
            preferredLocation: Array.isArray(s.preferredLocation) ? s.preferredLocation : []
          }));
        }
      } catch (err) {
        console.error('Failed to load existing profile:', err);
      }
    };
    fetchExistingProfile();
  }, [user]);

  const toggleSkill = (sk) => {
    setForm(f => ({ ...f, skills: f.skills.includes(sk) ? f.skills.filter(s => s !== sk) : [...f.skills, sk] }));
  };

  const toggleInterest = (it) => {
    setForm(f => ({ ...f, interests: f.interests.includes(it) ? f.interests.filter(i => i !== it) : [...f.interests, it] }));
  };

  const toggleLocation = (loc) => {
    setForm(f => ({ ...f, preferredLocation: f.preferredLocation.includes(loc) ? f.preferredLocation.filter(l => l !== loc) : [...f.preferredLocation, loc] }));
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !form.skills.includes(customSkill.trim())) {
      setForm(f => ({ ...f, skills: [...f.skills, customSkill.trim()] }));
      setCustomSkill('');
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Clean form object to omit empty fields and cast numeric values
      const payload = {};
      Object.keys(form).forEach(key => {
        if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
          payload[key] = form[key];
        }
      });
      if (payload.semester !== undefined) payload.semester = Number(payload.semester);
      if (payload.graduationYear !== undefined) payload.graduationYear = Number(payload.graduationYear);
      if (payload.cgpa !== undefined) payload.cgpa = Number(payload.cgpa);

      // Save profile
      const saveRes = await axios.post('/api/student/profile', payload);

      // Upload resume if selected
      if (resumeFile) {
        const fd = new FormData();
        fd.append('resume', resumeFile);
        await axios.post('/api/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      // Trigger AI recommendation
      toast.loading('Generating your AI career analysis...', { id: 'ai-rec' });
      try {
        await axios.post('/api/ai/recommend');
        toast.success('AI career analysis complete!', { id: 'ai-rec' });
      } catch {
        toast.dismiss('ai-rec');
      }

      updateUser({ profileCompleted: saveRes.data?.profileComplete ?? true });
      toast.success('Profile saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save profile';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
            Complete Your <span className="gradient-text">Student Profile</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            This helps our AI generate accurate career recommendations for you
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: i < step ? '#10b981' : i === step ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: i === step ? '2px solid #818cf8' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {i < step ? <Check size={14} color="#fff" /> : <span style={{ fontSize: '0.75rem', fontWeight: 700, color: i === step ? '#fff' : '#6b7280' }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: '0.65rem', color: i === step ? '#818cf8' : 'var(--text-muted)', fontWeight: i === step ? 700 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#d946ef)', borderRadius: '2px' }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >

              {/* ── STEP 0: Personal Info ── */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}><User size={20} color="#818cf8" /> Personal Information</h3>
                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>FULL NAME</label>
                      <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Ananya Sharma" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>EMAIL</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>PHONE NUMBER</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>GENDER</label>
                      <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                        <option value="">Select gender</option>
                        {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>DATE OF BIRTH</label>
                      <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>ADDRESS / CITY</label>
                      <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Hyderabad, Telangana" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Academic Info ── */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}><GraduationCap size={20} color="#34d399" /> Academic Information</h3>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>UNIVERSITY / COLLEGE</label>
                    <input type="text" value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} placeholder="JNTUH, VIT, NIT Warangal..." />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>BRANCH</label>
                      <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                        <option value="">Select branch</option>
                        {['Computer Science & Engineering', 'CSE (Data Science)', 'CSE (AI & ML)', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Data Science'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>DEPARTMENT</label>
                      <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="CSE, ECE, MECH..." />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>SEMESTER</label>
                      <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                        <option value="">Sem</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>GRAD YEAR</label>
                      <select value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })}>
                        <option value="">Year</option>
                        {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>CGPA</label>
                      <input type="number" step="0.1" min="4" max="10" value={form.cgpa} onChange={e => setForm({ ...form, cgpa: e.target.value })} placeholder="8.7" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Skills ── */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}><Code2 size={20} color="#f59e0b" /> Technical Skills</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.75rem' }}>Select all skills you know. The AI will find your gaps.</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ALL_SKILLS.map(sk => (
                      <button key={sk} type="button" onClick={() => toggleSkill(sk)} style={{
                        padding: '0.4rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                        background: form.skills.includes(sk) ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                        border: form.skills.includes(sk) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        color: form.skills.includes(sk) ? '#fff' : '#9ca3af'
                      }}>
                        {form.skills.includes(sk) && <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                        {sk}
                      </button>
                    ))}
                  </div>

                  {/* Custom skill */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Add custom skill (e.g. Rust, Solidity...)" value={customSkill} onChange={e => setCustomSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())} style={{ flex: 1 }} />
                    <button type="button" onClick={addCustomSkill} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add</button>
                  </div>

                  {form.skills.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>SELECTED ({form.skills.length})</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {form.skills.map(sk => (
                          <span key={sk} className="badge badge-emerald" style={{ cursor: 'pointer' }} onClick={() => toggleSkill(sk)}>
                            {sk} <X size={10} style={{ marginLeft: '4px' }} />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: Interests & Goals ── */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={20} color="#f43f5e" /> Interests & Career Goal</h3>

                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>AREAS OF INTEREST</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {ALL_INTERESTS.map(it => (
                        <button key={it} type="button" onClick={() => toggleInterest(it)} style={{
                          padding: '0.4rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                          background: form.interests.includes(it) ? 'rgba(217,70,239,0.2)' : 'rgba(255,255,255,0.05)',
                          border: form.interests.includes(it) ? '1px solid rgba(217,70,239,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          color: form.interests.includes(it) ? '#e879f9' : '#9ca3af'
                        }}>
                          {it}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>CAREER GOAL</label>
                    <select value={form.careerGoal} onChange={e => setForm({ ...form, careerGoal: e.target.value })}>
                      <option value="">Select your target role</option>
                      {CAREER_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>PREFERRED LOCATIONS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {LOCATIONS.map(loc => (
                        <button key={loc} type="button" onClick={() => toggleLocation(loc)} style={{
                          padding: '0.4rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                          background: form.preferredLocation.includes(loc) ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
                          border: form.preferredLocation.includes(loc) ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          color: form.preferredLocation.includes(loc) ? '#22d3ee' : '#9ca3af'
                        }}>
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Resume Upload ── */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileUp size={20} color="#818cf8" /> Upload Resume <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>Optional</span></h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.75rem' }}>PDF or DOCX, max 5MB. The AI will use it for ATS scoring.</p>

                  {/* Drop Zone */}
                  <label htmlFor="resume-upload" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    border: `2px dashed ${resumeFile ? '#10b981' : 'rgba(99,102,241,0.4)'}`,
                    borderRadius: '14px', padding: '2.5rem 1rem', cursor: 'pointer', transition: 'all 0.2s',
                    background: resumeFile ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)'
                  }}>
                    {resumeFile ? (
                      <>
                        <Check size={36} color="#10b981" />
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>{resumeFile.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(resumeFile.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); setResumeFile(null); }} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                          <X size={14} /> Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload size={36} color="#6366f1" />
                        <span style={{ color: '#d1d5db', fontWeight: 600, fontSize: '1rem' }}>Click or drag to upload</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>PDF or DOCX • Max 5MB</span>
                      </>
                    )}
                    <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" hidden onChange={e => setResumeFile(e.target.files[0] || null)} />
                  </label>

                  {/* Summary */}
                  <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem' }}>✅ Profile Summary</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem', color: '#d1d5db' }}>
                      <span>📛 Name: <strong style={{ color: '#fff' }}>{form.fullName || '—'}</strong></span>
                      <span>🎓 Branch: <strong style={{ color: '#fff' }}>{form.branch || '—'}</strong></span>
                      <span>📊 CGPA: <strong style={{ color: '#fff' }}>{form.cgpa || '—'}</strong></span>
                      <span>🎯 Goal: <strong style={{ color: '#fff' }}>{form.careerGoal || '—'}</strong></span>
                      <span>💡 Skills: <strong style={{ color: '#fff' }}>{form.skills.length} selected</strong></span>
                      <span>❤️ Interests: <strong style={{ color: '#fff' }}>{form.interests.length} selected</strong></span>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleBack} disabled={step === 0} className="btn-secondary" style={{ opacity: step === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={18} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={handleNext} className="btn-primary">
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary" disabled={loading} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                {loading ? 'Saving...' : <><Check size={18} /> Save & Go to Dashboard</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
