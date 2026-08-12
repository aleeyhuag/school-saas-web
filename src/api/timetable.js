import api from './client';

// ---- Class Timetable ----

export const getClassTimetable = (params) =>
  api.get('/timetable/class', { params }).then((r) => r.data);

export const getMySchedule = (params) =>
  api.get('/timetable/my-schedule', { params }).then((r) => r.data);

export const saveClassTimetableEntry = (payload) =>
  api.post('/timetable/class', payload).then((r) => r.data);

export const deleteClassTimetableEntry = (id) =>
  api.delete(`/timetable/class/${id}`).then((r) => r.data);

// ---- Period Definitions ----
// What time each "Period N" actually runs — set once by the
// Principal per school, read by every actor viewing a timetable.

export const getPeriods = () =>
  api.get('/timetable/periods').then((r) => r.data);

export const savePeriod = (payload) =>
  api.post('/timetable/periods', payload).then((r) => r.data);

export const deletePeriod = (id) =>
  api.delete(`/timetable/periods/${id}`).then((r) => r.data);

// ---- Exam Timetable ----

export const getExamTimetable = (params) =>
  api.get('/timetable/exam', { params }).then((r) => r.data);

export const createExamEntry = (payload) =>
  api.post('/timetable/exam', payload).then((r) => r.data);

export const updateExamEntry = (id, payload) =>
  api.put(`/timetable/exam/${id}`, payload).then((r) => r.data);

export const deleteExamEntry = (id) =>
  api.delete(`/timetable/exam/${id}`).then((r) => r.data);
