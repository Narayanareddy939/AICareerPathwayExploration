import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, BookOpen, Award, Globe, TrendingUp, ExternalLink, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const PATHWAYS = [
  {
    id: 'gate',
    title: 'GATE',
    fullTitle: 'Graduate Aptitude Test in Engineering',
    description: 'Gateway to M.Tech/PhD at IITs, NITs and government jobs in PSUs',
    minCgpa: 7.0,
    domains: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil'],
    branches: ['B.Tech', 'B.E.'],
    benefits: ['IIT/NIT admission', 'ISRO/DRDO/BARC jobs', 'PSU recruitment', 'Research careers'],
    timeline: '6-12 months preparation',
    color: '#6366f1',
    resources: [
      { name: 'GATE Official Website', url: 'https://gate.iitk.ac.in' },
      { name: 'Made Easy', url: 'https://madeeasy.in' },
      { name: 'NPTEL Courses', url: 'https://nptel.ac.in' },
    ],
  },
  {
    id: 'gre',
    title: 'GRE',
    fullTitle: 'Graduate Record Examinations',
    description: 'Standard test for MS/PhD programs at universities in USA, Canada, Europe',
    minCgpa: 7.5,
    domains: ['All Engineering', 'Computer Science', 'Data Science'],
    branches: ['B.Tech', 'B.E.', 'B.Sc'],
    benefits: ['US/Canada MS programs', 'Top university admission', 'Research opportunities', 'Global career'],
    timeline: '3-6 months preparation',
    color: '#10b981',
    resources: [
      { name: 'ETS GRE Official', url: 'https://www.ets.org/gre' },
      { name: 'Magoosh GRE', url: 'https://gre.magoosh.com' },
      { name: 'Manhattan Prep', url: 'https://www.manhattanprep.com/gre' },
    ],
  },
  {
    id: 'cat',
    title: 'CAT/MBA',
    fullTitle: 'Common Admission Test (MBA)',
    description: 'Entrance to IIM and top MBA programs for management careers',
    minCgpa: 6.0,
    domains: ['All branches'],
    branches: ['Any'],
    benefits: ['IIM admission', 'Management roles', 'Consulting', 'Entrepreneurship'],
    timeline: '6-12 months preparation',
    color: '#f59e0b',
    resources: [
      { name: 'IIM CAT Official', url: 'https://iimcat.ac.in' },
      { name: '2IIM', url: 'https://www.2iim.com' },
    ],
  },
  {
    id: 'ielts',
    title: 'IELTS/TOEFL',
    fullTitle: 'English Language Proficiency Tests',
    description: 'Required for foreign university admissions (MS, MBA, PhD)',
    minCgpa: 0,
    domains: ['All branches'],
    branches: ['Any'],
    benefits: ['University admission abroad', 'UK/Australia/Canada visa', 'Global opportunities'],
    timeline: '1-3 months preparation',
    color: '#06b6d4',
    resources: [
      { name: 'IELTS Official', url: 'https://www.ielts.org' },
      { name: 'ETS TOEFL', url: 'https://www.ets.org/toefl' },
    ],
  },
];

