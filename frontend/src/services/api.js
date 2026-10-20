import axios from 'axios';

// Base API URL: Uses Vite dev proxy (/api/v1) or direct localhost:5000 fallback
const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rea_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Handle token expiration
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// Expense Services (Phase 4)
export const expenseApi = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/expenses', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/expenses/${id}`);
    return res.data;
  },
  create: async (expenseData) => {
    const res = await apiClient.post('/expenses', expenseData);
    return res.data;
  },
  update: async (id, updateData) => {
    const res = await apiClient.put(`/expenses/${id}`, updateData);
    return res.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/expenses/${id}`);
    return res.data;
  },
  getMetadata: async () => {
    const res = await apiClient.get('/expenses/meta/categories');
    return res.data;
  },
  getSummary: async (params = {}) => {
    const res = await apiClient.get('/expenses/meta/summary', { params });
    return res.data;
  },
};

// Health Check Service (Phase 2)
export const healthApi = {
  check: async () => {
    const res = await axios.get('/health');
    return res.data;
  },
};

export default apiClient;
