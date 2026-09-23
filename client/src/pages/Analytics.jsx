import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import {
  BarChart2, Users, TrendingUp, Award, Briefcase, Target,
  RefreshCw, DollarSign, MapPin
} from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b', '#fb7185', '#22d3ee'];
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem 1rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '0.9rem', fontWeight: 700 }}>
            {p.name}: {typeof p.value === 'number' && p.value > 100 ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <BarChart2 size={48} color="#818cf8" style={{ margin: '0 auto 1rem' }} />
        <h3>Analytics unavailable</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Could not load analytics data. Please try again.</p>
        <button onClick={loadAnalytics} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  const { summary, domainStats, topCompanies, topSkills } = analytics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(217,70,239,0.1) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '0.5rem' }}>Alumni Analytics</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Platform <span className="gradient-text">Analytics</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Career trends and placement insights from {summary?.totalAlumni?.toLocaleString()} alumni records
            </p>
          </div>
          <button onClick={loadAnalytics} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <div className="grid-4">
        {[
          { label: 'Total Alumni', value: summary?.totalAlumni?.toLocaleString() || '—', icon: Users, color: '#818cf8' },
          { label: 'Avg Salary', value: summary?.avgSalaryOverall || '—', icon: DollarSign, color: '#34d399' },
          { label: 'Placement Rate', value: summary?.placementRate || '—', icon: TrendingUp, color: '#22d3ee' },
          { label: 'Higher Studies', value: summary?.higherStudiesRate || '—', icon: Award, color: '#fbbf24' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{kpi.label}</p>
                <p style={{ fontSize: '1.9rem', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
              </div>
              <div style={{ background: `${kpi.color}20`, padding: '0.65rem', borderRadius: '10px' }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid-2">
        {/* Domain Salary Chart */}
        {domainStats?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={17} color="#34d399" /> Average Salary by Domain (LPA)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={domainStats.slice(0, 7)} margin={{ top: 5, right: 10, left: -20, bottom: 45 }}>
                <XAxis dataKey="domain" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgSalary" radius={[6, 6, 0, 0]} name="Avg Salary (LPA)">
                  {domainStats.slice(0, 7).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Top Skills */}
        {topSkills?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={17} color="#818cf8" /> Top In-Demand Skills
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSkills.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#d1d5db' }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Alumni with Skill">
                  {topSkills.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Domain Distribution + Top Companies */}
      <div className="grid-2">
        {/* Domain Distribution Pie */}
        {domainStats?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={17} color="#22d3ee" /> Career Domain Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={domainStats.slice(0, 8)} cx="50%" cy="50%" outerRadius={100}
                  dataKey="count" nameKey="domain" label={({ domain, percent }) => `${domain?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={10}>
                  {domainStats.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Top Companies */}
        {topCompanies?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={17} color="#f59e0b" /> Top Hiring Companies
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topCompanies.slice(0, 8).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${COLORS[i % COLORS.length]}30`, color: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>{c.name}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.count} alumni</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        background: COLORS[i % COLORS.length],
                        width: `${(c.count / topCompanies[0].count) * 100}%`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Data Source Notice */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: '#22d3ee' }}>Data Source:</strong> Analytics computed from alumni dataset
          ({summary?.totalAlumni} records). All statistics are calculated in real-time from actual data.
        </p>
      </div>
    </div>
  );
}
