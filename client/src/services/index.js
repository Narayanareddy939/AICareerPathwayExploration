import api from './api';

export const alumniService = {
  getAlumni: async (params = {}) => {
    const res = await api.get('/alumni', { params });
    return res.data;
  },
  getAlumniDetails: async (id) => {
    const res = await api.get(`/alumni/${id}`);
    return res.data;
  },
  sendMentorshipRequest: async (data) => {
    const res = await api.post('/alumni/mentorship', data);
    return res.data;
  }
};

export const jobService = {
  getJobs: async (params = {}) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  }
};

export const roadmapService = {
  getRoadmap: async (targetRole, skills = []) => {
    const res = await api.post('/roadmap', { targetRole, skills });
    return res.data;
  }
};

export const resumeService = {
  analyzeResume: async (resumeText, targetRole) => {
    const res = await api.post('/analyze-resume', { resumeText, targetRole });
    return res.data;
  }
};

export const chatService = {
  sendMessage: async (message, studentContext = {}) => {
    const res = await api.post('/chat', { message, studentContext });
    return res.data;
  }
};
