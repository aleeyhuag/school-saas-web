import axios from 'axios';

/**
 * One Axios instance used by the ENTIRE app — every dashboard, every
 * role, imports this instead of creating its own. Three things happen
 * automatically on every request/response so individual components
 * never have to think about auth:
 *
 *  1. If a token is saved (localStorage), it's attached as a Bearer
 *     token on every outgoing request.
 *  2. If the API ever responds 401 (token missing/expired/revoked),
 *     the token is cleared and the user is bounced to /login.
 *  3. If the API responds 403 with code "school_disabled" (the
 *     EnsureSchoolIsActive middleware — a super_admin disabled this
 *     user's school mid-session), same clean bounce, but to a login
 *     page that explains why, instead of a silent "session expired."
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (status === 403 && code === 'school_disabled') {
      localStorage.removeItem('token');
      const reason = error.response?.data?.reason ?? 'disabled';
      window.location.href = `/login?reason=${reason}`;
    }

    return Promise.reject(error);
  }
);

export default api;
