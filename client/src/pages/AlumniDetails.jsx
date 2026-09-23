import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import {
  Users, BarChart2, Briefcase, TrendingUp, Award, RefreshCw,
  Search, Filter, MapPin, Building2, GraduationCap, MessageCircle, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlumniDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [alumnus, setAlumnus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => { loadAlumnus(); }, [id]);

  const loadAlumnus = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/alumni/${id || 'ALU0001'}`);
      setAlumnus(res.data.alumni || res.data);
    } catch (err) {
      // Try getting from alumni list
      try {
        const listRes = await axios.get('/api/alumni');
        const list = listRes.data.alumni || listRes.data.data || [];
        const found = list.find(a => a.alumniId === id || a.Alumni_ID === id || a._id === id);
        if (found) setAlumnus(found);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const requestMentorship = async () => {
    setRequesting(true);
    try {
      await axios.post('/api/alumni/mentorship', { alumniId: id || alumnus?.alumniId });
      toast.success('Mentorship request sent!');
    } catch (err) {
      toast.error('Could not send request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-ring" />
        <p style={{ color: 'var(--text-muted)' }}>Loading alumni profile...</p>
      </div>
    );
  }

  if (!alumnus) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Users size={48} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
        <h3>Alumni Not Found</h3>
        <Link to="/alumni" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '1rem' }}>
          <ArrowLeft size={15} /> Back to Alumni
        </Link>
      </div>
    );
  }

  const name = alumnus.name || `${alumnus.First_Name || ''} ${alumnus.Last_Name || ''}`.trim();
  const role = alumnus.currentRole || alumnus.Job_Title || '';
  const company = alumnus.currentCompany || alumnus.Current_Company || '';
  const location = alumnus.location || '';
  const domain = alumnus.domain || alumnus.Major_Academic_Program || '';
  const gradYear = alumnus.graduationYear || alumnus.Graduation_Year || '';
  const degree = alumnus.degree || alumnus.Degree_Earned || '';
  const skills = alumnus.skills || [];
  const similarity = alumnus.similarity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Back Button */}
      <Link to="/alumni" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
        <ArrowLeft size={15} /> Back to Alumni Directory
      </Link>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(217,70,239,0.1) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, flexShrink: 0 }}>
              {name.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>{name}</h1>
              <p style={{ color: '#818cf8', fontSize: '1rem', marginBottom: '0.5rem' }}>{role} {company && `@ ${company}`}</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {location && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={13} />{location}</span>}
                {gradYear && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><GraduationCap size={13} />Class of {gradYear}</span>}
                {domain && <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{domain}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
            {similarity !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{similarity}%</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Profile Similarity</p>
              </div>
            )}
            <button onClick={requestMentorship} className="btn-primary" disabled={requesting}
              style={{ fontSize: '0.88rem' }}>
              <MessageCircle size={15} />
              {requesting ? 'Sending...' : 'Request Mentorship'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Career Info */}
      <div className="grid-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} color="#fbbf24" /> Career Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: 'Current Role', value: role },
              { label: 'Company', value: company },
              { label: 'Domain', value: domain },
              { label: 'Location', value: location },
              { label: 'Graduation Year', value: gradYear },
              { label: 'Degree', value: degree },
            ].map(({ label, value }) => value && (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="#818cf8" /> Skills
          </h3>
          {skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skills.map((s, i) => (
                <span key={i} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Skills not listed in dataset</p>
          )}

          {/* Consent info */}
          {alumnus.Brochure_Feature_Consent && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.78rem', color: '#34d399' }}>
                ✓ This alumni has consented to be featured as a mentor resource.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Contact Info (masked for privacy) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card"
        style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={16} color="#22d3ee" /> Get In Touch
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Use the mentorship request button above to reach out. Contact details are only shared after the alumni accepts the request.
        </p>
        <button onClick={requestMentorship} className="btn-primary" disabled={requesting} style={{ fontSize: '0.9rem' }}>
          <MessageCircle size={15} /> {requesting ? 'Requesting...' : 'Request Mentorship from ' + name.split(' ')[0]}
        </button>
      </motion.div>
    </div>
  );
}
