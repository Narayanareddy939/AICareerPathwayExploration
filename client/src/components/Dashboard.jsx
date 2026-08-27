import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  GraduationCap, 
  Award, 
  Zap, 
  Briefcase, 
  DollarSign, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts';

export default function Dashboard({ setActiveTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Zap className="spin" size={36} color="#818cf8" style={{ animation: 'spin 1.5s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading AI Carrier Analytics Engine...</p>
      </div>
    );
  }

  const { summary, domainStats = [], topCompanies = [], topSkills = [], branchPlacement = [] } = analytics || {};

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(217, 70, 239, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '2.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-emerald">Live Alumni Outcomes 2026</span>
            <span className="badge badge-indigo">50+ Alumni Tracked</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2 }}>
            Data-Driven <span className="gradient-text">Career Navigator</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '650px', fontSize: '1rem' }}>
            Leveraging machine learning & historical alumni metrics to guide your path from campus to high-impact engineering & AI roles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setActiveTab('predictor')}>
            <Zap size={18} />
            Test AI Match
          </button>
          <button className="btn-secondary" onClick={() => setActiveTab('alumni')}>
            <Users size={18} />
            Browse Mentors
          </button>
        </div>
      </div>

      {/* Summary Key Performance Indicators */}
      <div className="grid-4">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE SALARY</p>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>{summary?.avgSalaryOverall || '6.4 LPA'}</h2>
              <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '0.25rem' }}>
                <TrendingUp size={12} /> +14.2% vs last year
              </span>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <DollarSign color="#818cf8" size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAMPUS PLACEMENT RATE</p>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>{summary?.placementRate || '92%'}</h2>
              <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '0.25rem' }}>
                <Award size={12} /> Top Tier Tier-1 Companies
              </span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <Briefcase color="#34d399" size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>HIGHER STUDIES</p>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>{summary?.higherStudiesRate || '12%'}</h2>
              <span style={{ fontSize: '0.75rem', color: '#22d3ee', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '0.25rem' }}>
                <GraduationCap size={12} /> Stanford, IIM, TUM
              </span>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <GraduationCap color="#22d3ee" size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOP DOMAIN</p>
              <h2 style={{ fontSize: '1.25rem', marginTop: '0.4rem', color: '#f59e0b' }}>{summary?.topDomain || 'AI & ML'}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Highest Demand Skill
              </span>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <Zap color="#f59e0b" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid-2">
        {/* Chart 1: Average Salary by Domain */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#818cf8" />
            Average Package by Career Domain (LPA)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Historical compensation distribution based on alumni roles
          </p>
          
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="domain" stroke="#6b7280" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
                  formatter={(val) => [`${val} LPA`, 'Avg Salary']}
                />
                <Bar dataKey="avgSalary" radius={[6, 6, 0, 0]}>
                  {domainStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Recruiting Companies */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} color="#34d399" />
            Top Hiring Companies
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Leading recruiters hiring alumni across CSE, IT, & ECE
          </p>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topCompanies} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#34d399" radius={[0, 6, 6, 0]} name="Alumni Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Skills Demand & Branch Distribution */}
      <div className="grid-2">
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="#f59e0b" />
            Most In-Demand Skills in Alumni Dataset
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {topSkills.map((sk, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                padding: '0.6rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sk.name}</span>
                <span className="badge badge-indigo">{sk.count} alumni</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="#22d3ee" />
            Key Insights for Upcoming Placements
          </h3>
          
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ArrowUpRight size={18} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.88rem', color: '#d1d5db' }}>
                <strong style={{ color: '#fff' }}>Python & SQL</strong> are present in over 70% of alumni profiles landing roles above 8 LPA.
              </p>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ArrowUpRight size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.88rem', color: '#d1d5db' }}>
                <strong style={{ color: '#fff' }}>Certifications Matter:</strong> Cloud (AWS/GCP) and Data Analytics certifications correlate with a 25% higher initial offer.
              </p>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ArrowUpRight size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.88rem', color: '#d1d5db' }}>
                <strong style={{ color: '#fff' }}>Alumni Mentorship:</strong> Students who connected with 2+ alumni mentors received 2x more campus referrals.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
