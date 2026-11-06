import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowUpRight, Ban, BriefcaseBusiness, Building2,
  Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, ExternalLink,
  FileCheck2, FileText, GraduationCap, LayoutDashboard, LogOut, MapPin, RefreshCw,
  Search, ShieldCheck, ShieldX, Users, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import './AdminConsole.css';

const PAGE_SIZE = 12;

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'audit', label: 'Activity log', icon: ClipboardList }
];

const LIST_SERVICES = {
  companies: adminService.getCompanies,
  students: adminService.getStudents,
  jobs: adminService.getJobs,
  applications: adminService.getApplications,
  audit: adminService.getAuditLogs
};

const STATUS_LABELS = {
  officially_verified: 'Verified',
  pending_review: 'Pending review',
  source_checked: 'Source checked',
  verification_unavailable: 'Unverified source',
  interview_scheduled: 'Interview scheduled',
  interview: 'Interview',
  assessment: 'Assessment',
  under_review: 'Under review',
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  selected: 'Selected',
  offered: 'Offer made',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  profile_complete: 'Complete',
  profile_incomplete: 'Incomplete',
  active: 'Active',
  suspended: 'Suspended',
  draft: 'Draft'
};

function unwrapList(response) {
  const raw = response?.data;
  const items = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.companies)
      ? raw.companies
      : (Array.isArray(raw?.jobs)
        ? raw.jobs
        : (Array.isArray(raw?.students)
          ? raw.students
          : (Array.isArray(raw?.applications) ? raw.applications : []))));
  return {
    items,
    pagination: response?.pagination || { page: 1, totalPages: 1, total: items.length, limit: PAGE_SIZE }
  };
}

function displayStatus(status) {
  return STATUS_LABELS[status] || String(status || 'Unknown').replaceAll('_', ' ');
}

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function companyName(company) {
  return company?.name || company?.companyName || 'Company not provided';
}

function companyEmail(company) {
  return company?.createdBy?.email || company?.contactEmail || 'No email provided';
}

function personName(student) {
  return student?.fullName || student?.name || student?.userId?.fullName || 'Student account';
}

function applicationStudent(application) {
  return {
    ...(application?.studentId || {}),
    ...(application?.applicantData || {}),
    fullName: application?.applicantData?.fullName || application?.studentId?.fullName,
    email: application?.applicantData?.email || application?.studentId?.email,
    branch: application?.applicantData?.branch || application?.studentId?.branch,
    degree: application?.applicantData?.degree || application?.studentId?.degree
  };
}

function StatusBadge({ status }) {
  const tone = status === 'officially_verified' || status === 'active' || status === 'selected' || status === 'offered' || status === 'profile_complete'
    ? 'good'
    : status === 'pending_review' || status === 'applied' || status === 'under_review' || status === 'interview_scheduled' || status === 'profile_incomplete'
      ? 'pending'
      : status === 'rejected' || status === 'suspended'
        ? 'bad'
        : 'neutral';

  return <span className={`ac-status ac-status-${tone}`}>{displayStatus(status)}</span>;
}

function EmptyState({ children }) {
  return <div className="ac-empty">{children}</div>;
}

