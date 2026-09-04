import api from './client';

export const getEnrollmentApplications = () => api.get('/enrollment-applications').then((r) => r.data);

export const getEnrollmentApplication = (id) => api.get(`/enrollment-applications/${id}`).then((r) => r.data);

export const approveEnrollmentApplication = (id) =>
  api.post(`/enrollment-applications/${id}/approve`).then((r) => r.data);

export const rejectEnrollmentApplication = (id, reason) =>
  api.post(`/enrollment-applications/${id}/reject`, { reason }).then((r) => r.data);
