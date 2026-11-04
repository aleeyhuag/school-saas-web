import api from './client';

/**
 * Thin wrappers around the Stage 3 auth endpoints. Kept separate from
 * AuthContext so the context focuses on STATE (who's logged in) while
 * this file focuses on the actual HTTP calls — makes both easier to
 * read and to reuse (e.g. the register-school page also needs this).
 */

export function login({ email, password, device_name, school_id }) {
  return api.post('/auth/login', { email, password, device_name, school_id }).then((res) => res.data);
}

export function registerSchool(payload) {
  return api.post('/auth/register-school', payload).then((res) => res.data);
}

export function fetchCurrentUser() {
  return api.get('/auth/me').then((res) => res.data);
}

export function logout() {
  return api.post('/auth/logout').then((res) => res.data);
}

export function changePassword({ current_password, new_password, new_password_confirmation }) {
  return api
    .put('/auth/change-password', { current_password, new_password, new_password_confirmation })
    .then((res) => res.data);
}

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email }).then((res) => res.data);
}

// The API requires `user_id` (and uses `setup` to choose the account_setup
// token type for invite links). Both come from the emailed link and must be
// forwarded, otherwise every setup/reset fails with "The user id field is required."
export function resetPassword({ token, email, user_id, setup, password, password_confirmation }) {
  return api
    .post('/auth/reset-password', { token, email, user_id, setup, password, password_confirmation })
    .then((res) => res.data);
}

export function updateProfile(payload) {
  return api.put('/auth/profile', payload).then((res) => res.data);
}
