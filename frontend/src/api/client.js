import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tasks API
export const taskApi = {
  getAll: () => apiClient.get('/api/tasks'),
  create: (taskData) => apiClient.post('/api/tasks', taskData),
  update: (id, taskData) => apiClient.put(`/api/tasks/${id}`, taskData),
  delete: (id) => apiClient.delete(`/api/tasks/${id}`),
};

// Team API
export const teamApi = {
  getAll: () => apiClient.get('/api/team'),
  create: (memberData) => apiClient.post('/api/team', memberData),
  delete: (id) => apiClient.delete(`/api/team/${id}`),
};

export default apiClient;
