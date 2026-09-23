import React from 'react';

export default function ScenarioCard({ scenario, onRemove }) {
  if (!scenario) return null;

  const score = scenario.matchScore || 75;
  const scoreCol = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b';

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.25rem',
      position: 'relative'
    }}>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ×
        </button>
      )}

      <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
        Option Comparison
      </div>
      <h3 style={{ margin: '0.25rem 0 1rem', fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
        {scenario.roleTitle}
      </h3>

      <div style={{
        textAlign: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '12px',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreCol }}>
          {score}%
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Profile Fit Index</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Target Package:</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{scenario.salaryRange || '₹12-24 LPA'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Time to Ready:</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{scenario.timeToReadinessMonths || 6} Months</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Market Risk:</span>
          <span style={{ color: scenario.riskLevel === 'Low' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
            {scenario.riskLevel || 'Moderate'}
          </span>
        </div>
      </div>
    </div>
  );
}
