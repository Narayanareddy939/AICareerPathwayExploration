import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  DollarSign, 
  GraduationCap, 
  Briefcase,
  RefreshCw,
  Plus,
  Copy,
  Check,
  Code,
  Zap,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Code Block with Copy Button ──────────────────────
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '0.75rem 0',
      background: 'rgba(10, 15, 30, 0.95)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 0.85rem',
        background: 'rgba(99, 102, 241, 0.12)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.72rem',
        color: '#a5b4fc',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Terminal size={13} color="#818cf8" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#34d399' : '#cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.72rem',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px'
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '0.85rem 1rem',
        overflowX: 'auto',
        fontSize: '0.82rem',
        lineHeight: 1.5,
        color: '#f8fafc',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Rich Markdown Parser (ChatGPT Style) ──────────────
function FormattedMarkdown({ text }) {
  if (!text) return null;

  // Split by code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Render text before code block
    if (match.index > lastIndex) {
      elements.push(
        <TextSegment key={`txt-${lastIndex}`} content={text.slice(lastIndex, match.index)} />
      );
    }
    // Render code block
    elements.push(
      <CodeBlock 
        key={`code-${match.index}`} 
        language={match[1] || 'plaintext'} 
        code={match[2].trimEnd()} 
      />
    );
    lastIndex = match.index + match[0].length;
  }

  // Render any remaining text
  if (lastIndex < text.length) {
    elements.push(
      <TextSegment key={`txt-${lastIndex}`} content={text.slice(lastIndex)} />
    );
  }

  return <div>{elements}</div>;
}

// Sub-component for regular markdown text lines
function TextSegment({ content }) {
  const lines = content.split('\n');

  return (
    <div style={{ lineHeight: 1.65 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '0.4rem' }} />;
        }

        // Headings: ### or ## or #
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{
              fontSize: '0.96rem',
              fontWeight: 700,
              color: '#818cf8',
              margin: '0.65rem 0 0.35rem 0'
            }}>
              {renderInlineStyles(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#a5b4fc',
              margin: '0.75rem 0 0.4rem 0'
            }}>
              {renderInlineStyles(trimmed.slice(3))}
            </h3>
          );
        }

        // Bullet point: • or - or *
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{
              display: 'flex',
              gap: '0.5rem',
              margin: '0.2rem 0',
              paddingLeft: '0.4rem'
            }}>
              <span style={{ color: '#818cf8', fontWeight: 800, fontSize: '0.9rem' }}>•</span>
              <div style={{ flex: 1 }}>{renderInlineStyles(trimmed.slice(2))}</div>
            </div>
          );
        }

        // Numbered list: 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} style={{
              display: 'flex',
              gap: '0.45rem',
              margin: '0.25rem 0',
              paddingLeft: '0.4rem'
            }}>
              <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>{numMatch[1]}.</span>
              <div style={{ flex: 1 }}>{renderInlineStyles(numMatch[2])}</div>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} style={{ margin: '0.25rem 0' }}>
            {renderInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Inline formatting: `inline code`, **bold**, *italic*
function renderInlineStyles(text) {
  // First split by inline code `...`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, cIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={cIdx} style={{
          background: 'rgba(99, 102, 241, 0.2)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '4px',
          padding: '0.15rem 0.35rem',
          fontSize: '0.82rem',
          color: '#e0e7ff',
          fontFamily: 'Consolas, Monaco, monospace'
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }

    // Split by **bold**
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return (
          <strong key={`${cIdx}-${bIdx}`} style={{ color: '#ffffff', fontWeight: 700 }}>
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });
  });
}

