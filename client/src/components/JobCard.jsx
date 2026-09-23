import React from 'react';

export default function JobCard({ job }) {
  if (!job) return null;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 600 }}>
              {job.title}
            </h4>
            <div style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 500, marginTop: '0.2rem' }}>
              {job.company}
            </div>
          </div>
          <span style={{
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            fontWeight: 600
          }}>
            {job.type || 'Full-time'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8', margin: '0.75rem 0' }}>
          <span>📍 {job.location || 'India'}</span>
          <span>💼 {job.experience || '0-2 yrs'}</span>
          <span>💰 {job.salary || '₹10-18 LPA'}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
          {(job.requiredSkills || []).map((sk, idx) => (
            <span key={idx} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#cbd5e1'
            }}>
              {sk}
            </span>
          ))}
        </div>
      </div>

      <a
        href={job.url || 'https://linkedin.com/jobs'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          padding: '0.55rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 600
        }}
      >
        Apply on Company Portal ↗
      </a>
    </div>
  );
}
