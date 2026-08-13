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
export async function downloadPlatformBackup() {
  const response = await api.get('/platform/backup/download', { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `eduventor_platform_backup_${new Date().toISOString().slice(0,10)}.zip`;
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
