import api from './client';

export const getMyClassStudents = () => api.get('/my-class/students').then((r) => r.data);
export const updateMyClassStudent = (id, payload) => api.put(`/my-class/students/${id}`, payload).then((r) => r.data);

export const uploadMyClassStudentPhoto = (studentId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/my-class/students/${studentId}/photo`, formData).then((r) => r.data);
};
