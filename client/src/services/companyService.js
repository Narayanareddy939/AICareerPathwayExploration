import api from './api';

export const companyService = {
  // Company Profile
  getProfile: async () => {
    const res = await api.get('/company/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/company/profile', data);
    return res.data;
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post('/company/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Recruiter Dashboard Stats
  getStats: async () => {
    const res = await api.get('/company/stats');
    return res.data;
  },

  // Job Management
  getJobs: async (params = {}) => {
    const res = await api.get('/company/jobs', { params });
    return res.data;
  },

  getJobById: async (id) => {
    const res = await api.get(`/company/jobs/${id}`);
    return res.data;
  },

  createJob: async (jobData) => {
    const res = await api.post('/company/jobs', jobData);
    return res.data;
  },

  updateJob: async (id, jobData) => {
    const res = await api.put(`/company/jobs/${id}`, jobData);
    return res.data;
  },

  updateJobStatus: async (id, status) => {
    const res = await api.patch(`/company/jobs/${id}/status`, { status });
    return res.data;
  },

  deleteJob: async (id) => {
    const res = await api.delete(`/company/jobs/${id}`);
    return res.data;
  },

  // Applicants Management
  getApplicants: async (params = {}) => {
    const res = await api.get('/company/applicants', { params });
    return res.data;
  },

  updateApplicationStatus: async (applicationId, status, note = '') => {
    const res = await api.patch(`/company/applications/${applicationId}/status`, { status, note });
    return res.data;
  }
};

export default companyService;
