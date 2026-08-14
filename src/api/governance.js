import api from './client';

export const getAuditLogs = (params = {}) => api.get('/audit-logs', { params }).then((r) => r.data);
export const getAuditMeta = () => api.get('/audit-logs/meta').then((r) => r.data);

async function downloadBlob(response, fallback) {
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || fallback;
  const url = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const downloadSchoolBackup = async () => {
  const response = await api.get('/school-backup/download', { responseType: 'blob' });
  await downloadBlob(response, 'skulag-school-backup.zip');
};

export const downloadSchoolModule = async (module) => {
  const response = await api.get(`/school-backup/module/${encodeURIComponent(module)}`, { responseType: 'blob' });
  await downloadBlob(response, `skulag-${module}-export.zip`);
};
