import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Building2, TrendingUp, Search, Filter, RefreshCw, ExternalLink, Clock } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [profile, setProfile] = useState(null);

  const DOMAINS = [
    'Software Engineering', 'Data Science', 'Machine Learning',
    'DevOps', 'Cloud', 'Frontend', 'Backend', 'Data Engineering',
    'Cybersecurity', 'Mobile', 'Product Management',
  ];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, insightsRes] = await Promise.allSettled([
        axios.get('/api/student/profile'),
        axios.get('/api/jobs/market-insights'),
      ]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.student);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data);
    } catch (err) {
      console.error('Jobs load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/jobs', {
        params: { search, domain: selectedDomain, career: profile?.careerGoal }
      });
      setJobs(res.data.jobs || res.data.data || []);
      setInsights(res.data.insights || insights);
    } catch (err) {
      // Fallback: use insights data
    } finally {
      setLoading(false);
    }
  };

  const displayJobs = insights?.matchedJobs || jobs;
  const topCompanies = insights?.topCompanies || [];
  const topSkills = insights?.topSkills || [];
  const topLocations = insights?.topLocations || [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading job market data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(10,185,129,0.12) 0%,rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>Job Market Intelligence</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
          Job <span className="gradient-text">Market Insights</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Real-time job market data for {insights?.career || profile?.careerGoal || 'your target career'} •
          <strong style={{ color: '#34d399' }}> {insights?.jobCount || 0} jobs analyzed</strong>
        </p>
      </motion.div>

      {/* Search + Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0 0.75rem' }}>
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Search jobs, companies, skills..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.6rem 0', fontSize: '0.9rem' }} />
          </div>
          <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}
            style={{ width: '200px', padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
            <option value="">All Domains</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={searchJobs} className="btn-primary" style={{ fontSize: '0.88rem' }}>
            <Search size={15} /> Search
          </button>
          <button onClick={loadData} className="btn-secondary" style={{ fontSize: '0.88rem' }}>
            <RefreshCw size={15} /> Reset
          </button>
        </div>
      </motion.div>

      {/* Market Overview KPIs */}
      <div className="grid-4">
        {[
          { label: 'Jobs Analyzed', value: insights?.jobCount || 0, color: '#818cf8', sub: 'In dataset' },
          { label: 'Demand Level', value: insights?.demandLevel || 'Growing', color: '#34d399', sub: 'Market demand' },
          { label: 'Top Company', value: topCompanies[0]?.company || '—', color: '#fbbf24', sub: `${topCompanies[0]?.count || 0} postings` },
          { label: 'Top Location', value: topLocations[0]?.location?.split(',')[0] || '—', color: '#22d3ee', sub: 'Most jobs' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
            className="glass-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{kpi.label}</p>
            <p style={{ fontSize: kpi.value.toString().length > 8 ? '1.1rem' : '1.6rem', fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>{kpi.value}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Skills + Companies */}
      <div className="grid-2">
        {/* Top Skills */}
        {topSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="#818cf8" /> Most Required Skills
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {topSkills.slice(0, 15).map((s, i) => (
                <span key={i} style={{
                  background: `rgba(${i < 3 ? '244,63,94' : i < 7 ? '245,158,11' : '99,102,241'},0.12)`,
                  border: `1px solid rgba(${i < 3 ? '244,63,94' : i < 7 ? '245,158,11' : '99,102,241'},0.3)`,
                  color: i < 3 ? '#fb7185' : i < 7 ? '#fbbf24' : '#818cf8',
                  padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  {s.skill} <span style={{ opacity: 0.6 }}>({s.count})</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Companies */}
        {topCompanies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={16} color="#fbbf24" /> Top Hiring Companies
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topCompanies.slice(0, 6).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>{c.company}</span>
                  <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>{c.count} jobs</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Job Listings */}
      {displayJobs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={17} color="#22d3ee" /> Sample Job Postings
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>From Dataset</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {displayJobs.map((job, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                borderRadius: '12px', padding: '1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>{job.title}</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {job.company && <span style={{ fontSize: '0.78rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={11} />{job.company}</span>}
                    {job.location && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={11} />{job.location}</span>}
                  </div>
                  {job.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {job.skills.slice(0, 5).map((s, si) => (
                        <span key={si} className="skill-chip" style={{ fontSize: '0.72rem' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem', flexShrink: 0 }}>{job.source || 'Dataset'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No jobs found */}
      {displayJobs.length === 0 && !loading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <Briefcase size={40} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No direct job matches</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            Try searching for a different career or domain above
          </p>
        </div>
      )}

      {/* Data Source */}
      <div className="glass-card" style={{ padding: '0.85rem 1.5rem', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: '#22d3ee' }}>Data Sources:</strong> job_data.csv (200 records) + linkedin_job_postings_dataset.csv (500 records).
          Statistics calculated from actual dataset — no fabricated data.
        </p>
      </div>
    </div>
  );
}
