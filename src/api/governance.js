import api from './client';

export const getAuditLogs = (params = {}) => api.get('/audit-logs', { params }).then((r) => r.data);
export const getAuditMeta = () => api.get('/audit-logs/meta').then((r) => r.data);
export const downloadSchoolBackup = () => api.get('/school-backup/download', { responseType: 'blob' }).then((r) => {
  const disposition = r.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || 'eduventor-school-backup.zip';
  const url = window.URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
});
