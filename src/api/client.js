import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/**
 * One Axios instance used by the ENTIRE app.
 *
 * Native Android builds must never inherit a localhost API URL from a local
 * .env file: localhost inside an Android WebView means the phone itself, not
 * the Skulag API server. If a native build is configured with localhost (or
 * has no VITE_API_BASE_URL), use the production API explicitly.
 */
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const nativeProductionBaseUrl = 'https://api.skulag.com.ng/api';
const isNative = Capacitor.isNativePlatform();
const isLoopback = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(configuredBaseUrl ?? '');
const apiBaseUrl = isNative && (!configuredBaseUrl || isLoopback)
  ? nativeProductionBaseUrl
  : configuredBaseUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
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
      // A billing lock is deliberately recoverable. Keep the authenticated
      // token so Proprietor/Principal can reach Billing and reactivate.
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
