import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
let API_BASE = '/api';
if (rawBase && rawBase !== '/api') {
  const clean = rawBase.replace(/\/+$/, '');
  API_BASE = clean.endsWith('/api') ? clean : `${clean}/api`;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('college_bus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      const hadToken = !!localStorage.getItem('college_bus_token');
      localStorage.removeItem('college_bus_token');
      localStorage.removeItem('college_bus_user');

      if (hadToken) {
        window.dispatchEvent(new CustomEvent('app:session-expired', {
          detail: { message: error.response?.data?.message || 'Your session has expired. Please sign in again.' }
        }));
        const redirectParam = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?expired=true&redirect=${redirectParam}`);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  loginWithGoogle: (data) => api.post('/auth/google', data),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.put('/auth/preferences', { preferences }),
  configureGmail: (data) => api.post('/auth/configure-gmail', data),
  getEmailStatus: () => api.get('/auth/email-status')
};

export const transitAPI = {
  getStops: () => api.get('/stops'),
  createStop: (data) => api.post('/stops', data),
  updateStop: (id, data) => api.put(`/stops/${id}`, data),
  deleteStop: (id) => api.delete(`/stops/${id}`),

  getRoutes: () => api.get('/routes'),
  getRoute: (id) => api.get(`/routes/${id}`),
  createRoute: (data) => api.post('/routes', data),
  updateRoute: (id, data) => api.put(`/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/routes/${id}`),

  getBuses: () => api.get('/buses'),
  getLiveBuses: () => api.get('/buses/live'),
  getBus: (id) => api.get(`/buses/${id}`),
  createBus: (data) => api.post('/buses', data),
  updateBus: (id, data) => api.put(`/buses/${id}`, data),
  updateOccupancy: (id, data) => api.put(`/buses/${id}/occupancy`, data),
  deleteBus: (id) => api.delete(`/buses/${id}`),

  getDrivers: () => api.get('/drivers'),
  createDriver: (data) => api.post('/drivers', data),
  updateDriver: (id, data) => api.put(`/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/drivers/${id}`),

  getRecommendations: (data) => api.post('/recommendations', data),
  getAlerts: () => api.get('/alerts'),
  getFavorites: () => api.get('/favorites'),
  addFavorite: (data) => api.post('/favorites', data),
  deleteFavorite: (id) => api.delete(`/favorites/${id}`),
  getHistory: () => api.get('/history'),
  getAnalytics: () => api.get('/analytics'),
  getUsers: () => api.get('/users'),
  toggleUserStatus: (id, data) => api.put(`/users/${id}/status`, data),
  sendAIChat: (message, chatHistory = [], activeContext = null) =>
    api.post('/ai/chat', { message, chatHistory, activeContext }),

  // Dynamic Real-Time Services
  getStopBoard: (stopId) => api.get(`/services/stop-board/${stopId}`),
  generatePass: (data) => api.post('/services/passes', data),
  getMyPasses: () => api.get('/services/passes/my-passes'),
  verifyPass: (code) => api.get(`/services/passes/verify/${code}`),
  consumePass: (code) => api.post(`/services/passes/consume/${code}`),
  reportIncident: (data) => api.post('/services/incidents', data),
  getIncidents: () => api.get('/services/incidents')
};

export default api;
