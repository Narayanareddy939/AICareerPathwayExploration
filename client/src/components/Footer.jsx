import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      marginTop: '3rem',
      padding: '2rem 0 1rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#64748b',
      fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <a href="#about" style={{ color: '#94a3b8', textDecoration: 'none' }}>Platform Documentation</a>
        <a href="#privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>ML Algorithm Specs</a>
        <a href="#support" style={{ color: '#94a3b8', textDecoration: 'none' }}>Alumni Mentorship</a>
      </div>
      <div>
        © {new Date().getFullYear()} AI Career Pathway Exploration Platform. All rights reserved.
      </div>
    </footer>
  );
}
