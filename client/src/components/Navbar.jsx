import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  BrainCircuit, 
  Users, 
  FileText, 
  MessageSquareCode, 
  UserCheck 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, studentList, activeStudent, setActiveStudent }) {
  return (
    <header className="navbar-container" style={{
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      sticky: 'top',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <BrainCircuit size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
                AI<span style={{ color: '#818cf8' }}>Carrier</span>
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>v2.5 AI Pro</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alumni Intelligence & Career Pathfinder</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.3rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', border: 'none', borderRadius: '10px' }}
          >
            <LayoutDashboard size={16} />
            Analytics
          </button>
          
          <button 
            onClick={() => setActiveTab('predictor')}
            className={activeTab === 'predictor' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', border: 'none', borderRadius: '10px' }}
          >
            <Sparkles size={16} />
            AI Career Match
          </button>

          <button 
            onClick={() => setActiveTab('alumni')}
            className={activeTab === 'alumni' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', border: 'none', borderRadius: '10px' }}
          >
            <Users size={16} />
            Alumni Directory
          </button>

          <button 
            onClick={() => setActiveTab('resume')}
            className={activeTab === 'resume' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', border: 'none', borderRadius: '10px' }}
          >
            <FileText size={16} />
            Resume Scorer
          </button>

          <button 
            onClick={() => setActiveTab('chatbot')}
            className={activeTab === 'chatbot' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', border: 'none', borderRadius: '10px' }}
          >
            <MessageSquareCode size={16} />
            AI Advisor
          </button>
        </nav>

        {/* Active Student Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <UserCheck size={16} color="#818cf8" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Student</span>
              <select
                value={activeStudent?.studentId || ''}
                onChange={(e) => {
                  const sel = studentList.find(s => s.studentId === e.target.value);
                  if (sel) setActiveStudent(sel);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: 0,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {studentList.map(st => (
                  <option key={st.studentId} value={st.studentId} style={{ background: '#111827', color: '#fff' }}>
                    {st.name} ({st.branch})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
