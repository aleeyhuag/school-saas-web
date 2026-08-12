import api from './client';

/**
 * Self-service school profile — Proprietor/Principal editing their
 * own school's identity (name, contact info, logo).
 */
export const getSchoolProfile = () => api.get('/school-profile').then((r) => r.data);

export const updateSchoolProfile = (fields, logoFile) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (logoFile) formData.append('logo', logoFile);
  return api.post('/school-profile', formData).then((r) => r.data);
};
