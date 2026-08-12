import api from './client';

export const getPromotionOptions = () => api.get('/promotions/options').then((r) => r.data);
export const getPromotionStudents = (params) => api.get('/promotions/students', { params }).then((r) => r.data);
export const executePromotions = (payload) => api.post('/promotions', payload).then((r) => r.data);
export const getPromotionHistory = (params) => api.get('/promotions/history', { params }).then((r) => r.data);
