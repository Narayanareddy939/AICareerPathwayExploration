import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MentorshipModal from './MentorshipModal';
import { 
  Users, 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Send, 
  ExternalLink, 
  CheckCircle, 
  DollarSign 
} from 'lucide-react';

export default function AlumniNetwork({ onRequestMentorship }) {
  const [alumniList, setAlumniList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [higherStudiesOnly, setHigherStudiesOnly] = useState(false);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/alumni');
      const data = res.data;
      if (data.success) {
        setAlumniList(data.data || []);
        setFilteredList(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching alumni list:", err);
    } finally {
      setLoading(false);
    }
  };


  // Handle live search & filters
  useEffect(() => {
    let result = [...alumniList];

    if (search) {
      const q = search.trim().toLowerCase();
      result = result.filter(a => {
        const name = (a.name || '').toLowerCase();
        const role = (a.currentRole || a.role || '').toLowerCase();
        const comp = (a.currentCompany || a.company || '').toLowerCase();
        const dom = (a.domain || '').toLowerCase();
        const br = (a.branch || '').toLowerCase();
        const skills = (a.skills || []).join(' ').toLowerCase();
        return name.includes(q) || role.includes(q) || comp.includes(q) || dom.includes(q) || br.includes(q) || skills.includes(q);
      });
    }

    if (branchFilter) {
      result = result.filter(a => a.branch && a.branch.toLowerCase().includes(branchFilter.toLowerCase()));
    }

    if (domainFilter) {
      result = result.filter(a => a.domain && a.domain.toLowerCase().includes(domainFilter.toLowerCase()));
    }

    if (companyFilter) {
      result = result.filter(a => (a.currentCompany || a.company || '').toLowerCase().includes(companyFilter.toLowerCase()));
    }

    if (minSalary) {
      const sal = parseFloat(minSalary);
      result = result.filter(a => (a.salaryLPA || a.salary / 100000) >= sal);
    }

    if (higherStudiesOnly) {
      result = result.filter(a => a.higherStudies === true);
    }

    setFilteredList(result);
  }, [search, branchFilter, domainFilter, companyFilter, minSalary, higherStudiesOnly, alumniList]);

  // Extract unique filter dropdown values
  const uniqueBranches = [...new Set(alumniList.map(a => a.branch).filter(Boolean))];
  const uniqueDomains = [...new Set(alumniList.map(a => a.domain).filter(Boolean))];
  const uniqueCompanies = [...new Set(alumniList.map(a => a.currentCompany || a.company).filter(Boolean))].slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-cyan">Alumni Mentorship Network</span>
              <span className="badge badge-indigo">{filteredList.length} Alumni Records</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              Connect with <span className="gradient-text">Alumni Industry Leaders</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '650px' }}>
              Search alumni across top tech companies, view career progression, salary tiers, and request 1-on-1 career mentorship.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <CheckCircle size={14} /> Active Mentors Available
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, role, company, or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Branch Filter */}
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="">All Branches</option>
            {uniqueBranches.map((b, i) => (
              <option key={i} value={b} style={{ background: '#111827' }}>{b}</option>
            ))}
          </select>

          {/* Domain Filter */}
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
            <option value="">All Domains</option>
            {uniqueDomains.map((d, i) => (
              <option key={i} value={d} style={{ background: '#111827' }}>{d}</option>
            ))}
          </select>

          {/* Company Filter */}
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
            <option value="">All Companies</option>
            {uniqueCompanies.map((c, i) => (
              <option key={i} value={c} style={{ background: '#111827' }}>{c}</option>
            ))}
          </select>

          {/* Min Salary Filter */}
          <select value={minSalary} onChange={e => setMinSalary(e.target.value)}>
            <option value="">Min Package</option>
            <option value="4">4+ LPA</option>
            <option value="6">6+ LPA</option>
            <option value="8">8+ LPA</option>
            <option value="12">12+ LPA</option>
          </select>

        </div>
      </div>

      {/* Alumni Directory Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading Alumni Directory...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No alumni records found matching your filters</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try clearing or adjusting your search keywords or drop-down filters.</p>
          <button className="btn-secondary" onClick={() => { setSearch(''); setBranchFilter(''); setDomainFilter(''); setCompanyFilter(''); setMinSalary(''); }} style={{ marginTop: '1rem' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {filteredList.map((alumni) => {
            const salary = alumni.salaryLPA || (alumni.salary ? (alumni.salary / 100000).toFixed(1) : '5.5');
            return (
              <div key={alumni.alumniId} className="glass-card glass-card-interactive" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  {/* Top Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>{alumni.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>
                        {alumni.currentRole || alumni.role || 'Software Engineer'}
                      </p>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>
                      {salary} LPA
                    </span>
                  </div>

                  {/* Company & Location */}
                  <div style={{ display: 'flex', gap: '1rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building2 size={14} color="#34d399" />
                      {alumni.currentCompany || alumni.company}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} color="#06b6d4" />
                      {alumni.location}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <GraduationCap size={14} color="#f59e0b" />
                      Class of {alumni.graduationYear} ({alumni.branch})
                    </span>
                  </div>

                  {/* Skills Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                    {(alumni.skills || []).map((sk, idx) => (
                      <span key={idx} className="skill-chip">{sk}</span>
                    ))}
                  </div>

                  {/* Certifications if available */}
                  {alumni.certifications && alumni.certifications.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Certifications
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {alumni.certifications.map((c, i) => (
                          <span key={i} className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (typeof onRequestMentorship === 'function') {
                        onRequestMentorship(alumni);
                      } else {
                        setSelectedAlumni(alumni);
                      }
                    }}
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '0.55rem' }}
                  >
                    <Send size={15} />
                    Request Mentorship
                  </button>

                  <a
                    href={alumni.linkedIn ? `https://${alumni.linkedIn.replace('https://', '')}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                    title="View LinkedIn Profile"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {selectedAlumni && (
        <MentorshipModal
          alumni={selectedAlumni}
          onClose={() => setSelectedAlumni(null)}
        />
      )}
    </div>
  );
}
