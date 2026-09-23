import api from './api';

export const careerService = {
  getCareers: async (params = {}) => {
    const res = await api.get('/careers', { params });
    return res.data;
  },
  getCareerById: async (id) => {
    const res = await api.get(`/careers/${id}`);
    return res.data;
  },
  getRecommendations: async (studentData) => {
    const res = await api.post('/recommend', studentData);
    return res.data;
  }
};

export default careerService;
