import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AlumniCard({ alumni, onConnect }) {
  const navigate = useNavigate();
  if (!alumni) return null;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#fff'
          }}>
            {alumni.name ? alumni.name.charAt(0) : 'A'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>
              {alumni.name}
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 500 }}>
              {alumni.role || alumni.currentRole} @ {alumni.currentCompany || alumni.company}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <span>🎓 {alumni.branch} ({alumni.graduationYear || '2022'})</span>
          <span>📍 {alumni.location || 'Bengaluru'}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
          {(alumni.skills || []).slice(0, 3).map((s, idx) => (
            <span key={idx} style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#cbd5e1'
            }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onConnect ? onConnect(alumni) : navigate(`/alumni/${alumni.id || alumni.alumniId}`)}
          style={{
            flex: 1,
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#818cf8',
            padding: '0.5rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Request Mentorship
        </button>
      </div>
    </div>
  );
}
