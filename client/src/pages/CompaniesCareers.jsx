import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Search, Filter, MapPin, Building2, Sparkles,
  ExternalLink, Bookmark, BookmarkCheck, CheckCircle2,
  AlertCircle, Clock, ShieldCheck, ChevronRight, X,
  GraduationCap, Award, HelpCircle, FileText, Send,
  TrendingUp, RefreshCw, Info, Calendar, DollarSign,
  Layers, Check, Eye, Trash2, ListChecks, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import portalService from '../services/portalService';

export default function CompaniesCareers() {
  const { user } = useAuth();

  // Active Main Tab: 'portal' | 'companies' | 'saved' | 'applications'
  const [activeTab, setActiveTab] = useState('portal');

  // Search & Filters (Note: 'All Verification Status' dropdown removed per user request)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [fresherOnly, setFresherOnly] = useState(false);
  const [internshipOnly, setInternshipOnly] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [sortBy, setSortBy] = useState('newest');

  // Data states
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recProfileUsed, setRecProfileUsed] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  // Loading & Error states
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [errorJobs, setErrorJobs] = useState('');

  // Modals
  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [trackingModalJob, setTrackingModalJob] = useState(null);
  const [trackingNotes, setTrackingNotes] = useState('');

  // Pagination for All Jobs
  const [jobsPage, setJobsPage] = useState(1);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [hasMoreJobs, setHasMoreJobs] = useState(false);
  const PAGE_LIMIT = 12;

  // Initial load
  useEffect(() => {
    fetchRecommendations();
    fetchCompanies();
    fetchSavedAndApplications();
  }, []);

  // Fetch jobs whenever filters or page change
  useEffect(() => {
    fetchBrowseJobs(jobsPage);
  }, [
    searchQuery,
    selectedLocation,
    selectedEmploymentType,
    selectedExperience,
    fresherOnly,
    internshipOnly,
    selectedStatus,
    sortBy,
    jobsPage
  ]);

  // ─────────────────────────────────────────────────────────────
  //  API CALLS
  // ─────────────────────────────────────────────────────────────

  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const res = await portalService.getRecommendedJobs({ limit: 6 });
      if (res.success) {
        setRecommendedJobs(res.data.jobs || []);
        setRecProfileUsed(res.data.profileUsed || null);
        setProfileIncomplete(Boolean(res.data.profileIncomplete));
      }
    } catch (err) {
      console.warn('Failed to fetch recommendations:', err.message);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchBrowseJobs = async (page = 1) => {
    try {
      setLoadingJobs(true);
      setErrorJobs('');
      const params = {
        page,
        limit: PAGE_LIMIT,
        status: selectedStatus
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedLocation) params.location = selectedLocation;
      if (selectedEmploymentType) params.employmentType = selectedEmploymentType;
      if (selectedExperience) params.experienceLevel = selectedExperience;
      if (fresherOnly) params.fresherOnly = 'true';
      if (internshipOnly) params.internshipOnly = 'true';
      if (sortBy) params.sortBy = sortBy;

      const res = await portalService.getJobs(params);
      if (res.success) {
        setAllJobs(res.data || []);
        const total = res.pagination?.total || 0;
        setTotalJobsCount(total);
        setHasMoreJobs(page * PAGE_LIMIT < total);
      } else {
        setErrorJobs(res.message || 'Unable to load jobs');
      }
    } catch (err) {
      setErrorJobs(err.response?.data?.message || 'Failed to retrieve jobs. Please retry.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await portalService.getCompanies();
      if (res.success) {
        setCompanies(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load companies:', err.message);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchSavedAndApplications = async () => {
    try {
      const [savedRes, appsRes] = await Promise.all([
        portalService.getSavedJobs(),
        portalService.getApplications()
      ]);
      if (savedRes.success) setSavedJobs(savedRes.data || []);
      if (appsRes.success) setApplications(appsRes.data || []);
    } catch (err) {
      console.warn('Failed to load saved jobs or tracker:', err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  USER ACTIONS
  // ─────────────────────────────────────────────────────────────

  const isJobSaved = (jobId) => {
    return savedJobs.some(item => (item.jobId?._id || item.jobId) === jobId);
  };

  const handleToggleSave = async (job) => {
    const jobId = job._id;
    const alreadySaved = isJobSaved(jobId);

    try {
      if (alreadySaved) {
        await portalService.unsaveJob(jobId);
        setSavedJobs(prev => prev.filter(i => (i.jobId?._id || i.jobId) !== jobId));
        toast.success(`Removed "${job.title}" from saved jobs`);
      } else {
        await portalService.saveJob(jobId);
        toast.success(`Saved "${job.title}" to your bookmarks`);
        fetchSavedAndApplications();
      }
    } catch (err) {
      toast.error('Unable to update saved jobs. Please log in.');
    }
  };

  const handleOpenApplicationLink = (job) => {
    const url = job.applicationUrl || job.sourceUrl;
    if (!url) {
      toast.error('No application URL disclosed for this position.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    setTrackingModalJob(job);
    setTrackingNotes('');
  };

  const handleConfirmTracking = async () => {
    if (!trackingModalJob) return;
    try {
      await portalService.trackApplication(trackingModalJob._id, trackingNotes);
      toast.success('Application logged to your Application Tracker!');
      setTrackingModalJob(null);
      setTrackingNotes('');
      fetchSavedAndApplications();
    } catch (err) {
      toast.error('Failed to record application. Please retry.');
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await portalService.updateApplicationStatus(appId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchSavedAndApplications();
    } catch (err) {
      toast.error('Failed to update application status');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedEmploymentType('');
    setSelectedExperience('');
    setFresherOnly(false);
    setInternshipOnly(false);
    setSelectedStatus('active');
    setSortBy('newest');
    setJobsPage(1);
    toast.success('Filters reset to default');
  };

  // ─────────────────────────────────────────────────────────────
  //  BADGES (Official & Clean High-Contrast Styles)
  // ─────────────────────────────────────────────────────────────

  const renderVerificationBadge = (status) => {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: '#ecfdf5',
        color: '#065f46',
        border: '1px solid #a7f3d0'
      }}>
        <CheckCircle2 size={12} color="#059669" /> Verified
      </span>
    );
  };

  const renderSourceBadge = (sourceType) => {
    if (sourceType === 'campus_drive') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: '#ecfdf5',
          color: '#047857',
          border: '1px solid #6ee7b7'
        }}>
          🎓 Placement Cell
        </span>
      );
    }
    if (sourceType === 'official_employer' || sourceType === 'company_portal') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: '#eff6ff',
          color: '#1e40af',
          border: '1px solid #bfdbfe'
        }}>
          🏢 Direct Company
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: '#f8fafc',
        color: '#475569',
        border: '1px solid #e2e8f0'
      }}>
        🌐 External Job
      </span>
    );
  };

  // Filter recommendations in sync with the search bar and filter controls
  const filteredRecommendations = useMemo(() => {
    return recommendedJobs.filter(job => {
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = job.title?.toLowerCase().includes(q);
        const inComp = job.companyName?.toLowerCase().includes(q);
        const inLoc = job.location?.toLowerCase().includes(q);
        const inSkills = (job.requiredSkills || []).some(s => s.toLowerCase().includes(q)) ||
                         (job.preferredSkills || []).some(s => s.toLowerCase().includes(q));
        if (!inTitle && !inComp && !inLoc && !inSkills) return false;
      }
      if (selectedLocation && !job.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
      if (selectedEmploymentType && selectedEmploymentType !== 'all' && job.employmentType !== selectedEmploymentType) {
        return false;
      }
      if (selectedExperience && selectedExperience !== 'all' && job.experienceLevel !== selectedExperience) {
        return false;
      }
      if (fresherOnly && !['fresher', 'entry'].includes(job.experienceLevel)) {
        return false;
      }
      if (internshipOnly && job.employmentType !== 'internship') {
        return false;
      }
      if (selectedStatus === 'closed') {
        if (job.status !== 'closed' && job.status !== 'expired') return false;
      } else if (selectedStatus === 'active') {
        if (job.status !== 'active') return false;
      }
      return true;
    });
  }, [
    recommendedJobs,
    searchQuery,
    selectedLocation,
    selectedEmploymentType,
    selectedExperience,
    fresherOnly,
    internshipOnly,
    selectedStatus
  ]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* ─────────────────────────────────────────────────────────────
          SECTION A: HEADER & NAVIGATION TABS
      ───────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1rem' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              color: '#4f46e5',
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              <Sparkles size={14} /> Official Career Opportunity Hub
            </div>
            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--text-main)',
              margin: 0
            }}>
              Jobs & Companies Portal
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', marginTop: '0.35rem' }}>
              Explore official campus drives, partner hiring organizations, and career recommendations tailored to your profile.
            </p>
          </div>

          {/* Navigation View Toggles (Saved and Applied separated as requested) */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '5px',
            gap: '6px',
            boxShadow: 'var(--shadow-card)',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setActiveTab('portal')}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: activeTab === 'portal' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'portal' ? 'var(--bg-card-subtle)' : 'transparent',
                color: activeTab === 'portal' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'portal' ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'portal' ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none'
              }}
            >
              <Briefcase size={16} color={activeTab === 'portal' ? 'var(--primary)' : 'var(--text-dim)'} /> Portal Directory
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: activeTab === 'companies' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'companies' ? 'var(--bg-card-subtle)' : 'transparent',
                color: activeTab === 'companies' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'companies' ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'companies' ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none'
              }}
            >
              <Building2 size={16} color={activeTab === 'companies' ? 'var(--primary)' : 'var(--text-dim)'} /> Companies Spotlight ({companies.length})
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: activeTab === 'saved' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'saved' ? 'var(--bg-card-subtle)' : 'transparent',
                color: activeTab === 'saved' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'saved' ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'saved' ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none'
              }}
            >
              <Bookmark size={16} color={activeTab === 'saved' ? 'var(--primary)' : 'var(--text-dim)'} /> Saved Jobs ({savedJobs.length})
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: activeTab === 'applications' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'applications' ? 'var(--bg-card-subtle)' : 'transparent',
                color: activeTab === 'applications' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'applications' ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: activeTab === 'applications' ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none'
              }}
            >
              <Send size={16} color={activeTab === 'applications' ? 'var(--primary)' : 'var(--text-dim)'} /> My Applications ({applications.length})
            </button>
          </div>
        </div>

        {/* Global Search and Filter Bar */}
        <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 320px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setJobsPage(1); }}
                placeholder="Search by role title, company name, or technical skill (e.g. Python, React)..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxShadow: 'var(--shadow-card)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => { setSelectedLocation(e.target.value); setJobsPage(1); }}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 500,
                width: 'auto'
              }}
            >
              <option value="">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
              <option value="Chennai">Chennai</option>
              <option value="Gurugram">Gurugram</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Noida">Noida</option>
              <option value="Remote">Remote</option>
            </select>

            {/* Employment Type Filter */}
            <select
              value={selectedEmploymentType}
              onChange={(e) => { setSelectedEmploymentType(e.target.value); setJobsPage(1); }}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 500,
                width: 'auto'
              }}
            >
              <option value="">All Employment Types</option>
              <option value="full_time">Full-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>

            {/* Experience Level Filter */}
            <select
              value={selectedExperience}
              onChange={(e) => { setSelectedExperience(e.target.value); setJobsPage(1); }}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 500,
                width: 'auto'
              }}
            >
              <option value="">All Experience Levels</option>
              <option value="fresher">Fresher (Campus / 0 Yrs)</option>
              <option value="entry">Entry Level (0-2 Yrs)</option>
              <option value="mid">Mid Level</option>
            </select>

            {/* Job Status Filter: Open / Closed / All */}
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setJobsPage(1); }}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: selectedStatus === 'active' ? '#10b981' : selectedStatus === 'closed' ? '#ef4444' : 'var(--text-main)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: 'auto'
              }}
            >
              <option value="active">🟢 Status: Open Roles</option>
              <option value="closed">🔴 Status: Closed / Expired</option>
              <option value="all">⚪ Status: All (Open & Closed)</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setJobsPage(1); }}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 500,
                width: 'auto'
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="deadline">Sort: Closing Soon</option>
              <option value="salary">Sort: Highest Salary</option>
              <option value="title">Sort: Job Title (A-Z)</option>
            </select>
          </div>

          {/* Quick Filter Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Filters:</span>
            <button
              onClick={() => { setFresherOnly(!fresherOnly); setJobsPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: fresherOnly ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: fresherOnly ? 'var(--bg-card-subtle)' : 'var(--bg-input)',
                color: fresherOnly ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🎓 Fresher Roles Only
            </button>
            <button
              onClick={() => { setInternshipOnly(!internshipOnly); setJobsPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: internshipOnly ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                background: internshipOnly ? 'var(--bg-card-subtle)' : 'var(--bg-input)',
                color: internshipOnly ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              💼 Student Internships
            </button>
            <button
              onClick={() => { setSelectedStatus(selectedStatus === 'closed' ? 'active' : 'closed'); setJobsPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: selectedStatus === 'closed' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                background: selectedStatus === 'closed' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-input)',
                color: selectedStatus === 'closed' ? '#ef4444' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🔒 Closed / Expired Jobs
            </button>
            {(searchQuery || selectedLocation || selectedEmploymentType || selectedExperience || selectedStatus !== 'active' || fresherOnly || internshipOnly) && (
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={13} /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 1: PORTAL DIRECTORY & RECOMMENDATIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'portal' && (
        <div>
          {/* Profile incomplete warning banner if applicable */}
          {profileIncomplete && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.92rem' }}>
                    Complete Your Student Profile for Maximum Match Accuracy
                  </div>
                  <div style={{ color: '#b45309', fontSize: '0.82rem' }}>
                    Personalized recommendations calculate compatibility against your degree, branch, CGPA, graduation batch, and technical skills.
                  </div>
                </div>
              </div>
              <Link
                to="/complete-profile"
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
                }}
              >
                Update Profile →
              </Link>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION B: RECOMMENDED JOBS FOR YOU
          ───────────────────────────────────────────────────────────── */}
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#4f46e5" />
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Recommended Jobs for You
                  </h2>
                </div>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Deterministically ranked using your degree, branch, CGPA, technical skills, and target career goal.
                </p>
              </div>

              {recProfileUsed && (
                <div style={{ fontSize: '0.78rem', color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 500 }}>
                  Matched for: <span style={{ color: '#4338ca', fontWeight: 700 }}>{recProfileUsed.name || user?.fullName}</span> ({recProfileUsed.branch || 'Branch N/A'}, CGPA: {recProfileUsed.cgpa || 'N/A'})
                </div>
              )}
            </div>

            {loadingRecs ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="loading-ring" />
                <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.9rem' }}>
                  Analyzing verified jobs against your profile criteria...
                </p>
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                <Briefcase size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {recommendedJobs.length > 0 ? 'No Recommendations Match Active Filters' : 'No Direct Recommendations Found'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '540px', margin: '0 auto 1.25rem' }}>
                  {recommendedJobs.length > 0
                    ? 'Clear or relax your search filters to view your top profile recommendations, or explore all matching jobs below.'
                    : 'Add your technical skills and career interests in your profile to get personalized recommendations.'}
                </p>
                {recommendedJobs.length > 0 ? (
                  <button
                    onClick={handleResetFilters}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Reset All Filters
                  </button>
                ) : (
                  <Link to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                    Edit Profile Skills
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {filteredRecommendations.map((job) => {
                  const rec = job.recommendation || {};
                  const matchScore = rec.total || 0;
                  const scoreColor = matchScore >= 60 ? '#047857' : matchScore >= 40 ? '#0284c7' : '#b45309';
                  const scoreBg = matchScore >= 60 ? '#ecfdf5' : matchScore >= 40 ? '#eff6ff' : '#fef3c7';
                  const scoreBorder = matchScore >= 60 ? '#a7f3d0' : matchScore >= 40 ? '#bfdbfe' : '#fde68a';
                  const saved = isJobSaved(job._id);

                  return (
                    <motion.div
                      key={job._id}
                      className="glass-card"
                      whileHover={{ translateY: -4 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        padding: '1.35rem'
                      }}
                    >
                      {/* Top Row: Company, Logo placeholder, Match Score */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
                              border: '1px solid #c7d2fe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#4338ca',
                              fontSize: '1.05rem',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.1)'
                            }}>
                              {job.companyName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                                {job.companyName}
                              </div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                                {job.title}
                              </h3>
                            </div>
                          </div>

                          {/* Profile Match Score Pill */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: scoreBg,
                              color: scoreColor,
                              border: `1px solid ${scoreBorder}`,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: 700
                            }}>
                              <Award size={12} /> {matchScore}% Match
                            </div>
                          </div>
                        </div>

                        {/* Location, Type, Deadline */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="var(--text-dim)" /> {job.location || 'Location Not Specified'} ({job.workMode || 'onsite'})
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={13} color="var(--text-dim)" /> {job.employmentType === 'internship' ? 'Internship' : 'Full-time'}
                          </span>
                          {job.applicationDeadline ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 600 }}>
                              <Clock size={13} /> Closes: {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)' }}>
                              <Clock size={13} /> Rolling applications
                            </span>
                          )}
                        </div>

                        {/* Verification & Source Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                          {renderVerificationBadge(job.verificationStatus)}
                          {renderSourceBadge(job.sourceType)}
                        </div>

                        {/* Recommendation Explanation Box */}
                        {rec.explanation && (
                          <div style={{
                            background: 'var(--bg-card-subtle)',
                            borderLeft: '3px solid var(--primary)',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '0 8px 8px 0',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                            marginBottom: '0.85rem',
                            border: '1px solid var(--border-color)',
                            borderLeftWidth: '3px'
                          }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Why matched: </span>
                            {rec.explanation}
                          </div>
                        )}

                        {/* Skills Matched vs Missing */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Matched Skills:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            {rec.matchingSkills && rec.matchingSkills.length > 0 ? (
                              rec.matchingSkills.map((s, idx) => (
                                <span key={idx} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  ✓ {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>No overlapping skills detected</span>
                            )}
                          </div>

                          {rec.missingSkills && rec.missingSkills.length > 0 && (
                            <>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Missing Required Skills:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {rec.missingSkills.slice(0, 3).map((s, idx) => (
                                  <span key={idx} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                                    + {s}
                                  </span>
                                ))}
                                {rec.missingSkills.length > 3 && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '2px 4px' }}>
                                    +{rec.missingSkills.length - 3} more
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => setSelectedJobForModal(job)}
                          style={{
                            flex: 1,
                            padding: '0.55rem',
                            borderRadius: '8px',
                            background: 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Eye size={14} /> View Details
                        </button>

                        <button
                          onClick={() => handleToggleSave(job)}
                          title={saved ? 'Remove from saved' : 'Save job'}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            background: saved ? 'var(--bg-card-subtle)' : 'var(--bg-input)',
                            border: saved ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            color: saved ? 'var(--primary)' : 'var(--text-dim)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          onClick={() => handleOpenApplicationLink(job)}
                          style={{
                            flex: 1.2,
                            padding: '0.55rem',
                            borderRadius: '8px',
                            background: 'var(--primary-gradient)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
                          }}
                        >
                          Apply <ExternalLink size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
              ℹ️ Match scores reflect profile eligibility and technical skill overlap. They do not constitute a guarantee of selection.
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              SECTION C: BROWSE ALL JOBS
          ───────────────────────────────────────────────────────────── */}
          <section style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Explore All Jobs & Drives
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Complete directory of opportunities from university placement cells, official career portals, and campus partner feeds.
                </p>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Showing <strong style={{ color: 'var(--text-main)' }}>{allJobs.length}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalJobsCount}</strong> active positions
              </div>
            </div>

            {loadingJobs ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="loading-ring" />
                <p style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>Loading verified job directory...</p>
              </div>
            ) : errorJobs ? (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#fca5a5' }}>
                <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ color: '#b91c1c', fontWeight: 600 }}>{errorJobs}</p>
                <button
                  onClick={() => fetchBrowseJobs(1)}
                  style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Retry Search
                </button>
              </div>
            ) : allJobs.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Search size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Active Jobs Match Your Selected Filters</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', margin: '0.35rem 0 1.25rem' }}>
                  Try relaxing search terms, clearing location filters, or resetting quick filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  style={{ padding: '0.6rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {allJobs.map((job) => {
                  const saved = isJobSaved(job._id);
                  return (
                    <motion.div
                      key={job._id}
                      className="glass-card"
                      whileHover={{ translateY: -3 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1.35rem'
                      }}
                    >
                      <div>
                        {/* Company & Title */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'var(--bg-card-subtle)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: 'var(--text-main)',
                              flexShrink: 0
                            }}>
                              {job.companyName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>{job.companyName}</div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                                {job.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Location, Mode, Type */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="var(--text-dim)" /> {job.location || 'Location Not Disclosed'}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={13} color="var(--text-dim)" /> {job.employmentType === 'internship' ? 'Internship' : 'Full-time'}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            🎓 {job.experienceLevel === 'fresher' ? 'Fresher' : job.experienceLevel === 'entry' ? 'Entry Level' : 'Mid Level'}
                          </span>
                        </div>

                        {/* Verification & Source */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                          {renderVerificationBadge(job.verificationStatus)}
                          {renderSourceBadge(job.sourceType)}
                        </div>

                        {/* Description snippet */}
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {job.description || 'View details for complete job description, requirements, and responsibilities.'}
                        </p>

                        {/* Required Skills tags */}
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                            {job.requiredSkills.slice(0, 4).map((s, idx) => (
                              <span key={idx} style={{ background: 'var(--bg-card-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                                {s}
                              </span>
                            ))}
                            {job.requiredSkills.length > 4 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '2px 4px' }}>
                                +{job.requiredSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Salary and Deadline status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', padding: '0.45rem 0.65rem', borderRadius: '6px' }}>
                          <span>
                            💰 {job.salaryDisclosureStatus === 'disclosed' && job.salaryMin ? (
                              <strong style={{ color: '#10b981' }}>
                                ₹{job.salaryMin.toLocaleString('en-IN')}{job.salaryMax ? ` - ₹${job.salaryMax.toLocaleString('en-IN')}` : ''} / {job.salaryPeriod}
                              </strong>
                            ) : (
                              'Salary: Disclosed on Shortlist'
                            )}
                          </span>
                          <span>
                            {job.applicationDeadline ? (
                              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                                Closes: {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              'Deadline: Open / Rolling'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => setSelectedJobForModal(job)}
                          style={{
                            flex: 1,
                            padding: '0.55rem',
                            borderRadius: '8px',
                            background: 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button
                          onClick={() => handleToggleSave(job)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            background: saved ? 'var(--bg-card-subtle)' : 'var(--bg-input)',
                            border: saved ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            color: saved ? 'var(--primary)' : 'var(--text-dim)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleOpenApplicationLink(job)}
                          style={{
                            flex: 1.2,
                            padding: '0.55rem',
                            borderRadius: '8px',
                            background: 'var(--primary-gradient)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
                          }}
                        >
                          Apply <ExternalLink size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalJobsCount > PAGE_LIMIT && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
                <button
                  disabled={jobsPage <= 1}
                  onClick={() => setJobsPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: jobsPage <= 1 ? '#94a3b8' : '#1e293b',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: jobsPage <= 1 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                  Page {jobsPage} of {Math.ceil(totalJobsCount / PAGE_LIMIT)}
                </span>
                <button
                  disabled={!hasMoreJobs}
                  onClick={() => setJobsPage(prev => prev + 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: !hasMoreJobs ? '#94a3b8' : '#1e293b',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: !hasMoreJobs ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 2: COMPANIES SPOTLIGHT
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'companies' && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Partner Companies & Recruiters
            </h2>
            <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '0.35rem' }}>
              Explore official employer websites, campus placement partners, and direct career portals.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {companies.map((comp) => (
              <div
                key={comp._id}
                className="glass-card"
                style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                    }}>
                      {comp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {comp.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>{comp.industry || 'Technology'}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {comp.description || 'Technology enterprise and campus recruiter.'}
                  </p>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#334155' }}>Headquarters:</strong> {comp.headquarters || 'India'}
                  </div>

                  {comp.locations && comp.locations.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#334155' }}>Offices:</strong> {comp.locations.join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: '0.85rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      background: comp.activeJobCount > 0 ? '#ecfdf5' : '#f1f5f9',
                      color: comp.activeJobCount > 0 ? '#047857' : '#64748b',
                      border: comp.activeJobCount > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                    }}>
                      {comp.activeJobCount > 0 ? `${comp.activeJobCount} Available Roles` : 'Talent Network Only (0 Vacancies)'}
                    </span>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {comp.officialWebsite && (
                        <a href={comp.officialWebsite} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.76rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
                          Website ↗
                        </a>
                      )}
                      {comp.careersUrl && (
                        <a href={comp.careersUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.76rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 700 }}>
                          Careers Portal ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSearchQuery(comp.name);
                      setActiveTab('portal');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'rgba(79, 70, 229, 0.08)',
                      border: '1px solid rgba(79, 70, 229, 0.2)',
                      borderRadius: '8px',
                      color: '#4338ca',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    View Current Vacancies ({comp.activeJobCount || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 3: SAVED JOBS (SEPARATED DEDICATED VIEW)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'saved' && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bookmark size={20} color="#4f46e5" />
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Saved Opportunities
                </h2>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                Review and manage positions you have bookmarked. Apply when ready or keep track of approaching deadlines.
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 600 }}>
              {savedJobs.length} Bookmarked {savedJobs.length === 1 ? 'Role' : 'Roles'}
            </div>
          </div>

          {savedJobs.length === 0 ? (
            <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <Bookmark size={42} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                No Bookmarked Jobs Yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                Click the bookmark icon on any position in the Portal Directory or Recommendations list to save it to this private list.
              </p>
              <button
                onClick={() => setActiveTab('portal')}
                style={{
                  padding: '0.65rem 1.35rem',
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
              >
                Browse Job Directory
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {savedJobs.map((item) => {
                const job = item.jobId;
                if (!job) return null;
                return (
                  <div key={item._id || job._id} className="glass-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{job.companyName}</div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{job.title}</h4>
                        </div>
                        <button
                          onClick={() => handleToggleSave(job)}
                          title="Remove from saved"
                          style={{
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: '#475569', marginBottom: '0.85rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#64748b" /> {job.location || 'Location Not Specified'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Briefcase size={13} color="#64748b" /> {job.employmentType}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        {renderVerificationBadge(job.verificationStatus)}
                        {renderSourceBadge(job.sourceType)}
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#475569', marginBottom: '0.85rem' }}>
                        💰 <strong>Package:</strong> {job.salaryDisclosureStatus === 'disclosed' && job.salaryMin ? `₹${job.salaryMin.toLocaleString('en-IN')} / ${job.salaryPeriod}` : 'Disclosed on application'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <button
                        onClick={() => setSelectedJobForModal(job)}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#1e293b',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleOpenApplicationLink(job)}
                        style={{
                          flex: 1.3,
                          padding: '0.55rem',
                          background: 'var(--primary-gradient)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        Apply Now <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 4: APPLICATION TRACKER (SEPARATED DEDICATED VIEW)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} color="#059669" />
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  My Job Applications
                </h2>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                Keep track of application submissions, online assessments, interview stages, and offers.
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700 }}>
              {applications.length} Active {applications.length === 1 ? 'Application' : 'Applications'}
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <Send size={42} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                No Tracked Applications Yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                When you click "Apply" on any position, you can log notes and keep track of your submission status right here.
              </p>
              <button
                onClick={() => setActiveTab('portal')}
                style={{
                  padding: '0.65rem 1.35rem',
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
              >
                Find Jobs to Apply
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {applications.map((app) => {
                const job = app.jobId;
                const statusColor = 
                  app.status === 'offered' ? '#047857' :
                  app.status === 'interview' ? '#4338ca' :
                  app.status === 'assessment' ? '#0284c7' :
                  app.status === 'rejected' ? '#b91c1c' : '#b45309';

                return (
                  <div key={app._id} className="glass-card" style={{ padding: '1.35rem', borderLeft: `4px solid ${statusColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{job?.companyName || 'Employer'}</div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{job?.title || 'Job Opportunity'}</h4>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={app.status || 'applied'}
                        onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: statusColor,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          width: 'auto',
                          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
                        }}
                      >
                        <option value="interested">Interested</option>
                        <option value="applied">Applied</option>
                        <option value="assessment">Online Assessment</option>
                        <option value="interview">Interview Stage</option>
                        <option value="offered">Offer Received 🎉</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {app.notes && (
                      <div style={{ fontSize: '0.8rem', color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.55rem 0.75rem', borderRadius: '6px', margin: '0.65rem 0' }}>
                        📝 <strong>Notes:</strong> {app.notes}
                      </div>
                    )}

                    <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <span>Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-IN')}</span>
                      {job?.applicationUrl && (
                        <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          Careers Portal <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION E: JOB DETAILS MODAL (Clean Frosted White Modal)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedJobForModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '780px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.96)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)'
              }}
            >
              <button
                onClick={() => setSelectedJobForModal(null)}
                style={{
                  position: 'absolute',
                  right: '1.5rem',
                  top: '1.5rem',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                  {renderVerificationBadge(selectedJobForModal.verificationStatus)}
                  {renderSourceBadge(selectedJobForModal.sourceType)}
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    • Verified Date: {selectedJobForModal.lastVerifiedAt ? new Date(selectedJobForModal.lastVerifiedAt).toLocaleDateString('en-IN') : 'Official record'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  {selectedJobForModal.title}
                </h2>
                <div style={{ fontSize: '1.05rem', color: '#4f46e5', fontWeight: 700 }}>
                  {selectedJobForModal.companyName}
                </div>
              </div>

              {/* Key Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.15rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Location & Work Mode</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedJobForModal.location || 'Location Not Disclosed'} ({selectedJobForModal.workMode || 'onsite'})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Employment & Level</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedJobForModal.employmentType} • {selectedJobForModal.experienceLevel}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Salary Package</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selectedJobForModal.salaryDisclosureStatus === 'disclosed' ? '#047857' : '#475569' }}>
                    {selectedJobForModal.salaryDisclosureStatus === 'disclosed' && selectedJobForModal.salaryMin
                      ? `₹${selectedJobForModal.salaryMin.toLocaleString('en-IN')} - ₹${selectedJobForModal.salaryMax?.toLocaleString('en-IN') || ''} / ${selectedJobForModal.salaryPeriod}`
                      : 'Disclosed during interview'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Application Deadline</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selectedJobForModal.applicationDeadline ? '#b45309' : '#475569' }}>
                    {selectedJobForModal.applicationDeadline ? new Date(selectedJobForModal.applicationDeadline).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Rolling admissions / Not closed'}
                  </div>
                </div>
              </div>

              {/* Academic Eligibility Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={16} color="#4f46e5" /> Academic Eligibility Criteria
                </h4>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.95rem', fontSize: '0.82rem', lineHeight: 1.6, color: '#334155' }}>
                  <div><strong>Eligible Degrees:</strong> {selectedJobForModal.eligibleDegrees?.length ? selectedJobForModal.eligibleDegrees.join(', ') : 'All Technical / Professional Degrees'}</div>
                  <div><strong>Eligible Branches:</strong> {selectedJobForModal.eligibleBranches?.length ? selectedJobForModal.eligibleBranches.join(', ') : 'All Engineering / Computer Science Branches'}</div>
                  <div><strong>Graduation Batches:</strong> {selectedJobForModal.eligibleGraduationYears?.length ? selectedJobForModal.eligibleGraduationYears.join(', ') : 'Open to upcoming and recent graduates'}</div>
                  <div><strong>Minimum CGPA:</strong> {selectedJobForModal.minimumCGPA ? `${selectedJobForModal.minimumCGPA} CGPA` : 'No hard minimum cutoff stated'}</div>
                  <div><strong>Service Agreement / Bond:</strong> {selectedJobForModal.bondStatus === 'has_bond' ? `${selectedJobForModal.bondDuration || 'Standard agreement'}: ${selectedJobForModal.bondTerms || 'Details on offer'}` : 'No service bond required'}</div>
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Technical Skills & Competencies
                </h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Required Skills:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {selectedJobForModal.requiredSkills?.map((s, idx) => (
                      <span key={idx} style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedJobForModal.preferredSkills?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Preferred Skills:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedJobForModal.preferredSkills.map((s, idx) => (
                        <span key={idx} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description & Responsibilities */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Role Overview
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  {selectedJobForModal.description}
                </p>

                {selectedJobForModal.responsibilities?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Key Responsibilities:</div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                      {selectedJobForModal.responsibilities.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Selection Stages */}
              {selectedJobForModal.hiringStages?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Selection & Interview Stages
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJobForModal.hiringStages.map((stage, idx) => (
                      <span key={idx} style={{ background: '#cffafe', border: '1px solid #a5f3fc', color: '#0e7490', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                        Step {idx + 1}: {stage}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Bottom Actions */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <button
                  onClick={() => handleToggleSave(selectedJobForModal)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    background: isJobSaved(selectedJobForModal._id) ? '#e0e7ff' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: isJobSaved(selectedJobForModal._id) ? '#4338ca' : '#334155',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Bookmark size={16} fill={isJobSaved(selectedJobForModal._id) ? '#4338ca' : 'none'} />
                  {isJobSaved(selectedJobForModal._id) ? 'Saved' : 'Save Job'}
                </button>

                <button
                  onClick={() => handleOpenApplicationLink(selectedJobForModal)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    background: 'var(--primary-gradient)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  Open Official Application Link <ExternalLink size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          TRACK APPLICATION MODAL (Follow-up when clicking Apply)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {trackingModalJob && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '1.75rem',
                background: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#ecfdf5', padding: '0.6rem', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                  <Send size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Track Your Application
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
                    We opened the employer's official careers link in a new tab.
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#0f172a' }}>{trackingModalJob.title}</strong>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{trackingModalJob.companyName}</div>
              </div>

              <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 600, marginBottom: '0.4rem' }}>
                Application Notes (Optional — e.g. Resume version used, interview date):
              </label>
              <textarea
                value={trackingNotes}
                onChange={(e) => setTrackingNotes(e.target.value)}
                placeholder="e.g. Applied via official careers portal. Resume v2 submitted."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  resize: 'none',
                  outline: 'none',
                  marginBottom: '1.25rem',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setTrackingModalJob(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Skip Tracking
                </button>
                <button
                  onClick={handleConfirmTracking}
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  Save to My Applications
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
