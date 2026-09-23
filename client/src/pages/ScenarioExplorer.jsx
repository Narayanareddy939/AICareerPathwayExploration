import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import {
  Shuffle, Target, TrendingUp, AlertCircle, Users, Briefcase,
  BookOpen, ChevronDown, Plus, Trash2, RefreshCw, Zap
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#d946ef'];

function ScenarioCard({ scenario, color, onRemove, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}
      style={{
        background: `linear-gradient(135deg,${color}15 0%,rgba(17,24,39,0.9) 100%)`,
        border: `1px solid ${color}40`,
        borderRadius: '16px',
        padding: '1.5rem',
        position: 'relative',
      }}>
      {onRemove && (
        <button onClick={onRemove} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '0.25rem' }}>
          <Trash2 size={14} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Scenario {index + 1}</span>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>{scenario.career}</h3>

      {/* Match Score Ring */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{scenario.matchScore || scenario.scores?.skillMatch || 0}%</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Match Score</p>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fb7185', lineHeight: 1 }}>{scenario.skillGapPercentage || 0}%</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Skill Gap</p>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>{scenario.jobMarketInsights?.jobCount || scenario.jobCount || 0}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Jobs</p>
        </div>
      </div>

      {/* Skill Gap Bar */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
          <span>Skill Match</span>
          <span style={{ color }}>{100 - (scenario.skillGapPercentage || 0)}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div animate={{ width: `${100 - (scenario.skillGapPercentage || 0)}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ height: '100%', background: color, borderRadius: '3px' }} />
        </div>
      </div>

      {/* Missing Skills Preview */}
      {scenario.missingSkills?.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>TOP SKILLS NEEDED:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {scenario.missingSkills.slice(0, 4).map((s, i) => (
              <span key={i} className="badge badge-amber" style={{ fontSize: '0.7rem' }}>+ {s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Expand */}
      <button onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', width: '100%', padding: '0.4rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
        <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        {expanded ? 'Less' : 'More Details'}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '0.75rem' }}>
          {scenario.jobMarketInsights?.demandLevel && (
            <p style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Market Demand: </strong>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{scenario.jobMarketInsights.demandLevel}</span>
            </p>
          )}
          {scenario.similarAlumni?.length > 0 && (
            <p style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Similar Alumni: </strong>
              <span style={{ color: '#818cf8' }}>{scenario.similarAlumni.length} found</span>
            </p>
          )}
          {scenario.reasons?.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>WHY THIS CAREER:</p>
              {scenario.reasons.map((r, i) => (
                <p key={i} style={{ fontSize: '0.78rem', color: '#d1d5db', marginBottom: '0.2rem' }}>• {r}</p>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ScenarioExplorer() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newCareer, setNewCareer] = useState('');

  const CAREER_OPTIONS = [
    'Software Engineer', 'Full Stack Developer', 'Data Scientist', 'Data Analyst',
    'Machine Learning Engineer', 'DevOps Engineer', 'Cloud Engineer', 'Frontend Developer',
    'Backend Developer', 'Data Engineer', 'Product Manager', 'Cybersecurity Engineer',
  ];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/profile');
      const p = res.data.student;
      setProfile(p);
      await generateScenarios(p);
    } catch (err) {
      console.error('Scenario load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateScenarios = async (p) => {
    setGenerating(true);
    try {
      const res = await axios.post('/api/ai/scenarios', {
        skills: p?.skills || [],
        branch: p?.branch || 'CSE',
        cgpa: p?.cgpa || 7.5,
        careerGoal: p?.careerGoal,
        interests: p?.interests || [],
        preferredLocation: p?.preferredLocation,
      });
      setScenarios(res.data.scenarios || res.data.recommendations || []);
    } catch (err) {
      // Fallback: use recommendation endpoint
      try {
        const recRes = await axios.get('/api/ai/recommend');
        const r = recRes.data.recommendation;
        if (r) {
          setScenarios([{ career: r.predictedRole || 'Software Engineer', matchScore: r.careerMatchScore, missingSkills: r.missingSkills, skillGapPercentage: 30, jobCount: 50 }]);
        }
      } catch {}
    } finally {
      setGenerating(false);
    }
  };

  const addScenario = async () => {
    if (!newCareer || scenarios.some(s => s.career === newCareer)) return;
    setGenerating(true);
    try {
      const res = await axios.post('/api/ai/skill-gap', {
        career: newCareer,
        skills: profile?.skills || [],
      });
      const gap = res.data.gapAnalysis || res.data;
      const newScenario = {
        career: newCareer,
        matchScore: gap.skillMatchPercentage || 0,
        skillGapPercentage: gap.skillGapPercentage || 0,
        missingSkills: gap.criticalMissing || [],
        reasons: [`Based on your ${profile?.skills?.length || 0} current skills`],
      };
      setScenarios(prev => [...prev, newScenario].slice(0, 4));
      setNewCareer('');
    } catch (err) {
      console.error('Add scenario error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const removeScenario = (idx) => setScenarios(prev => prev.filter((_, i) => i !== idx));

  const compareData = scenarios.map(s => ({
    name: s.career?.split(' ').slice(0, 2).join(' '),
    'Skill Match': s.matchScore || s.scores?.skillMatch || 0,
    'Job Count': Math.min(s.jobMarketInsights?.jobCount || s.jobCount || 0, 100),
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Building career scenarios...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(217,70,239,0.12) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(217,70,239,0.25)' }}>
        <span className="badge" style={{ background: 'rgba(217,70,239,0.15)', color: '#e879f9', border: '1px solid rgba(217,70,239,0.3)', marginBottom: '0.5rem' }}>
          Career Scenario Explorer
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
          Compare Career <span className="gradient-text">Scenarios</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Explore up to 4 career paths side-by-side with real skill gap and market analysis
        </p>
      </motion.div>

      {/* Add Scenario */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={newCareer} onChange={e => setNewCareer(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
            <option value="">+ Add Career to Compare</option>
            {CAREER_OPTIONS.filter(c => !scenarios.some(s => s.career === c)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={addScenario} className="btn-primary" disabled={!newCareer || generating || scenarios.length >= 4}
            style={{ fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
            {generating ? <RefreshCw size={15} className="spin" /> : <Plus size={15} />}
            {generating ? 'Analyzing...' : 'Add Scenario'}
          </button>
          <button onClick={() => generateScenarios(profile)} className="btn-secondary"
            disabled={generating} style={{ fontSize: '0.88rem' }}>
            <Zap size={15} /> Auto-Generate
          </button>
        </div>
        {scenarios.length >= 4 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Maximum 4 scenarios. Remove one to add another.
          </p>
        )}
      </motion.div>

      {/* Scenario Cards */}
      {scenarios.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(scenarios.length, 2)}, 1fr)`, gap: '1.25rem' }}>
            {scenarios.map((s, i) => (
              <ScenarioCard key={i} scenario={s} color={COLORS[i]} index={i}
                onRemove={scenarios.length > 1 ? () => removeScenario(i) : null} />
            ))}
          </div>

          {/* Comparison Chart */}
          {scenarios.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart size={17} color="#818cf8" /> Side-by-Side Comparison
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={compareData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="Skill Match" radius={[4, 4, 0, 0]}>
                    {compareData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Shuffle size={48} color="#818cf8" style={{ margin: '0 auto 1rem' }} />
          <h3>No scenarios yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Click "Auto-Generate" to see career scenarios based on your profile, or add careers manually above.
          </p>
        </div>
      )}
    </div>
  );
}
