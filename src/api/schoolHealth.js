import api from './client';

export const getSchoolHealth = () => api.get('/school-health').then((r) => r.data);
