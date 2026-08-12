import api from './client';

export const getMyBranches = () => api.get('/branches').then((r) => r.data);

export const addBranch = (payload) => api.post('/branches', payload).then((r) => r.data);

export const switchBranch = (schoolId) =>
  api.post('/branches/switch', { school_id: schoolId }).then((r) => r.data);
