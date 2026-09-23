import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/profile');
        if (mounted && res.data) {
          setProfile(res.data.student || res.data);
        }
      } catch (err) {
        if (mounted) {
          // Fallback to auth context profile
          setProfile(user || {
            name: 'Student',
            branch: 'CSE',
            cgpa: 8.5,
            skills: ['Python', 'React', 'SQL', 'Data Structures'],
            targetRole: 'Software Engineer'
          });
          setError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { mounted = false; };
  }, [user]);

  return { profile, loading, error, setProfile };
}

export default useProfile;
