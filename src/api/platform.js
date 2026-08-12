import api from './client';

/**
 * Thin wrappers around the super_admin-only /platform/* endpoints.
 */

export const getSchools = (search) =>
  api.get('/platform/schools', { params: { search } }).then((r) => r.data);

export const getSchoolDetail = (schoolId) =>
  api.get(`/platform/schools/${schoolId}`).then((r) => r.data);

export const createSchool = (payload) =>
  api.post('/platform/schools', payload).then((r) => r.data);

export const toggleSchoolActive = (schoolId) =>
  api.post(`/platform/schools/${schoolId}/toggle-active`).then((r) => r.data);

export const getPlatformStats = () => api.get('/platform/stats').then((r) => r.data);

export const deleteSchool = (schoolId, confirmName) =>
  api.delete(`/platform/schools/${schoolId}`, { data: { confirm_name: confirmName } }).then((r) => r.data);