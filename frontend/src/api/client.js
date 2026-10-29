import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teamsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and on a protected route, token is invalid/expired
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('teamsync_token');
        localStorage.removeItem('teamsync_user');
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  googleAuth: (credential) => apiClient.post('/api/auth/google', { credential }),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  getMe: () => apiClient.get('/api/auth/me'),
};

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
  update: (id, memberData) => apiClient.put(`/api/team/${id}`, memberData),
  delete: (id) => apiClient.delete(`/api/team/${id}`),
};

// Notifications API
export const notificationApi = {
  getAll: () => apiClient.get('/api/notifications'),
  create: (data) => apiClient.post('/api/notifications', data),
  markAsRead: (id) => apiClient.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/api/notifications/read-all'),
  delete: (id) => apiClient.delete(`/api/notifications/${id}`),
  clearAll: () => apiClient.delete('/api/notifications'),
};

// Workspaces & Sprints API
export const workspaceApi = {
  getAll: () => apiClient.get('/api/workspaces'),
  create: (data) => apiClient.post('/api/workspaces', data),
  update: (id, data) => apiClient.put(`/api/workspaces/${id}`, data),
  delete: (id) => apiClient.delete(`/api/workspaces/${id}`),
};

export default apiClient;
