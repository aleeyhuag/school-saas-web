import api from './client';

// Staff / exam administration
export const getCbtExams = () => api.get('/cbt/exams').then((r) => r.data);
export const createCbtExam = (payload) => api.post('/cbt/exams', payload).then((r) => r.data);
export const updateCbtExam = (id, payload) => api.put(`/cbt/exams/${id}`, payload).then((r) => r.data);
export const deleteCbtExam = (id) => api.delete(`/cbt/exams/${id}`).then((r) => r.data);
export const publishCbtExam = (id) => api.post(`/cbt/exams/${id}/publish`).then((r) => r.data);
export const addCbtQuestion = (examId, payload) => api.post(`/cbt/exams/${examId}/questions`, payload).then((r) => r.data);
export const deleteCbtQuestion = (questionId) => api.delete(`/cbt/questions/${questionId}`).then((r) => r.data);

// Student
export const getAvailableCbtExams = () => api.get('/student/cbt/available').then((r) => r.data);
export const getCbtResults = () => api.get('/student/cbt/results').then((r) => r.data);
export const startCbtExam = (examId) => api.post(`/student/cbt/exams/${examId}/start`).then((r) => r.data);
export const getCbtAttempt = (attemptId) => api.get(`/student/cbt/attempts/${attemptId}`).then((r) => r.data);
export const saveCbtAnswer = (attemptId, questionId, optionId) =>
  api.post(`/student/cbt/attempts/${attemptId}/answers`, {
    question_id: questionId,
    option_id: optionId,
  }).then((r) => r.data);
export const submitCbtAttempt = (attemptId) => api.post(`/student/cbt/attempts/${attemptId}/submit`).then((r) => r.data);
