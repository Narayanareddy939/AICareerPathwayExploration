import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp, AlertCircle, Zap, Award, BarChart2, Target, RefreshCw,
  BookOpen, Users, ArrowUpRight, FileText, Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentRes, recRes, analyticsRes] = await Promise.allSettled([
        axios.get('/api/student/profile'),
        axios.get('/api/ai/recommend'),
        axios.get('/api/analytics')
      ]);
      if (studentRes.status === 'fulfilled') setStudent(studentRes.value.data.student);
      if (recRes.status === 'fulfilled') setRecommendation(recRes.value.data.recommendation);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendation = async () => {
    setRecLoading(true);
    try {
      const res = await axios.post('/api/ai/recommend');
      setRecommendation(res.data.recommendation);
      toast.success('AI career analysis refreshed!');
    } catch (err) {
      toast.error('Could not generate recommendation. Complete your profile first.');
    } finally {
      setRecLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b'];

  const readinessData = recommendation ? [{ name: 'Readiness', value: recommendation.placementReadiness || 72, fill: '#10b981' }] : [];
  const matchData = recommendation ? [{ name: 'Match', value: recommendation.careerMatchScore || 75, fill: '#6366f1' }] : [];

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Zap size={40} color="#818cf8" style={{ animation: 'spin 1.5s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your AI Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(217,70,239,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          padding: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>AI Career Dashboard</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Welcome back, <span className="gradient-text">{user?.fullName?.split(' ')[0] || 'Student'}!</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {student ? `${student.branch} • CGPA ${student.cgpa} • Target: ${student.careerGoal}` : 'Complete your profile to unlock AI insights'}
            </p>
            {/* Profile completion bar */}
            {student && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ height: '6px', width: '180px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${student.profileCompletionPercent || 60}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: '3px' }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>{student.profileCompletionPercent || 60}% Profile Complete</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={generateRecommendation} className="btn-primary" disabled={recLoading}>
              <RefreshCw size={16} className={recLoading ? 'spin' : ''} />
              {recLoading ? 'Analyzing...' : 'Re-run AI Analysis'}
            </button>
            <Link to="/complete-profile" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              Update Profile
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats KPI Cards */}
      <div className="grid-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Career Match</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>{recommendation?.careerMatchScore || '—'}%</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{recommendation?.predictedRole || 'Run AI Analysis'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Placement Readiness</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{recommendation?.placementReadiness || '—'}%</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{recommendation?.placementReadiness >= 75 ? '✅ Campus Ready' : '📈 Keep Building'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Skill Gap</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{recommendation?.missingSkills?.length || '—'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{recommendation?.missingSkills?.[0] || 'Skills to learn'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Expected Package</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22d3ee', lineHeight: 1.2 }}>{recommendation?.predictedSalaryRange || '— LPA'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Based on alumni data</p>
        </motion.div>
      </div>

      {/* Main Grid: Recommendation + Domain Chart */}
      <div className="grid-2">

        {/* AI Recommendation Card */}
        {recommendation ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="#818cf8" /> AI Career Analysis
              </h3>
              <span className="badge badge-indigo">Latest</span>
            </div>

            {recommendation.geminiSummary && (
              <p style={{ fontSize: '0.88rem', color: '#d1d5db', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem', lineHeight: 1.6 }}>
                {recommendation.geminiSummary}
              </p>
            )}

            {/* Recommended Roles */}
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Recommended Roles</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(recommendation.recommendedRoles || []).map((r, i) => <span key={i} className="badge badge-indigo">{r}</span>)}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <p style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>⚠ Skill Gap</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(recommendation.missingSkills || []).map((s, i) => <span key={i} className="badge badge-amber">+ {s}</span>)}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Recommended Certifications</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(recommendation.certifications || []).map((c, i) => <span key={i} className="badge badge-emerald"><Award size={11} /> {c}</span>)}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem' }}>
            <Zap size={40} color="#818cf8" />
            <h3>No AI Analysis Yet</h3>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Complete your profile and click "Re-run AI Analysis" to get personalized career insights.</p>
            <button onClick={generateRecommendation} className="btn-primary" disabled={recLoading}>
              <Zap size={16} /> Generate AI Analysis
            </button>
          </div>
        )}

        {/* Domain Salary Chart */}
        {analytics && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="#34d399" /> Salary by Domain (LPA)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.domainStats?.slice(0, 6)} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="domain" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={val => [`${val} LPA`, 'Avg']} />
                <Bar dataKey="avgSalary" radius={[6, 6, 0, 0]}>
                  {analytics.domainStats?.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Roadmap + Matched Alumni */}
      <div className="grid-2">
        {/* Learning Roadmap Preview */}
        {recommendation?.roadmap && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="#22d3ee" /> Your Learning Roadmap
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recommendation.roadmap.map((phase, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderLeft: '3px solid #6366f1', borderRadius: '10px', padding: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{phase.phase}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{phase.duration}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{phase.title}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                    {(phase.skillsToLearn || []).map((s, j) => <span key={j} className="skill-chip">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Alumni */}
        {recommendation?.matchedAlumni && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#f59e0b" /> Matched Alumni Mentors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recommendation.matchedAlumni.slice(0, 4).map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{a.name}</p>
                    <p style={{ fontSize: '0.78rem', color: '#818cf8' }}>{a.role} @ {a.company}</p>
                  </div>
                  <span className="badge badge-emerald">{a.similarity}%</span>
                </div>
              ))}
              <Link to="/alumni" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                  <Users size={15} /> Browse All Alumni
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Resume Status */}
      {student && (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: student.resumePath ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', padding: '0.65rem', borderRadius: '10px' }}>
              <FileText size={20} color={student.resumePath ? '#34d399' : '#f59e0b'} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                Resume Status: {student.resumePath ? '✅ Uploaded' : '⚠️ Not Uploaded'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {student.resumePath ? `${student.resumeOriginalName} — Last updated: ${new Date(student.resumeUploadedAt).toLocaleDateString()}` : 'Upload your resume to improve AI analysis accuracy'}
              </p>
            </div>
          </div>
          <Link to="/complete-profile" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            {student.resumePath ? 'Update Resume' : 'Upload Resume'}
          </Link>
        </div>
      )}

    </div>
  );
}
