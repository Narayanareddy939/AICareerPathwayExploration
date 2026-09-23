import React from 'react';

export default function CourseCard({ course }) {
  if (!course) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
            {course.provider || 'Coursera / Industry'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>
            ★ {course.rating || '4.8'}
          </span>
        </div>

        <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>
          {course.title}
        </h4>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>Level: {course.difficulty || 'Beginner'}</span>
          <span>•</span>
          <span>{course.certificateType || 'Specialization'}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
          {(course.skills || []).map((sk, idx) => (
            <span key={idx} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.15rem 0.5rem',
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
        href={course.url || 'https://www.coursera.org'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          textAlign: 'center',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#818cf8',
          padding: '0.5rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 600
        }}
      >
        Enroll Course ↗
      </a>
    </div>
  );
}
