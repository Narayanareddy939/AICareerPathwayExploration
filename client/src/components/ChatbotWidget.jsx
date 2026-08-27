import React, { useState } from 'react';
import axios from 'axios';
import { 
  MessageSquareCode, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  DollarSign, 
  GraduationCap, 
  Briefcase 
} from 'lucide-react';

export default function ChatbotWidget({ activeStudent }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${activeStudent?.name || 'there'}! I am your AI Carrier Guide. Ask me anything about career domains, salary expectations, skill roadmaps, or higher study opportunities!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (customMsg) => {
    const textToSend = customMsg || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMsg) setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        message: textToSend,
        studentContext: activeStudent || {}
      });
      const data = res.data;

      if (data.success) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      console.error("Chat API error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-indigo">AI Career Counselor</span>
            <span className="badge badge-emerald">Online 24/7</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Interactive <span className="gradient-text">AI Carrier Assistant</span>
          </h1>
        </div>
        <Bot size={36} color="#818cf8" />
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className="btn-secondary" 
          onClick={() => handleSend("What are the average salary expectations for Data Science vs Full Stack roles?")}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          <DollarSign size={14} color="#34d399" /> Salary Expectations
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("What are the top 4 skills I should learn to get placed above 10 LPA?")}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          <Sparkles size={14} color="#818cf8" /> Top In-Demand Skills
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("Should I prepare for Higher Studies (MS/MBA) or Campus Placement?")}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          <GraduationCap size={14} color="#22d3ee" /> Higher Studies Advice
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleSend("How can I prepare for technical interviews with alumni mentors?")}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          <Briefcase size={14} color="#f59e0b" /> Placement Strategy
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="glass-card" style={{
        height: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem'
      }}>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          paddingRight: '0.5rem'
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
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: isBot ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isBot ? <Bot size={18} color="#fff" /> : <User size={18} color="#fff" />}
                </div>

                <div style={{
                  background: isBot ? 'rgba(30, 41, 59, 0.9)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: isBot ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  borderRadius: '14px',
                  padding: '0.85rem 1.1rem',
                  maxWidth: '75%',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: '#ffffff',
                  boxShadow: isBot ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}>
                  {msg.text}
                  <div style={{ fontSize: '0.65rem', color: isBot ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.7)', textAlign: 'right', marginTop: '0.35rem' }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Bot size={18} color="#818cf8" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Counselor is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="Ask your career question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={16} /> Send
          </button>
        </form>

      </div>
    </div>
  );
}
