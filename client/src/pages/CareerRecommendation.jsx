import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Zap, TrendingUp, Users, Award, BarChart2, Target, RefreshCw,
  CheckCircle2, AlertCircle, Briefcase, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#d946ef', '#06b6d4', '#fb7185'];

function RecommendationCard({ rec, index, expanded, onToggle }) {
  const matchColor = rec.matchScore >= 75 ? '#34d399' : rec.matchScore >= 55 ? '#818cf8' : '#fbbf24';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      style={{
        background: index === 0 ? 'linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(16,185,129,0.08) 100%)' : 'var(--bg-card)',
        border: `1px solid ${index === 0 ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '16px', padding: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
      {index === 0 && (
        <div style={{ position: 'absolute', top: '0.75rem', right: '1rem' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
            <Star size={10} /> Best Match
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
              {index + 1}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{rec.career}</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
              {rec.confidence?.toUpperCase() || 'MEDIUM'} confidence
            </span>
            {rec.jobMarketInsights?.demandLevel && (
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                {rec.jobMarketInsights.demandLevel} Demand
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2.8rem', fontWeight: 800, color: matchColor, lineHeight: 1 }}>{rec.matchScore}%</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Match Score</p>
        </div>
      </div>

      {/* Score Breakdown */}
      {rec.scores && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {[
            { label: 'Skill', val: rec.scores.skillMatch, color: '#818cf8' },
            { label: 'Interest', val: rec.scores.interestMatch, color: '#10b981' },
            { label: 'Academic', val: rec.scores.academicMatch, color: '#f59e0b' },
            { label: 'Job Mkt', val: rec.scores.jobMarket, color: '#06b6d4' },
            { label: 'Alumni', val: rec.scores.alumniSimilarity, color: '#d946ef' },
            { label: 'Location', val: rec.scores.locationMatch, color: '#fb7185' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.4rem 0.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{s.label}</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color }}>{s.val}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Matched + Missing */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {rec.matchedSkills?.length > 0 && (
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '0.25rem' }} /> Have ({rec.matchedSkills.length})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {rec.matchedSkills.slice(0, 5).map((s, i) => (
                <span key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {rec.missingSkills?.length > 0 && (
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              <AlertCircle size={11} style={{ display: 'inline', marginRight: '0.25rem' }} /> Need ({rec.missingSkills.length})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {rec.missingSkills.slice(0, 5).map((s, i) => (
                <span key={i} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem' }}>+ {s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expand button */}
      <button onClick={onToggle}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', width: '100%', padding: '0.4rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Less Details' : 'Evidence & Reasons'}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '0.75rem' }}>
          {rec.reasons?.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Why This Career:</p>
              {rec.reasons.map((r, i) => (
                <p key={i} style={{ fontSize: '0.82rem', color: '#d1d5db', marginBottom: '0.25rem' }}>• {r}</p>
              ))}
            </div>
          )}
          {rec.similarAlumni?.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Similar Alumni:</p>
              {rec.similarAlumni.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.3rem' }}>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</p>
                    <p style={{ fontSize: '0.72rem', color: '#818cf8' }}>{a.currentRole} @ {a.currentCompany}</p>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>{a.similarity}%</span>
                </div>
              ))}
            </div>
          )}
          {rec.jobMarketInsights && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Job Market Evidence:</p>
              <p style={{ fontSize: '0.82rem', color: '#d1d5db' }}>
                {rec.jobMarketInsights.jobCount} jobs found in dataset • {rec.jobMarketInsights.demandLevel} demand
                {rec.jobMarketInsights.topCompanies?.length > 0 && ` • Top: ${rec.jobMarketInsights.topCompanies.join(', ')}`}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CareerRecommendation() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, recRes] = await Promise.allSettled([
        axios.get('/api/student/profile'),
        axios.get('/api/ai/recommendations'),
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.student);
      if (recRes.status === 'fulfilled') {
        setRecommendations(recRes.value.data.recommendations || recRes.value.data.topCareers || []);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateFull = async () => {
    setGenerating(true);
    try {
      const res = await axios.post('/api/ai/recommendations/generate', {
        force: true,
        skills: profile?.skills,
        branch: profile?.branch,
        cgpa: profile?.cgpa,
        careerGoal: profile?.careerGoal,
        interests: profile?.interests,
        preferredLocation: profile?.preferredLocation,
      });
      setRecommendations(res.data.recommendations || res.data.topCareers || []);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const scoreData = recommendations.slice(0, 6).map(r => ({
    name: r.career?.split(' ').slice(0, 2).join(' '),
    score: Math.round(Number(r.matchScore || r.overallScore || 0)),
  })).filter(s => s.score > 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading career recommendations...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '0.5rem' }}>AI-Powered</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Career <span className="gradient-text">Recommendations</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Ranked by hybrid scoring: skills + interests + academic + job market + alumni + location
            </p>
          </div>
          <button onClick={generateFull} className="btn-primary" disabled={generating}>
            {generating ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
            {generating ? 'Analyzing...' : 'Full AI Analysis'}
          </button>
        </div>
      </motion.div>

      {/* Profile Summary */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card"
          style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch</span><p style={{ fontWeight: 700 }}>{profile.branch || '—'}</p></div>
            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CGPA</span><p style={{ fontWeight: 700, color: '#34d399' }}>{profile.cgpa || '—'}</p></div>
            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target</span><p style={{ fontWeight: 700 }}>{profile.careerGoal || '—'}</p></div>
            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skills</span><p style={{ fontWeight: 700, color: '#818cf8' }}>{profile.skills?.length || 0} listed</p></div>
            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</span><p style={{ fontWeight: 700 }}>{profile.preferredLocation || '—'}</p></div>
          </div>
        </motion.div>
      )}

      {/* Score Comparison Chart */}
      {scoreData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={17} color="#818cf8" /> Career Match Scores
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                formatter={val => [`${val}%`, 'Match Score']} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {scoreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} index={i} expanded={!!expanded[i]} onToggle={() => toggleExpand(i)} />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Zap size={48} color="#818cf8" style={{ margin: '0 auto 1rem' }} />
          <h3>No Recommendations Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Complete your profile and click "Full AI Analysis" to get personalized career recommendations.
          </p>
          <button onClick={generateFull} className="btn-primary" style={{ marginTop: '1.25rem' }} disabled={generating}>
            <Zap size={16} /> {generating ? 'Analyzing...' : 'Generate Recommendations'}
          </button>
        </div>
      )}

      {/* Methodology Note */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: '#22d3ee' }}>Scoring methodology:</strong> Recommendations ranked by hybrid algorithm:
          30% skill match + 20% interest alignment + 15% academic fit + 15% job market demand + 10% alumni similarity + 10% location match.
          Scores are deterministic — AI (Gemini) provides explanations only, not rankings.
        </p>
      </div>
    </div>
  );
}
