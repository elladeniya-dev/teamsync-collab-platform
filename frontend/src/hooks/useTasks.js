import { useState, useEffect, useCallback } from 'react';
import { taskApi } from '../api/client';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await taskApi.getAll();
      const sorted = (res.data || []).sort(
        (a, b) => new Date(a.deadline) - new Date(b.deadline)
      );
      setTasks(sorted);
      return sorted;
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
      console.error('useTasks fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData) => {
    const res = await taskApi.create(taskData);
    await fetchTasks();
    return res.data;
  };

  const updateTask = async (id, taskData) => {
    const res = await taskApi.update(id, taskData);
    await fetchTasks();
    return res.data;
  };

  const deleteTask = async (id) => {
    const res = await taskApi.delete(id);
    await fetchTasks();
    return res.data;
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};
