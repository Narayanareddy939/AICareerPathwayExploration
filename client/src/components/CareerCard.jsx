import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CareerCard({ career, onSelect }) {
  const navigate = useNavigate();
  if (!career) return null;

  const match = career.matchPercentage || 85;
  const matchColor = match >= 80 ? '#10b981' : match >= 60 ? '#6366f1' : '#f59e0b';

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--primary-color, #6366f1)',
              letterSpacing: '0.05em'
            }}>
              {career.category || 'Career Pathway'}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0.25rem 0' }}>
              {career.title}
            </h3>
          </div>
          <div style={{
            background: `${matchColor}20`,
            border: `1px solid ${matchColor}50`,
            color: matchColor,
            padding: '0.25rem 0.6rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            {match}% Match
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1rem' }}>
          {career.description}
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem' }}>
            KEY REQUIRED SKILLS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {(career.requiredSkills || []).slice(0, 4).map((sk, idx) => (
              <span key={idx} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#cbd5e1'
              }}>
                {sk}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>AVG SALARY</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>{career.averageSalary || '₹12-24 LPA'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>GROWTH RATE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>{career.growthRate || '25% CAGR'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onSelect ? onSelect(career) : navigate(`/roadmap?role=${encodeURIComponent(career.title)}`)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            padding: '0.6rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          View Roadmap
        </button>
        <button
          onClick={() => navigate(`/skill-gap?targetRole=${encodeURIComponent(career.title)}`)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '0.6rem 0.9rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Skill Gap
        </button>
      </div>
    </div>
  );
}
