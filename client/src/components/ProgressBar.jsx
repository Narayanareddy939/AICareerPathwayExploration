import React from 'react';

export default function ProgressBar({ value = 0, max = 100, label = '', color = 'linear-gradient(90deg, #6366f1, #8b5cf6)' }) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div style={{ width: '100%', margin: '0.5rem 0' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{label}</span>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{percentage}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '999px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: '999px',
          transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  );
}
