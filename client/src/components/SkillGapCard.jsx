import React from 'react';

export default function SkillGapCard({ skill, priority = 'High', category = 'Technical', onLearn }) {
  const priorityColors = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Medium: '#3b82f6',
    Low: '#10b981'
  };

  const col = priorityColors[priority] || '#f59e0b';

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col }} />
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>{skill}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{category}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          background: `${col}15`,
          color: col,
          fontSize: '0.75rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontWeight: 600
        }}>
          {priority} Priority
        </span>
        {onLearn && (
          <button
            onClick={() => onLearn(skill)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#e2e8f0',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Find Courses
          </button>
        )}
      </div>
    </div>
  );
}
