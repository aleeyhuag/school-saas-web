import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 15000 });
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('partner_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (payload) => client.post('/partner/register', payload).then((r) => r.data);
export const login = (payload) => client.post('/partner/login', payload).then((r) => r.data);
export const me = () => client.get('/partner/me').then((r) => r.data);
export const updateProfile = (payload) => client.put('/partner/profile', payload).then((r) => r.data);
export const logout = () => client.post('/partner/logout').then((r) => r.data);
