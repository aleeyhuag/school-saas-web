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
  // Without this, a genuinely dead connection just hangs forever —
  // axios's default timeout is 0 (no timeout). This matters
  // specifically for the offline-sync flow (Stage 52): it only queues
  // a save locally when it detects a network failure, but
  // `navigator.onLine` is unreliable in the real world (it often still
  // reports `true` when there's no actual signal — it mainly detects
  // "is a network interface present", not "can this reach the
  // internet"). Without a timeout, a save made while genuinely
  // disconnected — but where the browser still thinks it's online —
  // would hang on this request indefinitely instead of failing fast
  // and falling back to the local queue. 15s is generous for a normal
  // request but short enough that a dead connection resolves quickly.
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
      localStorage.removeItem('token');
      const reason = error.response?.data?.reason ?? 'disabled';
      window.location.href = `/login?reason=${reason}`;
    }

    return Promise.reject(error);
  }
);

export default api;
