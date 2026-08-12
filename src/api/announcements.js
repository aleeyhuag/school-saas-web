import api from './client';

export const getAnnouncements = () => api.get('/announcements').then((r) => r.data);

export const getComposeOptions = () => api.get('/announcements/compose-options').then((r) => r.data);

export const postAnnouncement = (payload) => api.post('/announcements', payload).then((r) => r.data);

export const markAnnouncementRead = (id) => api.post(`/announcements/${id}/read`).then((r) => r.data);
