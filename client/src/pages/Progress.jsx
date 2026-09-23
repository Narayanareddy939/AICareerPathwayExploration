import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import {
  TrendingUp, CheckCircle, Circle, Target, Award, Calendar,
  BookOpen, Briefcase, Users, Zap, ArrowRight, Star
} from 'lucide-react';

export default function Progress() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persistent milestone tracking
  const [milestones, setMilestones] = useState(() => {
    try { return JSON.parse(localStorage.getItem('progress_milestones') || '[]'); } catch { return []; }
  });
  const [checkedItems, setCheckedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('progress_checked') || '{}'); } catch { return {}; }
  });

  const DEFAULT_MILESTONES = [
    { id: 'profile', title: 'Complete Profile', desc: 'Fill all profile fields including skills, interests, and career goal', category: 'profile', points: 20 },
    { id: 'resume', title: 'Upload Resume', desc: 'Upload your latest resume for AI analysis', category: 'profile', points: 15 },
    { id: 'recommendation', title: 'Get Career Recommendation', desc: 'Run AI career analysis and review results', category: 'career', points: 10 },
    { id: 'skill_gap', title: 'Review Skill Gap', desc: 'Identify and understand your skill gaps for target career', category: 'skills', points: 10 },
    { id: 'roadmap', title: 'Study Learning Roadmap', desc: 'Review your personalized learning roadmap', category: 'learning', points: 10 },
    { id: 'alumni', title: 'Connect with Alumni', desc: 'View and request mentorship from similar alumni', category: 'network', points: 15 },
    { id: 'course1', title: 'Start First Course', desc: 'Enroll in first recommended course from your roadmap', category: 'learning', points: 20 },
    { id: 'project1', title: 'Build First Project', desc: 'Complete and push a portfolio project to GitHub', category: 'projects', points: 25 },
    { id: 'resume_score', title: 'ATS Score > 70', desc: 'Improve resume ATS score above 70 using AI feedback', category: 'resume', points: 20 },
    { id: 'mock_interview', title: 'Complete Mock Interview', desc: 'Do a mock interview with AI assistant or mentor', category: 'placement', points: 20 },
    { id: 'apply', title: 'Apply to 5 Jobs', desc: 'Submit applications to at least 5 target companies', category: 'placement', points: 25 },
    { id: 'offer', title: 'Get Placement Offer', desc: 'Receive an internship or job offer — the goal!', category: 'placement', points: 50 },
  ];

  useEffect(() => {
    loadData();
    if (milestones.length === 0) {
      setMilestones(DEFAULT_MILESTONES);
      localStorage.setItem('progress_milestones', JSON.stringify(DEFAULT_MILESTONES));
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, recRes] = await Promise.allSettled([
        axios.get('/api/student/profile'),
        axios.get('/api/ai/recommend'),
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.student);
      if (recRes.status === 'fulfilled') setRecommendation(recRes.value.data.recommendation);
    } catch (err) {
      console.error('Progress load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = (id) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    localStorage.setItem('progress_checked', JSON.stringify(updated));
  };

  const completedCount = milestones.filter(m => checkedItems[m.id]).length;
  const totalPoints = milestones.reduce((acc, m) => checkedItems[m.id] ? acc + m.points : acc, 0);
  const maxPoints = milestones.reduce((acc, m) => acc + m.points, 0);
  const overallProgress = Math.round((completedCount / milestones.length) * 100);

  const readiness = recommendation?.placementReadiness || (profile ? Math.min(
    (profile.cgpa / 10 * 30) + (profile.skills?.length * 3) + (profile.resumePath ? 20 : 0), 90
  ) : 0);

  const categoryColors = {
    profile: '#6366f1', skills: '#f59e0b', learning: '#06b6d4',
    career: '#8b5cf6', network: '#10b981', projects: '#d946ef',
    resume: '#22d3ee', placement: '#34d399',
  };

  const radialData = [
    { name: 'Readiness', value: Math.round(readiness), fill: '#10b981' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading progress...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>Placement Journey</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
          Your Progress <span className="gradient-text">Tracker</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Track milestones on your path to placement
        </p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid-4">
        {[
          { label: 'Placement Readiness', value: `${Math.round(readiness)}%`, color: '#34d399', sub: recommendation ? 'AI-calculated' : 'Estimated' },
          { label: 'Milestones Done', value: `${completedCount}/${milestones.length}`, color: '#818cf8', sub: 'Self-tracked' },
          { label: 'Points Earned', value: `${totalPoints}/${maxPoints}`, color: '#fbbf24', sub: 'Achievement points' },
          { label: 'Skills Listed', value: profile?.skills?.length || 0, color: '#22d3ee', sub: 'In your profile' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            className="glass-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{kpi.label}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar + Radial */}
      <div className="grid-2">
        {/* Overall Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={17} color="#34d399" /> Overall Milestone Progress
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{overallProgress}%</div>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>Placement Journey</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{completedCount} of {milestones.length} milestones</p>
            </div>
          </div>
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
            <motion.div animate={{ width: `${overallProgress}%` }} transition={{ duration: 1 }}
              style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Just Started</span>
            <span style={{ fontSize: '0.72rem', color: '#34d399' }}>🎯 Placement Ready</span>
          </div>
        </motion.div>

        {/* Readiness Gauge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={17} color="#818cf8" /> Placement Readiness
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="60%" innerRadius="60%" outerRadius="85%" data={radialData}>
              <RadialBar startAngle={180} endAngle={0} background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={8} />
              <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="2.4rem" fontWeight="800">{Math.round(readiness)}%</text>
              <text x="50%" y="68%" textAnchor="middle" fill="#9ca3af" fontSize="0.75rem">Readiness</text>
            </RadialBarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.8rem', color: readiness >= 75 ? '#34d399' : readiness >= 50 ? '#fbbf24' : '#fb7185', fontWeight: 700 }}>
            {readiness >= 75 ? '✓ Campus Ready!' : readiness >= 50 ? 'Good Progress' : 'Keep Building'}
          </p>
        </motion.div>
      </div>

      {/* Milestones Checklist */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card">
        <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={17} color="#fbbf24" /> Placement Milestones
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {milestones.map((m, i) => {
            const isChecked = checkedItems[m.id];
            const catColor = categoryColors[m.category] || '#818cf8';
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => toggleMilestone(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: isChecked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isChecked ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '10px', padding: '0.85rem 1rem', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                <div style={{ flexShrink: 0 }}>
                  {isChecked ? <CheckCircle size={22} color="#34d399" /> : <Circle size={22} color="var(--text-dim)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: isChecked ? '#34d399' : '#fff', textDecoration: isChecked ? 'line-through' : 'none' }}>
                    {m.title}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.desc}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}33`, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>{m.category}</span>
                  <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.2rem' }}>+{m.points}pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid-3">
        {[
          { label: 'Update Profile', to: '/complete-profile', icon: Target, color: '#818cf8' },
          { label: 'View Roadmap', to: '/roadmap', icon: BookOpen, color: '#22d3ee' },
          { label: 'Browse Alumni', to: '/alumni', icon: Users, color: '#f59e0b' },
        ].map((link, i) => (
          <Link key={i} to={link.to} style={{ textDecoration: 'none' }}>
            <div className="glass-card glass-card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'center', justifyContent: 'center' }}>
              <link.icon size={20} color={link.color} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{link.label}</span>
              <ArrowRight size={15} color="var(--text-dim)" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
