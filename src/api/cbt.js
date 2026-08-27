import api from './client';

// CBT management — available to Exam Officer and Teachers only.
export const getCbtExams = () => api.get('/cbt/exams').then((r) => r.data);
export const createCbtExam = (payload) => api.post('/cbt/exams', payload).then((r) => r.data);
export const updateCbtExam = (id, payload) => api.put(`/cbt/exams/${id}`, payload).then((r) => r.data);
export const deleteCbtExam = (id) => api.delete(`/cbt/exams/${id}`).then((r) => r.data);
export const publishCbtExam = (id) => api.post(`/cbt/exams/${id}/publish`).then((r) => r.data);
export const getCbtExamResults = (id) => api.get(`/cbt/exams/${id}/results`).then((r) => r.data);
export const addCbtQuestion = (examId, payload) => api.post(`/cbt/exams/${examId}/questions`, payload).then((r) => r.data);
export const updateCbtQuestion = (questionId, payload) => api.put(`/cbt/questions/${questionId}`, payload).then((r) => r.data);
export const deleteCbtQuestion = (questionId) => api.delete(`/cbt/questions/${questionId}`).then((r) => r.data);

// Reusable subject question bank.
export const getQuestionBank = (subjectId) => api.get('/cbt/question-bank', { params: subjectId ? { subject_id: subjectId } : {} }).then((r) => r.data);
export const createBankQuestion = (payload) => api.post('/cbt/question-bank', payload).then((r) => r.data);
export const updateBankQuestion = (id, payload) => api.put(`/cbt/question-bank/${id}`, payload).then((r) => r.data);
export const deleteBankQuestion = (id) => api.delete(`/cbt/question-bank/${id}`).then((r) => r.data);
export const importBankQuestions = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/cbt/question-bank/import', formData).then((r) => r.data);
};

// Student CBT.
export const getAvailableCbtExams = () => api.get('/student/cbt/available').then((r) => r.data);
export const getCbtResults = () => api.get('/student/cbt/results').then((r) => r.data);
export const startCbtExam = (examId) => api.post(`/student/cbt/exams/${examId}/start`).then((r) => r.data);
export const getCbtAttempt = (attemptId) => api.get(`/student/cbt/attempts/${attemptId}`).then((r) => r.data);
export const saveCbtAnswer = (attemptId, questionId, optionId) => api.post(`/student/cbt/attempts/${attemptId}/answers`, { question_id: questionId, option_id: optionId }).then((r) => r.data);
export const submitCbtAttempt = (attemptId) => api.post(`/student/cbt/attempts/${attemptId}/submit`).then((r) => r.data);
