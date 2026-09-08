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
 *  3. If the API responds 403 with code "school_disabled", the
 *     school is billing-locked. This is NOT an authentication failure:
 *     keep the token, notify AuthContext, and let ProtectedRoute/
 *     DashboardRedirect force the user into Billing.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
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
      // IMPORTANT: a billing lock is deliberately recoverable. The user
      // must remain authenticated so Proprietor/Principal can reach Billing
      // and pay/reactivate the school. Do NOT remove the Sanctum token.
      window.dispatchEvent(new CustomEvent('skulag:billing-locked', {
        detail: {
          reason: error.response?.data?.reason ?? 'disabled',
        },
      }));
    }

    return Promise.reject(error);
  }
);

export default api;
