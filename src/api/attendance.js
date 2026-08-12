import api from './client';

/**
 * Thin wrappers around Stage 5/9's Attendance endpoints.
 */

export const markAttendance = (payload) => api.post('/attendance', payload).then((r) => r.data);
export const getAttendance = (params) => api.get('/attendance', { params }).then((r) => r.data);
export const getStudentAttendanceSummary = (studentId, termId) =>
  api.get(`/students/${studentId}/attendance-summary`, { params: { term_id: termId } }).then((r) => r.data);
