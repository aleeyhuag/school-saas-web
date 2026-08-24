import api from './client';

/**
 * Thin wrappers around the Stage 4 (Academic Structure) endpoints.
 * Each dashboard imports what it needs from here rather than calling
 * `api.get(...)` directly — keeps endpoint URLs in one place.
 */

// Classes
export const getClasses = () => api.get('/classes').then((r) => r.data);
export const createClass = (payload) => api.post('/classes', payload).then((r) => r.data);
export const updateClass = (id, payload) => api.put(`/classes/${id}`, payload).then((r) => r.data);
export const deleteClass = (id) => api.delete(`/classes/${id}`).then((r) => r.data);
export const syncClassSubjects = (id, subjectIds) =>
  api.post(`/classes/${id}/subjects`, { subject_ids: subjectIds }).then((r) => r.data);

// Subjects
export const getSubjects = () => api.get('/subjects').then((r) => r.data);
export const createSubject = (payload) => api.post('/subjects', payload).then((r) => r.data);
export const updateSubject = (id, payload) => api.put(`/subjects/${id}`, payload).then((r) => r.data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`).then((r) => r.data);

// Students
export const getStudents = (params) => api.get('/students', { params }).then((r) => r.data);
export const getStudent = (id) => api.get(`/students/${id}`).then((r) => r.data);
export const createStudent = (payload) => api.post('/students', payload).then((r) => r.data);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload).then((r) => r.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then((r) => r.data);
export const syncStudentGuardians = (studentId, userIds) =>
  api.post(`/students/${studentId}/guardians`, { user_ids: userIds }).then((r) => r.data);
export const createStudentLogin = (studentId) =>
  api.post(`/students/${studentId}/create-login`).then((r) => r.data);
export const uploadStudentPhoto = (studentId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/students/${studentId}/photo`, formData).then((r) => r.data);
};

// Staff
export const getStaff = (params) => api.get('/staff', { params }).then((r) => r.data);
export const inviteUser = (payload) => api.post('/invite-user', payload).then((r) => r.data);
export const toggleStaffStatus = (userId) =>
  api.post(`/staff/${userId}/toggle-status`).then((r) => r.data);
export const resetStaffPassword = (userId) =>
  api.post(`/staff/${userId}/reset-password`).then((r) => r.data);
export const addStaffRole = (userId, role) =>
  api.post(`/staff/${userId}/add-role`, { role }).then((r) => r.data);
export const removeStaffRole = (userId, role) =>
  api.post(`/staff/${userId}/remove-role`, { role }).then((r) => r.data);

// Teacher assignments
export const getTeacherAssignments = (params) =>
  api.get('/teacher-assignments', { params }).then((r) => r.data);
export const createTeacherAssignment = (payload) =>
  api.post('/teacher-assignments', payload).then((r) => r.data);
export const deleteTeacherAssignment = (id) =>
  api.delete(`/teacher-assignments/${id}`).then((r) => r.data);

// Dashboard overview stats (Proprietor/Principal)
export const getDashboardStats = () => api.get('/dashboard-stats').then((r) => r.data);

// Bulk student import
export const bulkImportStudents = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/students/bulk-import', formData).then((r) => r.data);
};