export default function HigherStudies() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPathway, setExpandedPathway] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/profile');
      setProfile(res.data.student);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEligibility = (pathway) => {
    if (!profile) return 'neutral';
    const cgpa = parseFloat(profile.cgpa || 0);
    const branchMatch = pathway.branches.includes('Any') ||
      pathway.branches.some(b => (profile.degree || '').includes(b) || (profile.branch || '').includes(b));
    if (cgpa >= pathway.minCgpa && (pathway.minCgpa === 0 || branchMatch)) return 'eligible';
    if (cgpa >= pathway.minCgpa * 0.8) return 'borderline';
    return 'low';
  };

  const eligibilityConfig = {
    eligible: { label: 'You Qualify', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    borderline: { label: 'Borderline', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    low: { label: 'Build CGPA', color: '#fb7185', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)' },
    neutral: { label: 'Unknown', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading higher studies info...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(217,70,239,0.08) 100%)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>Higher Education Pathways</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
          Higher Studies <span className="gradient-text">Guide</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Explore M.Tech, MS, MBA and international study pathways
          {profile?.cgpa && ` • Your CGPA: `}
          {profile?.cgpa && <strong style={{ color: '#fbbf24' }}>{profile.cgpa}</strong>}
        </p>
      </motion.div>

      {/* Profile Context */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '1rem 1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Eligibility is based on your profile:
            <strong style={{ color: '#e2e8f0' }}> {profile.branch}</strong>,
            <strong style={{ color: '#34d399' }}> CGPA {profile.cgpa}</strong>,
            <strong style={{ color: '#e2e8f0' }}> {profile.degree}</strong>
          </p>
        </motion.div>
      )}

      {/* Pathway Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {PATHWAYS.map((pathway, idx) => {
          const eligibility = getEligibility(pathway);
          const ec = eligibilityConfig[eligibility];
          const isExpanded = expandedPathway === pathway.id;

          return (
            <motion.div key={pathway.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              style={{
                background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
                border: `1px solid ${isExpanded ? `${pathway.color}40` : 'rgba(255,255,255,0.08)'}`,
                borderLeft: `4px solid ${pathway.color}`,
                borderRadius: '16px', overflow: 'hidden',
              }}>
              {/* Pathway Header */}
              <div style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => setExpandedPathway(isExpanded ? null : pathway.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <span style={{ background: `${pathway.color}20`, color: pathway.color, border: `1px solid ${pathway.color}40`, padding: '0.25rem 0.9rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800 }}>
                        {pathway.title}
                      </span>
                      <span style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}`, padding: '0.2rem 0.7rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {ec.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>{pathway.fullTitle}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{pathway.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <GraduationCap size={13} /> Min CGPA: {pathway.minCgpa || 'None'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#22d3ee' }}>{pathway.timeline}</span>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-dim)" /> : <ChevronDown size={18} color="var(--text-dim)" />}
                  </div>
                </div>

                {/* Benefits preview */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {pathway.benefits.map((b, bi) => (
                    <span key={bi} className="skill-chip" style={{ fontSize: '0.75rem', color: pathway.color }}>✓ {b}</span>
                  ))}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  style={{ padding: '0 1.5rem 1.5rem' }}>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1rem' }} />

                  <div className="grid-2">
                    {/* Eligibility Criteria */}
                    <div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Eligibility Criteria</p>
                      <ul style={{ paddingLeft: '1.1rem' }}>
                        {pathway.minCgpa > 0 && <li style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '0.3rem' }}>Minimum CGPA: {pathway.minCgpa}</li>}
                        <li style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '0.3rem' }}>Branches: {pathway.domains.join(', ')}</li>
                        <li style={{ fontSize: '0.85rem', color: '#d1d5db', marginBottom: '0.3rem' }}>Degree: {pathway.branches.join(', ')}</li>
                      </ul>
                    </div>

                    {/* Resources */}
                    <div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Key Resources</p>
                      {pathway.resources.map((r, ri) => (
                        <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: pathway.color, fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.35rem' }}>
                          <ExternalLink size={13} /> {r.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* General Advice */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} color="#818cf8" /> General Higher Studies Advice
        </h3>
        <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li style={{ fontSize: '0.88rem', color: '#d1d5db' }}>Start preparation in 3rd year for GATE/GRE</li>
          <li style={{ fontSize: '0.88rem', color: '#d1d5db' }}>Maintain CGPA above 7.5 for premium programs</li>
          <li style={{ fontSize: '0.88rem', color: '#d1d5db' }}>Build research projects for MS/PhD applications</li>
          <li style={{ fontSize: '0.88rem', color: '#d1d5db' }}>Get 2-3 LORs from professors who know your work</li>
          <li style={{ fontSize: '0.88rem', color: '#d1d5db' }}>GRE score above 315 is competitive for top US universities</li>
          <li style={{ fontSize: '0.88rem', color: '#d1d5db' }}>Financial aid/scholarships available at most universities — apply early</li>
        </ul>
      </motion.div>
    </div>
  );
}