function AdminConsole() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [sections, setSections] = useState({});
  const [pageInfo, setPageInfo] = useState({});
  const [searchValues, setSearchValues] = useState({});
  const [statusFilters, setStatusFilters] = useState({});
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingSection, setLoadingSection] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    email: '',
    password: '',
    industry: 'Technology & Software',
    headquarters: 'Bengaluru, India',
    officialWebsite: '',
    description: '',
    verificationStatus: 'officially_verified'
  });

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyForm.name.trim() || !newCompanyForm.email.trim() || !newCompanyForm.password.trim()) {
      toast.error('Company Name, Email, and Password are required');
      return;
    }
    setCreatingCompany(true);
    try {
      const res = await adminService.createCompany(newCompanyForm);
      if (res?.success) {
        toast.success(`Company "${newCompanyForm.name}" & recruiter credentials created!`);
        setShowAddCompanyModal(false);
        setNewCompanyForm({
          name: '',
          email: '',
          password: '',
          industry: 'Technology & Software',
          headquarters: 'Bengaluru, India',
          officialWebsite: '',
          description: '',
          verificationStatus: 'officially_verified'
        });
        await refreshCurrentView();
      } else {
        toast.error(res?.message || 'Failed to create company');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create company');
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleDeleteCompany = async (companyId, compName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${compName}" and its job listings?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminService.deleteCompany(companyId);
      if (res?.success) {
        toast.success(`Company "${compName}" deleted`);
        setSelectedCompany(null);
        await refreshCurrentView();
      } else {
        toast.error(res?.message || 'Failed to delete company');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete company');
    } finally {
      setActionLoading(false);
    }
  };

  const loadOverview = async () => {
    setLoadingOverview(true);
    setLoadError('');
    const [overviewResult, companiesResult, applicationsResult, activityResult] = await Promise.allSettled([
      adminService.getOverview(),
      adminService.getCompanies({ verificationStatus: 'pending_review', page: 1, limit: 6 }),
      adminService.getApplications({ page: 1, limit: 6 }),
      adminService.getAuditLogs({ page: 1, limit: 6 })
    ]);

    if (overviewResult.status === 'fulfilled' && overviewResult.value?.success) {
      setOverview(overviewResult.value.data);
    } else {
      setLoadError('The platform summary could not be loaded. Check the API connection and refresh.');
    }

    if (companiesResult.status === 'fulfilled' && companiesResult.value?.success) {
      setPendingCompanies(unwrapList(companiesResult.value).items);
    }
    if (applicationsResult.status === 'fulfilled' && applicationsResult.value?.success) {
      setRecentApplications(unwrapList(applicationsResult.value).items);
    }
    if (activityResult.status === 'fulfilled' && activityResult.value?.success) {
      setRecentActivity(unwrapList(activityResult.value).items);
    }

    setLoadingOverview(false);
  };

  const loadSection = async (section, page = 1, filterOverride = null, searchOverride = null) => {
    const service = LIST_SERVICES[section];
    if (!service) return;

    setLoadingSection(true);
    const params = { page, limit: PAGE_SIZE };
    const search = searchOverride !== null ? searchOverride : (searchValues[section]?.trim() || '');
    const status = filterOverride !== null ? filterOverride : (statusFilters[section] || '');
    if (search) params.search = search;
    if (section === 'companies' && status) {
      if (status === 'suspended') {
        params.status = 'suspended';
      } else {
        params.verificationStatus = status;
      }
    }
    if (section === 'jobs' && status) params.status = status;
    if (section === 'applications' && status) params.status = status;

    try {
      const response = await service(params);
      if (!response?.success) throw new Error(response?.message || 'The request failed.');
      const result = unwrapList(response);
      setSections(current => ({ ...current, [section]: result.items }));
      setPageInfo(current => ({ ...current, [section]: result.pagination }));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || `Could not load ${section}.`);
    } finally {
      setLoadingSection(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeView !== 'overview') loadSection(activeView, 1);
  }, [activeView]);

  const refreshCurrentView = async () => {
    await loadOverview();
    if (activeView !== 'overview') {
      await loadSection(activeView, pageInfo[activeView]?.page || 1);
    }
  };

  const runCompanyAction = async (verificationStatus) => {
    if (!selectedCompany) return;
    setActionLoading(true);
    try {
      const response = await adminService.verifyCompany(selectedCompany._id, {
        verificationStatus,
        reason: reviewReason.trim()
      });
      if (!response?.success) throw new Error(response?.message || 'Verification update failed.');
      toast.success(`${companyName(selectedCompany)}: ${displayStatus(verificationStatus).toLowerCase()}`);
      setSelectedCompany(null);
      setReviewReason('');
      await loadOverview();
      if (activeView === 'companies') await loadSection('companies', pageInfo.companies?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Verification update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const runCompanyStatusAction = async (company) => {
    const nextStatus = company.status === 'suspended' ? 'active' : 'suspended';
    setActionLoading(true);
    try {
      const response = await adminService.updateCompanyStatus(company._id, {
        status: nextStatus,
        reason: reviewReason.trim()
      });
      if (!response?.success) throw new Error(response?.message || 'Company status update failed.');
      toast.success(`${companyName(company)} is now ${displayStatus(nextStatus).toLowerCase()}.`);
      setSelectedCompany(null);
      setReviewReason('');
      await loadOverview();
      if (activeView === 'companies') await loadSection('companies', pageInfo.companies?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Company status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const kpis = overview?.kpis || {};
  const pendingCount = kpis.pendingCompanyVerifications || 0;
  const applications = overview?.kpis?.totalApplications || 0;

  const metrics = [
    { label: 'Registered students', value: kpis.totalStudents, detail: 'All student accounts', icon: Users, tone: 'green' },
    { label: 'Companies', value: kpis.totalCompanies, detail: `${kpis.totalRecruiters ?? 0} recruiter accounts`, icon: Building2, tone: 'blue' },
    { label: 'Awaiting verification', value: pendingCount, detail: 'Company reviews required', icon: ShieldCheck, tone: 'amber' },
    { label: 'Active job listings', value: kpis.activeJobs, detail: `${kpis.totalJobs ?? 0} total listings`, icon: BriefcaseBusiness, tone: 'teal' },
    { label: 'Applications', value: applications, detail: `${kpis.shortlistedCount ?? 0} shortlisted`, icon: FileCheck2, tone: 'red' }
  ];

  const sectionTitle = NAV_ITEMS.find(item => item.id === activeView)?.label || 'Overview';
  const activePage = pageInfo[activeView] || { page: 1, totalPages: 1, total: 0 };
  const currentRows = sections[activeView] || [];

  return (
    <div className="ac-shell">
      <aside className="ac-sidebar">
        <a className="ac-brand" href="/admin" onClick={event => { event.preventDefault(); setActiveView('overview'); }}>
          <span className="ac-brand-mark"><Activity size={18} /></span>
          <span><strong>AI Career</strong><small>Platform administration</small></span>
        </a>

        <div className="ac-nav-label">WORKSPACE</div>
        <nav className="ac-nav" aria-label="Admin sections">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                className={`ac-nav-item ${activeView === item.id ? 'is-active' : ''}`}
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.id === 'companies' && pendingCount > 0 && <span className="ac-nav-count">{pendingCount}</span>}
              </button>
            );
          })}
        </nav>

        <div className="ac-sidebar-bottom">
          <div className="ac-admin-identity">
            <span className="ac-avatar">{(user?.fullName || 'A').slice(0, 1).toUpperCase()}</span>
            <span><strong>{user?.fullName || 'Administrator'}</strong><small>Platform admin</small></span>
          </div>
          <button className="ac-signout" type="button" onClick={signOut}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <main className="ac-main">
        <header className="ac-topbar">
          <div className="ac-breadcrumb"><span>Administration</span><span className="ac-breadcrumb-separator">/</span><strong>{sectionTitle}</strong></div>
          <div className="ac-topbar-actions">
            <span className="ac-admin-email">{user?.email || 'Administrator account'}</span>
            <button className="ac-button ac-button-quiet" type="button" onClick={refreshCurrentView} disabled={loadingOverview || loadingSection}>
              <RefreshCw size={15} className={loadingOverview || loadingSection ? 'ac-spin' : ''} />
              Refresh data
            </button>
          </div>
        </header>

        <div className="ac-mobile-nav" aria-label="Admin sections">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={activeView === item.id ? 'is-active' : ''} onClick={() => setActiveView(item.id)} type="button">{item.label}</button>
          ))}
        </div>

        <div className="ac-content">
          {activeView === 'overview' ? (
            <>
              <section className="ac-page-heading">
                <div>
                  <div className="ac-eyebrow">Platform operations</div>
                  <h1>Administration overview</h1>
                  <p>Review registrations, company verification, hiring activity, and application progress.</p>
                </div>
                {pendingCount > 0 && <button className="ac-review-callout" onClick={() => setActiveView('companies')} type="button"><ShieldCheck size={17} /> {pendingCount} companies need review <ArrowUpRight size={15} /></button>}
              </section>

              {loadError && <div className="ac-error" role="alert">{loadError}<button type="button" onClick={loadOverview}>Try again</button></div>}

              <section className="ac-metrics" aria-label="Database overview">
                {metrics.map(metric => {
                  const Icon = metric.icon;
                  return (
                    <article className="ac-metric" key={metric.label}>
                      <div className={`ac-metric-icon tone-${metric.tone}`}><Icon size={18} /></div>
                      <div className="ac-metric-label">{metric.label}</div>
                      <div className="ac-metric-value">{loadingOverview && metric.value === undefined ? '...' : metric.value ?? 0}</div>
                      <div className="ac-metric-detail">{metric.detail}</div>
                    </article>
                  );
                })}
              </section>

              <div className="ac-overview-grid">
                <section className="ac-panel">
                  <div className="ac-panel-heading">
                    <div><div className="ac-eyebrow">Company review queue</div><h2>Needs verification</h2></div>
                    <button className="ac-text-button" type="button" onClick={() => setActiveView('companies')}>All companies <ArrowUpRight size={14} /></button>
                  </div>
                  {pendingCompanies.length === 0 ? (
                    <EmptyState>No companies are awaiting verification.</EmptyState>
                  ) : (
                    <div className="ac-review-list">
                      {pendingCompanies.map(company => (
                        <div className="ac-review-row" key={company._id}>
                          <div className="ac-company-avatar">{companyName(company).slice(0, 1).toUpperCase()}</div>
                          <div className="ac-review-company">
                            <strong>{companyName(company)}</strong>
                            <span>{company.industry || 'Industry not listed'}{company.headquarters ? ` · ${company.headquarters}` : ''}</span>
                          </div>
                          <StatusBadge status={company.verificationStatus} />
                          <button className="ac-button ac-button-small" type="button" onClick={() => { setSelectedCompany(company); setReviewReason(''); }}>Review</button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="ac-panel">
                  <div className="ac-panel-heading">
                    <div><div className="ac-eyebrow">Hiring activity</div><h2>Recent applications</h2></div>
                    <button className="ac-text-button" type="button" onClick={() => setActiveView('applications')}>All applications <ArrowUpRight size={14} /></button>
                  </div>
                  {recentApplications.length === 0 ? (
                    <EmptyState>No student applications have been submitted yet.</EmptyState>
                  ) : (
                    <div className="ac-recent-list">
                      {recentApplications.map(application => {
                        const student = applicationStudent(application);
                        return (
                          <div className="ac-recent-row" key={application._id}>
                            <span className="ac-avatar ac-avatar-small">{personName(student).slice(0, 1).toUpperCase()}</span>
                            <div className="ac-recent-copy"><strong>{personName(student)}</strong><span>{application.jobId?.title || 'Position'} · {companyName(application.companyId)}</span></div>
                            <StatusBadge status={application.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              <section className="ac-panel ac-activity-panel">
                <div className="ac-panel-heading">
                  <div><div className="ac-eyebrow">Administrative record</div><h2>Recent activity</h2></div>
                  <button className="ac-text-button" type="button" onClick={() => setActiveView('audit')}>Open activity log <ArrowUpRight size={14} /></button>
                </div>
                {recentActivity.length === 0 ? (
                  <EmptyState>No audit events have been recorded yet.</EmptyState>
                ) : (
                  <div className="ac-activity-table">
                    {recentActivity.map(item => (
                      <div className="ac-activity-row" key={item._id}>
                        <span className="ac-activity-dot" />
                        <strong>{displayStatus(item.action)}</strong>
                        <span>{item.entityType?.replaceAll('_', ' ') || 'Platform record'}</span>
                        <span>{item.actorEmail || 'System'}</span>
                        <time dateTime={item.createdAt}>{displayDate(item.createdAt)}</time>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="ac-page-heading ac-list-heading">
                <div>
                  <div className="ac-eyebrow">Database directory</div>
                  <h1>{sectionTitle}</h1>
                  <p>{activeView === 'companies' ? 'Inspect employer details and decide whether to verify their organization.' : `Search and review ${sectionTitle.toLowerCase()} stored in the platform database.`}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {activeView === 'companies' && (
                    <button
                      type="button"
                      className="ac-button"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 700,
                        padding: '0.55rem 1rem',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                      }}
                      onClick={() => setShowAddCompanyModal(true)}
                    >
                      <Plus size={16} /> Add Company Credentials
                    </button>
                  )}
                  <div className="ac-result-total">{activePage.total ?? currentRows.length} records</div>
                </div>
              </section>

              <section className="ac-panel ac-directory-panel">
                <form className="ac-toolbar" onSubmit={event => { event.preventDefault(); loadSection(activeView, 1); }}>
                  {activeView !== 'audit' && (
                    <label className="ac-search-field">
                      <Search size={16} />
                      <input
                        type="search"
                        placeholder={`Search ${activeView}...`}
                        value={searchValues[activeView] || ''}
                        onChange={event => {
                          const val = event.target.value;
                          setSearchValues(current => ({ ...current, [activeView]: val }));
                          if (val === '') {
                            loadSection(activeView, 1, null, '');
                          }
                        }}
                      />
                    </label>
                  )}
                  {['companies', 'jobs', 'applications'].includes(activeView) && (
                    <select
                      className="ac-filter-select"
                      value={statusFilters[activeView] || ''}
                      onChange={event => {
                        const newFilter = event.target.value;
                        setStatusFilters(current => ({ ...current, [activeView]: newFilter }));
                        loadSection(activeView, 1, newFilter);
                      }}
                    >
                      {activeView === 'companies' ? <>
                        <option value="">All verification states</option><option value="pending_review">Pending review</option><option value="officially_verified">Verified</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option>
                      </> : activeView === 'jobs' ? <>
                        <option value="">All job states</option><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option>
                      </> : <>
                        <option value="">All application states</option><option value="applied">Applied</option><option value="under_review">Under review</option><option value="shortlisted">Shortlisted</option><option value="interview_scheduled">Interview scheduled</option><option value="selected">Selected</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option>
                      </>}
                    </select>
                  )}
                  {activeView !== 'audit' && <button className="ac-button ac-button-primary" type="submit"><Search size={15} /> Search</button>}
                </form>

                {loadingSection ? <div className="ac-loading"><span className="ac-spinner" /> Loading database records...</div> : (
                  <>
                    {activeView === 'companies' && <CompaniesTable rows={currentRows} onReview={company => { setSelectedCompany(company); setReviewReason(''); }} />}
                    {activeView === 'students' && <StudentsTable rows={currentRows} />}
                    {activeView === 'jobs' && <JobsTable rows={currentRows} />}
                    {activeView === 'applications' && <ApplicationsTable rows={currentRows} />}
                    {activeView === 'audit' && <AuditTable rows={currentRows} />}
                    {currentRows.length === 0 && <EmptyState>No matching {activeView} were found.</EmptyState>}
                    <div className="ac-pagination">
                      <span>Page {activePage.page || 1} of {activePage.totalPages || 1}</span>
                      <div>
                        <button type="button" aria-label="Previous page" disabled={(activePage.page || 1) <= 1} onClick={() => loadSection(activeView, activePage.page - 1)}><ChevronLeft size={17} /></button>
                        <button type="button" aria-label="Next page" disabled={(activePage.page || 1) >= (activePage.totalPages || 1)} onClick={() => loadSection(activeView, activePage.page + 1)}><ChevronRight size={17} /></button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      
      {/* Modal: Add New Company & Recruiter Credentials */}
      {showAddCompanyModal && (
        <div className="ac-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowAddCompanyModal(false); }}>
          <section className="ac-company-drawer" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem' }} role="dialog" aria-modal="true">
            <header className="ac-drawer-header" style={{ marginBottom: '1.25rem' }}>
              <div>
                <div className="ac-eyebrow" style={{ color: '#10b981' }}>Platform Admin Onboarding</div>
                <h2>Add Company & Credentials</h2>
              </div>
              <button type="button" className="ac-icon-button" onClick={() => setShowAddCompanyModal(false)}><X size={18} /></button>
            </header>

            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  COMPANY / ORGANIZATION NAME *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google India, Infosys, Tech Mahindra"
                  value={newCompanyForm.name}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    RECRUITER LOGIN EMAIL *
                  </label>
                  <input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={newCompanyForm.email}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    INITIAL PASSWORD *
                  </label>
                  <input
                    type="text"
                    placeholder="Min. 6 chars"
                    value={newCompanyForm.password}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, password: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    INDUSTRY
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technology & Cloud"
                    value={newCompanyForm.industry}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    HEADQUARTERS / LOCATION
                  </label>
                  <input
                    type="text"
                    placeholder="Bengaluru, India"
                    value={newCompanyForm.headquarters}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, headquarters: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    OFFICIAL WEBSITE
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={newCompanyForm.officialWebsite}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, officialWebsite: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    VERIFICATION STATUS
                  </label>
                  <select
                    value={newCompanyForm.verificationStatus}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, verificationStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                  >
                    <option value="officially_verified">Verified (Recommended)</option>
                    <option value="pending_review">Pending Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  DESCRIPTION / RECRUITMENT SCOPE
                </label>
                <textarea
                  rows="3"
                  placeholder="Official recruitment profile created by administrator..."
                  value={newCompanyForm.description}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="ac-button"
                  onClick={() => setShowAddCompanyModal(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCompany}
                  className="ac-button ac-button-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none' }}
                >
                  {creatingCompany ? 'Creating Account...' : 'Create Company & Credentials'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedCompany && (
        <div className="ac-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedCompany(null); }}>
          <section className="ac-company-drawer" role="dialog" aria-modal="true" aria-labelledby="ac-company-title">
            <header className="ac-drawer-header">
              <div><div className="ac-eyebrow">Employer verification</div><h2 id="ac-company-title">{companyName(selectedCompany)}</h2></div>
              <button type="button" className="ac-icon-button" aria-label="Close company details" onClick={() => setSelectedCompany(null)}><X size={18} /></button>
            </header>
            <div className="ac-drawer-status"><StatusBadge status={selectedCompany.verificationStatus} /><StatusBadge status={selectedCompany.status} /></div>
            <dl className="ac-company-details">
              <div><dt>Recruiter</dt><dd>{selectedCompany.createdBy?.fullName || 'Not provided'}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${companyEmail(selectedCompany)}`}>{companyEmail(selectedCompany)}</a></dd></div>
              <div><dt>Industry</dt><dd>{selectedCompany.industry || 'Not provided'}</dd></div>
              <div><dt>Headquarters</dt><dd>{selectedCompany.headquarters || 'Not provided'}</dd></div>
              <div><dt>Contact phone</dt><dd>{selectedCompany.contactPhone || 'Not provided'}</dd></div>
              <div><dt>Submitted</dt><dd>{displayDate(selectedCompany.createdAt)}</dd></div>
              <div><dt>Jobs posted</dt><dd>{selectedCompany.totalJobs ?? 0}</dd></div>
              <div><dt>Applications</dt><dd>{selectedCompany.totalApplications ?? 0}</dd></div>
              <div className="ac-detail-wide"><dt>Company description</dt><dd>{selectedCompany.description || 'No company description provided.'}</dd></div>
              {selectedCompany.officialWebsite && <div className="ac-detail-wide"><dt>Official website</dt><dd><a href={selectedCompany.officialWebsite} target="_blank" rel="noreferrer">{selectedCompany.officialWebsite} <ExternalLink size={13} /></a></dd></div>}
              {selectedCompany.officialSourceUrl && <div className="ac-detail-wide"><dt>Verification source</dt><dd><a href={selectedCompany.officialSourceUrl} target="_blank" rel="noreferrer">Open source record <ExternalLink size={13} /></a></dd></div>}
            </dl>
            <label className="ac-reason-field">Review note <span>Optional; recorded in the audit log</span><textarea rows="3" value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Add a reason or verification note" /></label>
            <div className="ac-drawer-actions">
              <button className="ac-button ac-button-danger" type="button" disabled={actionLoading || selectedCompany.verificationStatus === 'rejected'} onClick={() => runCompanyAction('rejected')}><ShieldX size={16} /> Reject</button>
              <button className="ac-button ac-button-primary" type="button" disabled={actionLoading || selectedCompany.verificationStatus === 'officially_verified'} onClick={() => runCompanyAction('officially_verified')}><Check size={16} /> Approve company</button>
            </div>
            <button className="ac-suspend-button" type="button" disabled={actionLoading} onClick={() => runCompanyStatusAction(selectedCompany)}>
              {selectedCompany.status === 'suspended' ? <><CheckCircle2 size={15} /> Reactivate company</> : <><Ban size={15} /> Suspend company account</>}
            </button>
            <button
              className="ac-button"
              type="button"
              disabled={actionLoading}
              style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', marginTop: '0.6rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 600 }}
              onClick={() => handleDeleteCompany(selectedCompany._id, companyName(selectedCompany))}
            >
              <Trash2 size={15} /> Delete Company & Associated Data
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

function CompaniesTable({ rows, onReview }) {
  return (
    <div className="ac-table-scroll"><table className="ac-table">
      <thead><tr><th>Company</th><th>Recruiter contact</th><th>Industry / location</th><th>Activity</th><th>Verification</th><th /></tr></thead>
      <tbody>{rows.map(company => (
        <tr key={company._id}>
          <td><strong>{companyName(company)}</strong><small>{company.officialWebsite || 'Website not provided'}</small></td>
          <td>{company.createdBy?.fullName || 'Recruiter'}<small>{companyEmail(company)}</small></td>
          <td>{company.industry || '—'}<small><MapPin size={12} /> {company.headquarters || 'Location not provided'}</small></td>
          <td>{company.totalJobs ?? 0} jobs<small>{company.totalApplications ?? 0} applications</small></td>
          <td><StatusBadge status={company.verificationStatus} /></td>
          <td><button className="ac-button ac-button-small" type="button" onClick={() => onReview(company)}>Review <ArrowUpRight size={14} /></button></td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function StudentsTable({ rows }) {
  return (
    <div className="ac-table-scroll"><table className="ac-table">
      <thead><tr><th>Student</th><th>Academic profile</th><th>Career target</th><th>Profile</th><th>Registered</th></tr></thead>
      <tbody>{rows.map(student => (
        <tr key={student.userId?._id || student._id}>
          <td><strong>{personName(student)}</strong><small>{student.email || student.userId?.email || 'No email provided'}</small></td>
          <td>{student.branch || 'Not completed'}<small>{student.university || 'Institution not provided'}{student.cgpa ? ` · CGPA ${student.cgpa}` : ''}</small></td>
          <td>{student.careerGoal || 'Not specified'}<small>{student.skills?.length || 0} listed skills</small></td>
          <td><StatusBadge status={student.profileCompleted ? 'profile_complete' : 'profile_incomplete'} /></td>
          <td>{displayDate(student.createdAt || student.userId?.createdAt)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function JobsTable({ rows }) {
  return (
    <div className="ac-table-scroll"><table className="ac-table">
      <thead><tr><th>Position</th><th>Employer</th><th>Workplace</th><th>Job status</th><th>Verification</th><th>Posted</th></tr></thead>
      <tbody>{rows.map(job => (
        <tr key={job._id}>
          <td><strong>{job.title}</strong><small>{job.employmentType?.replaceAll('_', ' ') || 'Employment type not listed'}</small></td>
          <td>{companyName(job.companyId) === 'Company not provided' ? job.companyName : companyName(job.companyId)}<small>{job.sourceType?.replaceAll('_', ' ') || 'Platform listing'}</small></td>
          <td>{job.location || 'Not specified'}<small>{job.workMode?.replaceAll('_', ' ') || 'Work mode not listed'}</small></td>
          <td><StatusBadge status={job.status} /></td>
          <td><StatusBadge status={job.verificationStatus} /></td>
          <td>{displayDate(job.postedAt || job.createdAt)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function ApplicationsTable({ rows }) {
  return (
    <div className="ac-table-scroll"><table className="ac-table">
      <thead><tr><th>Applicant</th><th>Position</th><th>Company</th><th>Application status</th><th>Submitted</th></tr></thead>
      <tbody>{rows.map(application => {
        const student = applicationStudent(application);
        return <tr key={application._id}>
          <td><strong>{personName(student)}</strong><small>{student.email || 'No email provided'}</small></td>
          <td>{application.jobId?.title || 'Position unavailable'}<small>{student.branch || student.degree || 'Academic details unavailable'}</small></td>
          <td>{companyName(application.companyId) === 'Company not provided' ? application.jobId?.companyName || 'Company unavailable' : companyName(application.companyId)}</td>
          <td><StatusBadge status={application.status} /></td>
          <td>{displayDate(application.appliedAt || application.createdAt)}</td>
        </tr>;
      })}</tbody>
    </table></div>
  );
}

function AuditTable({ rows }) {
  return (
    <div className="ac-table-scroll"><table className="ac-table">
      <thead><tr><th>Event</th><th>Record</th><th>Administrator</th><th>Review note</th><th>Date</th></tr></thead>
      <tbody>{rows.map(item => (
        <tr key={item._id}>
          <td><strong>{displayStatus(item.action)}</strong></td>
          <td>{item.entityType?.replaceAll('_', ' ') || 'Platform record'}<small>{item.entityId || '—'}</small></td>
          <td>{item.actorEmail || 'System'}</td>
          <td>{item.reason || '—'}</td>
          <td>{displayDate(item.createdAt)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export default AdminConsole;
