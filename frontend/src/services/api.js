import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired or invalid, clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location.href for 401 to ensure clean state reset
      // This is a common pattern for SPA authentication errors
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
