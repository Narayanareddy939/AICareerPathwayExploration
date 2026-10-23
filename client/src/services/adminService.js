import api from './api';

export const adminService = {
  // Overview & KPIs
  getOverview: async () => {
    const res = await api.get('/admin-v2/overview');
    return res.data;
  },

  // Students Directory
  getStudents: async (params = {}) => {
    const res = await api.get('/admin-v2/students', { params });
    return res.data;
  },

  // Companies Management & Verification
  getCompanies: async (params = {}) => {
    const res = await api.get('/admin-v2/companies', { params });
    return res.data;
  },

  verifyCompany: async (id, payload, reason = '') => {
    const body = typeof payload === 'string' ? { verificationStatus: payload, reason } : payload;
    const res = await api.patch(`/admin-v2/companies/${id}/verify`, body);
    return res.data;
  },

  updateCompanyStatus: async (id, payload, reason = '') => {
    const body = typeof payload === 'string' ? { status: payload, reason } : payload;
    const res = await api.patch(`/admin-v2/companies/${id}/status`, body);
    return res.data;
  },

  // Jobs Moderation
  getJobs: async (params = {}) => {
    const res = await api.get('/admin-v2/jobs', { params });
    return res.data;
  },

  verifyJob: async (id, payload, reason = '') => {
    const body = typeof payload === 'string'
      ? { verificationStatus: payload, reason }
      : { ...payload, verificationStatus: payload.verificationStatus || (payload.isVerified ? 'officially_verified' : 'pending_review') };
    delete body.isVerified;
    const res = await api.patch(`/admin-v2/jobs/${id}/verify`, body);
    return res.data;
  },

  deleteJob: async (id) => {
    const res = await api.delete(`/admin-v2/jobs/${id}`);
    return res.data;
  },

  // Platform Applications Audit
  getApplications: async (params = {}) => {
    const res = await api.get('/admin-v2/applications', { params });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/admin-v2/audit-logs', { params });
    return res.data;
  }
};

export default adminService;
