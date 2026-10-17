import api from './api';

export const portalService = {
  // Recommendations
  getRecommendedJobs: async (params = {}) => {
    const res = await api.get('/portal/jobs/recommended', { params });
    return res.data;
  },

  // Jobs
  getJobs: async (params = {}) => {
    const res = await api.get('/portal/jobs', { params });
    return res.data;
  },

  getJobById: async (id) => {
    const res = await api.get(`/portal/jobs/${id}`);
    return res.data;
  },

  // Companies
  getCompanies: async (params = {}) => {
    const res = await api.get('/portal/companies', { params });
    return res.data;
  },

  getCompanyById: async (id) => {
    const res = await api.get(`/portal/companies/${id}`);
    return res.data;
  },

  // Saved Jobs & Tracking
  getSavedJobs: async (params = {}) => {
    const res = await api.get('/portal/saved-jobs', { params });
    return res.data;
  },

  saveJob: async (jobId) => {
    const res = await api.post(`/portal/jobs/${jobId}/save`);
    return res.data;
  },

  unsaveJob: async (jobId) => {
    const res = await api.delete(`/portal/jobs/${jobId}/save`);
    return res.data;
  },

  getApplications: async () => {
    const res = await api.get('/portal/applications');
    return res.data;
  },

  trackApplication: async (jobId, notes = '') => {
    const res = await api.post(`/portal/jobs/${jobId}/application-tracking`, { notes });
    return res.data;
  },

  updateApplicationStatus: async (applicationId, status, notes = '') => {
    const res = await api.patch(`/portal/applications/${applicationId}`, { status, notes });
    return res.data;
  }
};

export default portalService;
