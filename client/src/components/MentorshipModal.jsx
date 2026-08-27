import React, { useState } from 'react';
import axios from 'axios';
import { X, Send, CheckCircle2, Building2, MapPin, GraduationCap } from 'lucide-react';

export default function MentorshipModal({ alumni, activeStudent, onClose }) {
  const [message, setMessage] = useState(
    `Hi ${alumni.name},\n\nI am currently pursuing ${activeStudent?.branch || 'CSE'} (CGPA: ${activeStudent?.cgpa || 8.5}) and aspiring to become a ${alumni.currentRole || 'Software Engineer'}. I would love to connect for 1-on-1 career guidance and mock interview prep.\n\nBest regards,\n${activeStudent?.name || 'Student'}`
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/api/mentorship/request', {
        alumniId: alumni.alumniId,
        studentName: activeStudent?.name || 'Student',
        message
      });
      const data = res.data;
      if (data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Mentorship request error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Request 1-on-1 Mentorship</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={48} color="#34d399" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ color: '#fff', fontSize: '1.4rem' }}>Mentorship Request Sent!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              Your connection invitation was successfully delivered to <strong style={{ color: '#fff' }}>{alumni.name}</strong>. An email notification has been queued.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Alumnus Overview Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>{alumni.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                    {alumni.currentRole || alumni.role}
                  </p>
                </div>
                <span className="badge badge-emerald">
                  {alumni.salaryLPA || (alumni.salary ? (alumni.salary / 100000).toFixed(1) : '6.0')} LPA
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <Building2 size={12} color="#34d399" style={{ display: 'inline', marginRight: '3px' }} />
                  {alumni.currentCompany || alumni.company}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <MapPin size={12} color="#06b6d4" style={{ display: 'inline', marginRight: '3px' }} />
                  {alumni.location}
                </span>
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                PERSONALIZED INVITATION MESSAGE
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                <Send size={16} />
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
