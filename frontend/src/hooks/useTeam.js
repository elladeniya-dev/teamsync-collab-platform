import { useState, useEffect, useCallback } from 'react';
import { teamApi } from '../api/client';

export const useTeam = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teamApi.getAll();
      setMembers(res.data || []);
      return res.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch team members');
      console.error('useTeam fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (memberData) => {
    const res = await teamApi.create(memberData);
    await fetchMembers();
    return res.data;
  };

  const removeMember = async (id) => {
    const res = await teamApi.delete(id);
    await fetchMembers();
    return res.data;
  };

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    addMember,
    removeMember,
  };
};
