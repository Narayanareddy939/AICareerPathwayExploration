import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Target, AlertCircle, CheckCircle2, BookOpen, TrendingUp,
  BarChart2, Zap, Award, RefreshCw, Info, Filter
} from 'lucide-react';

const PRIORITY_COLORS = {
  critical: { bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.35)', text: '#fb7185', badge: 'badge-rose' },
  high: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#fbbf24', badge: 'badge-amber' },
  medium: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8', badge: 'badge-indigo' },
  low: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', text: '#34d399', badge: 'badge-emerald' },
};

export default function SkillGapPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedSkill, setExpandedSkill] = useState(null);

  const CAREERS = [
    'Software Engineer', 'Full Stack Developer', 'Data Scientist', 'Data Analyst',
    'Machine Learning Engineer', 'DevOps Engineer', 'Cloud Engineer', 'Frontend Developer',
    'Backend Developer', 'Data Engineer', 'Cybersecurity Engineer', 'Mobile Developer',
    'Product Manager', 'AI/ML Researcher',
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/profile');
      const p = res.data?.student;
      setProfile(p);
      const career = p?.careerGoal || 'Full Stack Developer';
      setSelectedCareer(career);
      await analyzeGap(career, p?.skills || []);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeGap = async (career, skills) => {
    if (!career) return;
    setAnalyzing(true);
    try {
      const res = await axios.post('/api/ai/skill-gap', {
        career,
        skills: skills || profile?.skills || [],
      });
      setGapData(res.data.gapAnalysis || res.data);
    } catch (err) {
      // Fallback: construct basic gap from recommendation endpoint
      try {
        const rec = await axios.get('/api/ai/recommend');
        const r = rec.data.recommendation;
        if (r) {
          setGapData({
            career,
            matchedSkills: r.matchedSkills || [],
            missingSkills: (r.missingSkills || []).map((s, i) => ({
              skill: s, priority: i < 2 ? 'critical' : i < 4 ? 'high' : 'medium', courses: []
            })),
            skillMatchPercentage: r.scores?.skillMatch || 70,
            skillGapPercentage: 100 - (r.scores?.skillMatch || 70),
          });
        }
      } catch {}
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const handleCareerChange = async (career) => {
    setSelectedCareer(career);
    await analyzeGap(career, profile?.skills || []);
  };

  const filteredSkills = gapData?.missingSkills?.filter(s => {
    if (activeFilter === 'all') return true;
    return s.priority === activeFilter;
  }) || [];

  const priorityCounts = gapData?.missingSkills?.reduce((acc, s) => {
    acc[s.priority] = (acc[s.priority] || 0) + 1;
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Analyzing skill gaps...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(244,63,94,0.12) 0%,rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(244,63,94,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-rose" style={{ marginBottom: '0.5rem' }}>Skill Gap Analysis</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Your <span className="gradient-text">Skill Gap</span> Analysis
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Identify exactly what skills you need to land your target career
            </p>
          </div>
          <button onClick={() => analyzeGap(selectedCareer, profile?.skills)} className="btn-secondary"
            disabled={analyzing} style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={15} className={analyzing ? 'spin' : ''} />
            {analyzing ? 'Analyzing...' : 'Re-Analyze'}
          </button>
        </div>
      </motion.div>

      {/* Career Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <Target size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            Target Career:
          </label>
          <select value={selectedCareer} onChange={e => handleCareerChange(e.target.value)}
            style={{ maxWidth: '300px', fontSize: '0.9rem' }}>
            {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', margin: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your skills:</span>
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((sk, i) => (
                <span key={i} className="skill-chip" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{sk}</span>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                Not set — <Link to="/complete-profile" style={{ color: '#818cf8', textDecoration: 'underline' }}>Update Profile</Link>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      {gapData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid-4">
          {[
            { label: 'Skill Match', value: `${gapData.skillMatchPercentage || 0}%`, color: '#34d399', sub: 'Skills you have' },
            { label: 'Skill Gap', value: `${gapData.skillGapPercentage || 0}%`, color: '#fb7185', sub: 'Skills needed' },
            { label: 'Matched Skills', value: gapData.matchedSkills?.length || 0, color: '#818cf8', sub: 'Already have' },
            { label: 'Skills to Learn', value: gapData.missingSkills?.length || 0, color: '#fbbf24', sub: 'Need to acquire' },
          ].map((kpi, i) => (
            <div key={i} className="glass-card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{kpi.label}</p>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.sub}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Matched Skills */}
      {gapData?.matchedSkills?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
            <CheckCircle2 size={18} /> Skills You Already Have
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {gapData.matchedSkills.map((s, i) => (
              <span key={i} style={{
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}>
                <CheckCircle2 size={12} /> {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Missing Skills with Filters */}
      {gapData?.missingSkills?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185' }}>
              <AlertCircle size={18} /> Skills to Acquire for {selectedCareer}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)', marginTop: '4px' }} />
              {['all', 'critical', 'high', 'medium', 'low'].map(filter => (
                <button key={filter} onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', border: 'none',
                    background: activeFilter === filter ? PRIORITY_COLORS[filter]?.bg || 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === filter ? PRIORITY_COLORS[filter]?.text || '#818cf8' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && priorityCounts[filter] ? ` (${priorityCounts[filter]})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AnimatePresence>
              {filteredSkills.map((item, idx) => {
                const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
                const isExpanded = expandedSkill === idx;
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setExpandedSkill(isExpanded ? null : idx)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={16} color={colors.text} />
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.skill}</span>
                        <span className={`badge ${colors.badge}`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          {item.priority}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isExpanded ? '▲ Hide courses' : '▼ View courses'}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && item.courses?.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '0.75rem' }}>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <BookOpen size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                            Recommended Courses:
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {item.courses.map((c, ci) => (
                              <a key={ci} href={c.url || '#'} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem 0.9rem',
                                  textDecoration: 'none', transition: 'background 0.2s',
                                }}>
                                <div>
                                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{c.title}</p>
                                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.provider} • {c.duration}</p>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#22d3ee' }}>→ Open</span>
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {gapData && gapData.missingSkills?.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={48} color="#34d399" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#34d399' }}>🎉 You have all required skills for {selectedCareer}!</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Focus on building projects and interview preparation to land the role.
          </p>
        </div>
      )}
    </div>
  );
}
