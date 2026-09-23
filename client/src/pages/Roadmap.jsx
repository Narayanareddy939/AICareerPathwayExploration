import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle, Circle, ChevronRight, Clock, Target,
  Zap, Award, RefreshCw, ExternalLink, Layers
} from 'lucide-react';

const PHASE_COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b'];

export default function RoadmapPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(15);
  const [completedPhases, setCompletedPhases] = useState(() => {
    try { return JSON.parse(localStorage.getItem('roadmap_completed') || '{}'); } catch { return {}; }
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/profile');
      const p = res.data.student;
      setProfile(p);
      await generateRoadmap(p?.careerGoal || 'Software Engineer', p?.skills || [], weeklyHours);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (career, skills, hours) => {
    setGenerating(true);
    try {
      const res = await axios.post('/api/ai/roadmap', {
        career: career || profile?.careerGoal || 'Software Engineer',
        skills: skills || profile?.skills || [],
        weeklyHours: hours,
      });
      setRoadmap(res.data.roadmap || res.data);
    } catch (err) {
      // Fallback to legacy endpoint
      try {
        const res = await axios.post('/api/roadmap', {
          targetRole: career || profile?.careerGoal,
          currentSkills: skills || profile?.skills,
        });
        setRoadmap({ phases: res.data.milestones, career: res.data.targetRole, totalWeeks: 24 });
      } catch {}
    } finally {
      setGenerating(false);
    }
  };

  const togglePhaseComplete = (idx) => {
    const updated = { ...completedPhases, [idx]: !completedPhases[idx] };
    setCompletedPhases(updated);
    localStorage.setItem('roadmap_completed', JSON.stringify(updated));
  };

  const completedCount = Object.values(completedPhases).filter(Boolean).length;
  const phases = roadmap?.phases || [];
  const progress = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Generating your personalized roadmap...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.12) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(6,182,212,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>Personalized Learning Plan</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Your Career <span className="gradient-text">Roadmap</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Phase-by-phase learning plan for <strong style={{ color: '#22d3ee' }}>{roadmap?.career || profile?.careerGoal || 'your career'}</strong>
              {roadmap?.totalWeeks && ` • ${roadmap.totalWeeks} weeks total`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hours/week:</label>
              <select value={weeklyHours} onChange={e => setWeeklyHours(Number(e.target.value))}
                style={{ width: '70px', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}>
                {[5, 10, 15, 20, 25, 30].map(h => <option key={h} value={h}>{h}h</option>)}
              </select>
            </div>
            <button className="btn-secondary" onClick={() => generateRoadmap(profile?.careerGoal, profile?.skills, weeklyHours)}
              disabled={generating} style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={15} className={generating ? 'spin' : ''} />
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      {phases.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '1.25rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Overall Progress</span>
            <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700 }}>{progress}% Complete</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
              style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: '9999px' }} />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {completedCount} of {phases.length} phases completed
          </p>
        </motion.div>
      )}

      {/* Skills To Learn Summary */}
      {roadmap?.skillsToLearn?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color="#818cf8" /> Skills in Your Roadmap
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {roadmap.skillsToLearn.map((s, i) => (
              <span key={i} className="skill-chip">{s}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Roadmap Phases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {phases.map((phase, idx) => {
          const color = PHASE_COLORS[idx % PHASE_COLORS.length];
          const isComplete = completedPhases[idx];
          const skills = phase.skills || phase.skillsToLearn || [];
          const courses = phase.courses || [];
          const projects = phase.projects || [];

          return (
            <motion.div key={idx} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              style={{
                background: isComplete ? 'rgba(16,185,129,0.06)' : 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderLeft: `4px solid ${isComplete ? '#10b981' : color}`,
                borderRadius: '14px',
                padding: '1.5rem',
                transition: 'all 0.3s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {phase.phase || `Phase ${idx + 1}`}
                    </span>
                    {phase.duration && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {phase.duration}
                      </span>
                    )}
                    {isComplete && <span className="badge badge-emerald">✓ Completed</span>}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {phase.title || phase.phase}
                  </h3>
                  {phase.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {phase.description}
                    </p>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Skills to Learn:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {skills.map((s, si) => (
                          <span key={si} className="skill-chip" style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Courses */}
                  {courses.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        <BookOpen size={11} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        Recommended:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {courses.map((c, ci) => (
                          <a key={ci} href={c.url || '#'} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: '8px', padding: '0.5rem 0.85rem', textDecoration: 'none',
                            }}>
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{c.title || c.recommendedCourse}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.provider} {c.duration && `• ${c.duration}`}</p>
                            </div>
                            <ExternalLink size={13} color="#22d3ee" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Build This:
                      </p>
                      {projects.map((p, pi) => (
                        <div key={pi} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>🚀 {p.title}</p>
                          {p.skills && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Skills: {p.skills?.join(', ')}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Milestones */}
                  {phase.milestones?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Milestones:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {phase.milestones.map((m, mi) => (
                          <p key={mi} style={{ fontSize: '0.82rem', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ChevronRight size={13} color={color} /> {m}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Complete toggle */}
                <button onClick={() => togglePhaseComplete(idx)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
                    color: isComplete ? '#34d399' : 'var(--text-dim)', transition: 'all 0.2s',
                  }}
                  title={isComplete ? 'Mark incomplete' : 'Mark complete'}>
                  {isComplete ? <CheckCircle size={26} /> : <Circle size={26} />}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {phases.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <BookOpen size={48} color="#818cf8" style={{ margin: '0 auto 1rem' }} />
          <h3>No roadmap generated yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Complete your profile to get a personalized roadmap</p>
          <Link to="/complete-profile" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '1rem' }}>
            Complete Profile
          </Link>
        </div>
      )}
    </div>
  );
}
