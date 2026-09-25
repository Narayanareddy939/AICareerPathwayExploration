import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Briefcase, MapPin, Building2, TrendingUp, Search,
  RefreshCw, Clock, BarChart2, Zap, Info, ChevronDown
} from 'lucide-react';

const CAREER_OPTIONS = [
  '', // All
  'Software Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Data Engineer',
  'Data Analyst',
  'Product Manager',
  'Cybersecurity Engineer',
  'Mobile Developer',
];

export default function Jobs() {
  const [insights, setInsights]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [profile, setProfile]           = useState(null);

  // Load student profile to auto-select career
  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await axios.get('/api/student/profile');
        const p = profileRes.data?.student || profileRes.data?.data;
        if (p) {
          setProfile(p);
          const careerGoal = p.careerGoal || p.targetRole || '';
          // Try to match career goal to a supported option
          const matched = CAREER_OPTIONS.find(opt =>
            opt && careerGoal.toLowerCase().includes(opt.toLowerCase())
          );
          if (matched) setSelectedCareer(matched);
        }
      } catch {
        // Profile load failure is non-blocking
      }
      await loadInsights(selectedCareer);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInsights = async (career = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (career) params.career = career;
      const res = await axios.get('/api/jobs/market-insights', { params });
      if (res.data?.success !== false) {
        setInsights(res.data);
      } else {
        setError('Failed to load job market data.');
      }
    } catch (err) {
      console.error('Jobs market-insights error:', err);
      setError('Could not load job market data. Please check that the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCareerChange = async (career) => {
    setSelectedCareer(career);
    await loadInsights(career);
  };

  const topSkills    = insights?.topSkills    || [];
  const topCompanies = insights?.topCompanies || [];
  const topLocations = insights?.topLocations || [];
  const matchedJobs  = insights?.matchedJobs  || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(10,185,129,0.12) 0%,rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>
          Job Market Intelligence
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
          Job <span className="gradient-text">Market Insights</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Real statistics from actual job datasets •{' '}
          <strong style={{ color: '#34d399' }}>
            {insights?.totalJobsInDB ?? '…'} total jobs analyzed
          </strong>
        </p>
      </motion.div>

      {/* ── Career Filter ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }} className="glass-card"
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center',
            gap: '0.5rem', background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0 0.75rem',
          }}>
            <Briefcase size={15} color="var(--text-muted)" />
            <select
              id="career-filter"
              value={selectedCareer}
              onChange={e => handleCareerChange(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                padding: '0.65rem 0', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="">All Careers — Full Market Overview</option>
              {CAREER_OPTIONS.filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>

          <button
            onClick={() => loadInsights(selectedCareer)}
            className="btn-primary"
            style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>

          {selectedCareer && (
            <button
              onClick={() => handleCareerChange('')}
              className="btn-secondary"
              style={{ fontSize: '0.88rem' }}
            >
              Clear Filter
            </button>
          )}
        </div>

        {profile?.careerGoal && !selectedCareer && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <Info size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
            Your profile target: <strong style={{ color: '#34d399' }}>{profile.careerGoal}</strong> — select it above for focused insights.
          </p>
        )}
      </motion.div>

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="loading-ring" />
          <p style={{ color: 'var(--text-muted)' }}>Loading job market data from dataset…</p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', border: '1px solid rgba(244,63,94,0.3)' }}>
          <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
          <button
            onClick={() => loadInsights(selectedCareer)}
            className="btn-secondary"
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      {!loading && !error && insights && (
        <>
          <div className="grid-4">
            {[
              {
                label: 'Matched Jobs',
                value: insights.jobCount ?? 0,
                color: '#818cf8',
                sub: `of ${insights.totalJobsInDB ?? 0} total`,
              },
              {
                label: 'Demand Level',
                value: insights.demandLevel || '—',
                color: '#34d399',
                sub: `${insights.demandPercentage ?? 0}% of market`,
              },
              {
                label: 'Top Company',
                value: topCompanies[0]?.company || '—',
                color: '#fbbf24',
                sub: topCompanies[0] ? `${topCompanies[0].count} postings` : 'No data',
              },
              {
                label: 'Top Location',
                value: topLocations[0]?.location?.split(',')[0] || '—',
                color: '#22d3ee',
                sub: topLocations[0] ? `${topLocations[0].count} jobs` : 'No data',
              },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.06 }}
                className="glass-card"
                style={{ textAlign: 'center' }}
              >
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {kpi.label}
                </p>
                <p style={{
                  fontSize: kpi.value.toString().length > 8 ? '1rem' : '1.6rem',
                  fontWeight: 800, color: kpi.color, lineHeight: 1.2,
                }}>
                  {kpi.value}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Top Skills + Companies ──────────────────────────── */}
          <div className="grid-2">
            {topSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="glass-card"
              >
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="#818cf8" /> Most Required Skills
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {topSkills.slice(0, 15).map((s, i) => (
                    <span key={i} style={{
                      background: `rgba(${i < 3 ? '244,63,94' : i < 7 ? '245,158,11' : '99,102,241'},0.12)`,
                      border: `1px solid rgba(${i < 3 ? '244,63,94' : i < 7 ? '245,158,11' : '99,102,241'},0.3)`,
                      color: i < 3 ? '#fb7185' : i < 7 ? '#fbbf24' : '#818cf8',
                      padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {s.skill}
                      <span style={{ opacity: 0.6, marginLeft: '0.3rem' }}>({s.count})</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {topCompanies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33 }}
                className="glass-card"
              >
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} color="#fbbf24" /> Top Hiring Companies
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topCompanies.slice(0, 8).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>{c.company}</span>
                      <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>{c.count} jobs</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Top Locations ────────────────────────────────────── */}
          {topLocations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
              className="glass-card"
            >
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#22d3ee" /> Top Hiring Locations
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {topLocations.map((l, i) => (
                  <span key={i} style={{
                    background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
                    color: '#22d3ee', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    {l.location}
                    <span style={{ opacity: 0.6, marginLeft: '0.3rem' }}>({l.count})</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Salary Range (only if actual data exists) ─────────── */}
          {insights.salaryRange && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="glass-card"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={16} color="#818cf8" /> Salary Range (INR)
              </h3>
              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>MINIMUM</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span>₹{(insights.salaryRange.minINR || Math.round((insights.salaryRange.minUSD || 50000) * 83))?.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ({insights.salaryRange.minLPA || (((insights.salaryRange.minUSD || 50000) * 83) / 100000).toFixed(1)} LPA)
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAXIMUM</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span>₹{(insights.salaryRange.maxINR || Math.round((insights.salaryRange.maxUSD || 190000) * 83))?.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ({insights.salaryRange.maxLPA || (((insights.salaryRange.maxUSD || 190000) * 83) / 100000).toFixed(1)} LPA)
                    </span>
                  </p>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'flex-end', marginBottom: '0.25rem' }}>
                  Based on {insights.salaryRange.sampleSize} job records with salary data (Converted to INR)
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Sample Job Postings ───────────────────────────────── */}
          {matchedJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card"
            >
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={17} color="#22d3ee" />
                Sample Job Postings
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>From Dataset</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matchedJobs.map((job, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', padding: '1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    flexWrap: 'wrap', gap: '0.75rem',
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem' }}>{job.title}</h4>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {job.company && (
                          <span style={{ fontSize: '0.78rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Building2 size={11} />{job.company}
                          </span>
                        )}
                        {job.location && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={11} />{job.location}
                          </span>
                        )}
                        {job.employmentType && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={11} />{job.employmentType}
                          </span>
                        )}
                      </div>
                      {job.skills?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {job.skills.map((s, si) => (
                            <span key={si} className="skill-chip" style={{ fontSize: '0.72rem' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={`badge ${job.source === 'linkedin' ? 'badge-indigo' : 'badge-emerald'}`}
                      style={{ fontSize: '0.7rem', flexShrink: 0 }}
                    >
                      {job.source === 'linkedin' ? 'LinkedIn' : 'Industry DB'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No Jobs Found */}
          {matchedJobs.length === 0 && topSkills.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <Briefcase size={40} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text-muted)' }}>No direct matches found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Try selecting a different career from the dropdown above.
              </p>
            </div>
          )}

          {/* ── Data Source Footer ──────────────────────────────── */}
          <div className="glass-card" style={{ padding: '0.85rem 1.5rem', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#22d3ee' }}>Data Sources:</strong>{' '}
              job_data.csv + linkedin_job_postings_dataset.csv —{' '}
              <strong style={{ color: '#34d399' }}>{insights.totalJobsInDB} total records</strong>.
              Statistics are calculated from actual dataset records. No fabricated data.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
