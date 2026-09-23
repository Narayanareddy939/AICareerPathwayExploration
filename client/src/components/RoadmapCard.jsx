import React from 'react';

export default function RoadmapCard({ phase, onToggleMilestone }) {
  if (!phase) return null;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
            Phase {phase.phaseNumber} • {phase.durationWeeks} Weeks
          </span>
          <h3 style={{ margin: '0.25rem 0', fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
            {phase.phaseName}
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {(phase.milestones || []).map((m, idx) => (
          <div key={idx} style={{
            background: m.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.2)',
            border: `1px solid ${m.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <input
              type="checkbox"
              checked={!!m.completed}
              onChange={() => onToggleMilestone && onToggleMilestone(phase.phaseNumber, m.id || idx)}
              style={{ marginTop: '0.25rem', width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: m.completed ? '#6ee7b7' : '#f1f5f9',
                textDecoration: m.completed ? 'line-through' : 'none'
              }}>
                {m.title}
              </div>
              <p style={{ margin: '0.35rem 0 0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                {m.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(m.skillsGained || []).map((sk, sidx) => (
                  <span key={sidx} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#cbd5e1'
                  }}>
                    + {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
