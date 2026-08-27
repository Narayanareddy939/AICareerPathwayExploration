import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareCode, Send, X, Bot, User, Trash2, Edit3, ChevronLeft, Plus, History, Zap, Award, BookOpen, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Structured Card displayed inside AI responses
function ResponseCard({ cardData }) {
  if (!cardData) return null;
  return (
    <div style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {cardData.careerMatch !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAREER MATCH</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#818cf8' }}>{cardData.careerMatch}%</span>
        </div>
      )}
      {cardData.recommendedRoles?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>RECOMMENDED ROLES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {cardData.recommendedRoles.map((r, i) => <span key={i} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>{r}</span>)}
          </div>
        </div>
      )}
      {cardData.missingSkills?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.3rem' }}>MISSING SKILLS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {cardData.missingSkills.map((s, i) => <span key={i} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem' }}>+ {s}</span>)}
          </div>
        </div>
      )}
      {cardData.recommendedCourses?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, marginBottom: '0.3rem' }}>RECOMMENDED COURSES</p>
          {cardData.recommendedCourses.map((c, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#d1d5db' }}>📘 {c}</p>)}
        </div>
      )}
      {cardData.recommendedProjects?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#22d3ee', fontWeight: 600, marginBottom: '0.3rem' }}>PROJECTS TO BUILD</p>
          {cardData.recommendedProjects.map((p, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#d1d5db' }}>🚀 {p}</p>)}
        </div>
      )}
      {cardData.certifications?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#e879f9', fontWeight: 600, marginBottom: '0.3rem' }}>CERTIFICATIONS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {cardData.certifications.map((c, i) => <span key={i} style={{ background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.3)', color: '#e879f9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem' }}>{c}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_PROMPTS = [
  { label: '💰 Salary', text: 'What salary can I expect in my target role?' },
  { label: '🧠 Skills', text: 'What are my missing skills and how should I learn them?' },
  { label: '🏢 Placement', text: 'Am I ready for campus placements?' },
  { label: '🚀 Projects', text: 'What projects should I build for my portfolio?' },
  { label: '📚 Higher Studies', text: 'Should I pursue higher studies or get placed?' },
  { label: '👥 Alumni', text: 'Which alumni have profiles similar to mine?' },
];

export default function ChatbotAI() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello **${user?.fullName?.split(' ')[0] || 'there'}**! 👋 I'm your AI Career Counselor.\n\nAsk me anything about your career path, skill gaps, salary expectations, or which alumni match your profile!`,
      cardData: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/ai/history');
      setSessions(res.data.sessions || []);
    } catch {}
  };

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msgText, cardData: null }]);
    setLoading(true);
    try {
      const res = await axios.post('/api/ai/chat', { message: msgText, sessionId });
      setSessionId(res.data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, cardData: res.data.cardData || null }]);
      fetchHistory();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that right now. Please try again!', cardData: null }]);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id) => {
    try {
      const res = await axios.get(`/api/ai/history/${id}`);
      const sess = res.data.session;
      setSessionId(sess._id);
      setMessages(sess.messages.map(m => ({ role: m.role, content: m.content, cardData: m.cardData || null })));
      setShowHistory(false);
    } catch {}
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await axios.delete(`/api/ai/history/${id}`);
    fetchHistory();
    if (sessionId === id) { setSessionId(null); setMessages([{ role: 'assistant', content: 'New chat started. How can I help you?', cardData: null }]); }
  };

  const startRename = (id, currentTitle, e) => {
    e.stopPropagation();
    setRenameId(id);
    setRenameValue(currentTitle);
  };

  const submitRename = async (id) => {
    await axios.patch(`/api/ai/history/${id}/rename`, { title: renameValue });
    setRenameId(null);
    fetchHistory();
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([{ role: 'assistant', content: `What would you like to explore today, ${user?.fullName?.split(' ')[0] || 'there'}?`, cardData: null }]);
    setShowHistory(false);
  };

  const renderText = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 0 ? part : <strong key={i} style={{ color: '#fff' }}>{part}</strong>
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(99,102,241,0.5)',
          color: '#fff'
        }}
      >
        {open ? <X size={22} /> : <MessageSquareCode size={22} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 998,
              width: '380px', height: '580px',
              background: 'rgba(11,15,25,0.97)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '20px',
              display: 'flex', flexDirection: 'column',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '0.4rem', borderRadius: '8px' }}>
                  <Bot size={16} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>AI Career Counselor</p>
                  <p style={{ fontSize: '0.65rem', color: '#34d399' }}>● Online • Powered by Gemini</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowHistory(!showHistory)} title="Chat History" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                  <History size={18} />
                </button>
                <button onClick={startNewChat} title="New Chat" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* History Panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}
                >
                  <div style={{ padding: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Previous Chats</p>
                    {sessions.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No previous chats</p>}
                    {sessions.map(s => (
                      <div key={s._id} onClick={() => loadSession(s._id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid transparent' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                        {renameId === s._id ? (
                          <input value={renameValue} onChange={e => setRenameValue(e.target.value)} onBlur={() => submitRename(s._id)} onKeyDown={e => e.key === 'Enter' && submitRename(s._id)} autoFocus style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', flex: 1, outline: 'none' }} onClick={e => e.stopPropagation()} />
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#d1d5db', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                          <button onClick={(e) => startRename(s._id, s.title, e)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px' }}><Edit3 size={12} /></button>
                          <button onClick={(e) => deleteSession(s._id, e)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px' }}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.6rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: msg.role === 'assistant' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {msg.role === 'assistant' ? <Bot size={14} color="#fff" /> : <User size={14} color="#fff" />}
                  </div>
                  <div style={{ maxWidth: '82%' }}>
                    <div style={{
                      background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(30,41,59,0.9)',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px', padding: '0.65rem 0.9rem',
                      fontSize: '0.83rem', lineHeight: 1.55, color: '#e2e8f0',
                      boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.25)' : 'none'
                    }}>
                      {renderText(msg.content)}
                    </div>
                    {msg.cardData && <ResponseCard cardData={msg.cardData} />}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Bot size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.text)} style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', borderRadius: '20px', padding: '0.25rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#a5b4fc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9ca3af'; }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ask your career question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', padding: '0 0.9rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