// ── Structured Card responses ────────────────────────
function ResponseCard({ cardData }) {
  if (!cardData) return null;
  return (
    <div style={{
      marginTop: '0.75rem',
      background: 'rgba(15, 23, 42, 0.65)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem'
    }}>
      {cardData.careerMatch !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAREER MATCH</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#818cf8' }}>{cardData.careerMatch}%</span>
        </div>
      )}

      {cardData.recommendedRoles?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>RECOMMENDED ROLES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {cardData.recommendedRoles.map((r, i) => (
              <span key={i} className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{r}</span>
            ))}
          </div>
        </div>
      )}

      {cardData.missingSkills?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.3rem' }}>PRIORITY SKILL GAPS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {cardData.missingSkills.map((s, i) => (
              <span key={i} className="badge badge-amber" style={{ fontSize: '0.72rem' }}>+ {s}</span>
            ))}
          </div>
        </div>
      )}

      {cardData.recommendedCourses?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, marginBottom: '0.3rem' }}>RECOMMENDED COURSES</p>
          {cardData.recommendedCourses.slice(0, 3).map((c, i) => (
            <p key={i} style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: '0.15rem 0' }}>📘 {c}</p>
          ))}
        </div>
      )}

      {cardData.recommendedProjects?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#22d3ee', fontWeight: 600, marginBottom: '0.3rem' }}>PORTFOLIO PROJECTS</p>
          {cardData.recommendedProjects.slice(0, 3).map((p, i) => (
            <p key={i} style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: '0.15rem 0' }}>🚀 {p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Chatbot Component ───────────────────────────
export default function ChatbotWidget({ activeStudent }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(activeStudent || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load student profile if not provided via props
  useEffect(() => {
    if (!profile) {
      axios.get('/api/student/profile')
        .then(res => {
          if (res.data?.student) setProfile(res.data.student);
        })
        .catch(() => {});
    }
  }, []);

  const getGreeting = () => {
    const studentName = profile?.fullName || user?.fullName?.split(' ')[0] || 'there';
    const targetCareer = profile?.careerGoal || 'Software Engineering';
    return {
      sender: 'bot',
      text: `Hello **${studentName}**! 👋 I am your **AI Career Counselor** powered by **Google Gemini 3.6 Flash**.\n\nOperating like **ChatGPT**, I can answer **any** question you have:\n• 💻 **Coding & Algorithms**: Solve DSA questions, explain concepts, or review code\n• 💰 **Salary Insights**: Realistic CTC/LPA benchmarks across Indian companies\n• 🧠 **Skill Gaps & Roadmaps**: Customized action plan for **${targetCareer}**\n• 📄 **Resume & Interview Prep**: Bullet point reviews and mock technical questions\n\nHow can I help you accelerate your career today?`,
      cardData: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Initial greeting
  useEffect(() => {
    setMessages([getGreeting()]);
  }, [profile, user]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([getGreeting()]);
    setInput('');
  };

  const handleSend = async (customMsg) => {
    const textToSend = customMsg || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Prepare multi-turn history for ChatGPT style memory
    const historyPayload = messages.slice(-8).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      content: m.text
    }));

    setMessages(prev => [...prev, userMsg]);
    if (!customMsg) setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Try primary AI chat endpoint with multi-turn history
      const res = await axios.post('/api/ai/chat', {
        message: textToSend,
        history: historyPayload,
        studentProfile: profile || {}
      }, { headers, timeout: 30000 });

      if (res.data?.reply) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: res.data.reply,
          cardData: res.data.cardData || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      // 2. Fallback to public chat endpoint
      try {
        const fallbackRes = await axios.post('/api/chat', {
          message: textToSend,
          history: historyPayload,
          studentContext: profile || {}
        }, { timeout: 30000 });
        if (fallbackRes.data?.reply) {
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: fallbackRes.data.reply,
            cardData: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } catch (fErr) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: "I encountered a network issue reaching Gemini AI. Please check your connection and try again.",
          cardData: null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      maxWidth: '960px',
      margin: '0 auto',
      height: 'calc(100vh - 110px)',
      minHeight: '520px'
    }}>
      
      {/* Top Banner (Compact & Sleek with New Chat action) */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(6, 182, 212, 0.12) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        padding: '0.85rem 1.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={12} color="#a5b4fc" /> Gemini 3.6 Flash
            </span>
            <span className="badge badge-emerald">ChatGPT Mode</span>
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
            AI Career Advisor <span className="gradient-text">& Tech Mentor</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleNewChat}
            className="btn-secondary"
            title="Start a fresh conversation"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <Plus size={14} /> New Chat
          </button>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.4)'
          }}>
            <Bot size={22} color="#fff" />
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.2rem',
        flexShrink: 0
      }}>
        <button 
          className="btn-secondary" 
          onClick={() => handleSend("What salary can I expect in my target career role in India for 2026?")}
          style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
        >
          <DollarSign size={13} color="#34d399" /> Expected Salaries
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("Give me a 6-month roadmap to secure a high-package placement offer.")}
          style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
        >
          <Sparkles size={13} color="#818cf8" /> 6-Month Roadmap
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("What are 3 standout capstone projects I should build for my GitHub portfolio?")}
          style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
        >
          <Briefcase size={13} color="#22d3ee" /> Portfolio Projects
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("Write a Python solution to invert a binary tree with time & space complexity.")}
          style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
        >
          <Code size={13} color="#fbbf24" /> DSA Coding Problem
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("How can I prepare for technical interviews at top product companies?")}
          style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
        >
          <GraduationCap size={13} color="#e879f9" /> Interview Tips
        </button>
      </div>

      {/* Chat Messages Card */}
      <div className="glass-card" style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.15rem 1.25rem 0.85rem 1.25rem',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        
        {/* Scrollable Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          paddingRight: '0.4rem',
          marginBottom: '0.75rem'
        }}>
          {messages.map((msg, idx) => {
            const isBot = msg.sender === 'bot';
            return (
              <div key={idx} style={{
                display: 'flex',
                gap: '0.75rem',
                flexDirection: isBot ? 'row' : 'row-reverse',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isBot ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isBot ? <Bot size={17} color="#fff" /> : <User size={17} color="#fff" />}
                </div>

                <div style={{
                  background: isBot ? 'rgba(30, 41, 59, 0.95)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: isBot ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  borderRadius: '14px',
                  padding: '0.85rem 1.15rem',
                  maxWidth: '85%',
                  fontSize: '0.88rem',
                  color: '#ffffff',
                  boxShadow: isBot ? '0 2px 10px rgba(0,0,0,0.2)' : '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}>
                  <FormattedMarkdown text={msg.text} />
                  
                  {isBot && msg.cardData && (
                    <ResponseCard cardData={msg.cardData} />
                  )}

                  <div style={{
                    fontSize: '0.65rem',
                    color: isBot ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.65)',
                    textAlign: 'right',
                    marginTop: '0.4rem'
                  }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={17} color="#fff" />
              </div>
              <div style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <RefreshCw size={14} className="spin" color="#818cf8" />
                Gemini 3.6 Flash is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Input Form (ALWAYS Visible at Bottom) */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          style={{
            display: 'flex',
            gap: '0.65rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            alignItems: 'flex-end'
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything (e.g., Explain System Design, write code, check salary, review resume)..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.4,
                maxHeight: '120px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !input.trim()}
            style={{ 
              padding: '0 1.25rem', 
              height: '42px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              borderRadius: '10px',
              fontWeight: 600
            }}
          >
            <Send size={16} /> Send
          </button>
        </form>

      </div>
    </div>
  );
}
