import api from './client';

/**
 * A teacher's OWN assignments — separate from academic.js's
 * getTeacherAssignments/createTeacherAssignment/deleteTeacherAssignment,
 * which are admin-only. This is what Class Teacher and Subject
 * Teacher dashboards use to discover their own class(es)/subject(s).
 */
export const getMyAssignments = () => api.get('/my-teacher-assignments').then((r) => r.data);
