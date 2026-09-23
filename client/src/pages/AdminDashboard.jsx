import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Users, Briefcase, BookOpen, Database, Settings, BarChart2,
  TrendingUp, Award, RefreshCw, Plus, Trash2, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#d946ef', '#06b6d4', '#fb7185'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      // Fallback: build minimal stats from accessible endpoints
      try {
        const [analyticsRes, alumniRes] = await Promise.allSettled([
          axios.get('/api/analytics'),
          axios.get('/api/alumni?limit=5'),
        ]);
        const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : {};
        setStats({
          summary: {
            totalStudents: analytics.summary?.totalStudents || 0,
            totalAlumni: analytics.summary?.totalAlumni || 1000,
            totalCareers: 15,
            totalJobs: 700,
          },
          domainStats: analytics.domainStats || [],
          topCompanies: analytics.topCompanies || [],
          topSkills: analytics.topSkills || [],
          recentActivity: [],
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'alumni', label: 'Alumni', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'system', label: 'System', icon: Settings },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading admin panel...</p>
      </div>
    );
  }

  const s = stats?.summary || {};
  const domainData = (stats?.domainStats || []).slice(0, 7);
  const topSkills = (stats?.topSkills || []).slice(0, 10);
  const topCompanies = (stats?.topCompanies || []).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(217,70,239,0.12) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(217,70,239,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge" style={{ background: 'rgba(217,70,239,0.15)', color: '#e879f9', border: '1px solid rgba(217,70,239,0.3)', marginBottom: '0.5rem' }}>
              Admin Panel
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Platform <span className="gradient-text">Administration</span>
            </h1>
          </div>
          <button onClick={loadStats} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.4rem', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px',
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
            }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid-4">
            {[
              { label: 'Registered Students', value: s.totalStudents?.toLocaleString() || '0', icon: Users, color: '#818cf8' },
              { label: 'Alumni Records', value: s.totalAlumni?.toLocaleString() || '1,000', icon: Award, color: '#34d399' },
              { label: 'Career Paths', value: s.totalCareers || '15', icon: Briefcase, color: '#fbbf24' },
              { label: 'Job Postings', value: s.totalJobs?.toLocaleString() || '700', icon: Database, color: '#22d3ee' },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: `${kpi.color}18`, padding: '0.75rem', borderRadius: '12px' }}>
                  <kpi.icon size={22} color={kpi.color} />
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid-2">
            {domainData.length > 0 && (
              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Alumni by Domain</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={domainData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                    <XAxis dataKey="domain" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {domainData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {topSkills.length > 0 && (
              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top Skills</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topSkills.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ width: '110px', fontSize: '0.82rem', color: '#e2e8f0', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name || s.skill}</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(s.count / topSkills[0].count) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '35px', textAlign: 'right', flexShrink: 0 }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid-2">
          {topCompanies.length > 0 && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top Companies by Alumni</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {topCompanies.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>{c.name}</span>
                    <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{c.count} alumni</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Dataset Summary</h3>
            {[
              { label: 'Student Dataset', value: '5,000 records', file: 'student_placement_career_success.csv', color: '#818cf8' },
              { label: 'Alumni Dataset', value: '1,000 records', file: 'Alumni_Data_1000_Rows.csv', color: '#34d399' },
              { label: 'Job Postings', value: '700 records', file: 'job_data.csv + linkedin', color: '#fbbf24' },
              { label: 'Courses', value: 'Coursera dataset', file: 'coursera_courses.csv', color: '#22d3ee' },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{d.label}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.file}</p>
                </div>
                <span style={{ fontSize: '0.82rem', color: d.color, fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="grid-2">
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>ML Model Status</h3>
            {[
              { label: 'Best Model', value: 'Gradient Boosting', status: 'active' },
              { label: 'F1 Score', value: '0.7239', status: 'metric' },
              { label: 'ROC-AUC', value: '0.6388', status: 'metric' },
              { label: 'Training Set', value: '4,000 students', status: 'info' },
              { label: 'Test Set', value: '1,000 students', status: 'info' },
              { label: 'Target', value: 'placement_status (Binary)', status: 'info' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: item.status === 'active' ? '#34d399' : item.status === 'metric' ? '#818cf8' : '#e2e8f0' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Scoring Weights (Configurable)</h3>
            {[
              { label: 'Skill Match', weight: '30%', color: '#6366f1' },
              { label: 'Interest Match', weight: '20%', color: '#10b981' },
              { label: 'Academic Fit', weight: '15%', color: '#f59e0b' },
              { label: 'Job Market', weight: '15%', color: '#06b6d4' },
              { label: 'Alumni Similarity', weight: '10%', color: '#d946ef' },
              { label: 'Location Match', weight: '10%', color: '#fb7185' },
            ].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', width: '140px', flexShrink: 0 }}>{w.label}</span>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: w.weight, background: w.color, borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: w.color, width: '35px', textAlign: 'right', flexShrink: 0 }}>{w.weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
