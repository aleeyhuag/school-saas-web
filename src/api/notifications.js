import api from './client';

export const getNotifications = () => api.get('/notifications').then((r) => r.data);

export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`).then((r) => r.data);

export const markAllNotificationsRead = () => api.post('/notifications/read-all').then((r) => r.data);
