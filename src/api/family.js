import api from './client';

/**
 * Self-service endpoints for Parent and Student roles — each only
 * ever returns data belonging to the logged-in user themselves.
 */

export const getMyChildren = () => api.get('/my-children').then((r) => r.data);
export const getMyStudentRecord = () => api.get('/my-student-record').then((r) => r.data);
