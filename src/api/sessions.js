import api from './client';

/**
 * Thin wrappers around Stage 6's Academic Sessions & Terms endpoints.
 */

// Sessions
export const getSessions = () => api.get('/academic-sessions').then((r) => r.data);
export const createSession = (payload) => api.post('/academic-sessions', payload).then((r) => r.data);
export const updateSession = (id, payload) =>
  api.put(`/academic-sessions/${id}`, payload).then((r) => r.data);
export const deleteSession = (id) => api.delete(`/academic-sessions/${id}`).then((r) => r.data);

// Terms
export const getTerms = (academicSessionId) =>
  api.get('/terms', { params: { academic_session_id: academicSessionId } }).then((r) => r.data);
export const createTerm = (payload) => api.post('/terms', payload).then((r) => r.data);
export const updateTerm = (id, payload) => api.put(`/terms/${id}`, payload).then((r) => r.data);
export const deleteTerm = (id) => api.delete(`/terms/${id}`).then((r) => r.data);
export const getCurrentTerm = () => api.get('/terms/current').then((r) => r.data);
