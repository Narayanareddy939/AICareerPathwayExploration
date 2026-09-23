import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { careerService } from '../services/careerService';

export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async (customProfile = null) => {
    try {
      setLoading(true);
      setError(null);
      const studentData = customProfile || user || {
        branch: 'CSE',
        cgpa: 8.5,
        skills: ['Python', 'React', 'Machine Learning', 'SQL'],
        targetRole: 'Machine Learning Engineer'
      };
      const data = await careerService.getRecommendations(studentData);
      setRecommendations(data.recommendations || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  return { recommendations, loading, error, refetch: fetchRecommendations };
}

export default useRecommendations;
