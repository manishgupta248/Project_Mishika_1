// src/lib/api/authClient.js
/**
 * Axios client for API requests with automatic token refresh and error handling.
 * Configured to use HTTP-only cookies for authentication, aligning with backend JWT setup.
 */

import axios from 'axios';

// Load environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_REFRESH_PATH = process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH || '/auth/refresh/';
const AUTH_LOGIN_PATH = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || '/auth/login/';
const AUTH_LOGOUT_PATH = process.env.NEXT_PUBLIC_AUTH_LOGOUT_PATH || '/auth/logout/';
const REQUEST_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT, 10) || 10000;

// Centralized Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies in requests
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// State for managing token refresh queue
let failedQueue = [];
let isRefreshing = false;

/**
 * Process the queue of failed requests after token refresh attempt.
 * @param {Error|null} error - Error if refresh failed, null if successful.
 */
const processQueue = (error) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.debug(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']; // Browser sets multipart boundary
    }
    return config;
  },
  (error) => {
    console.error('[Request Error]', error.message);
    return Promise.reject(error);
  }
);

// Response Interceptor (without hooks)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      ![AUTH_LOGIN_PATH, AUTH_REFRESH_PATH, AUTH_LOGOUT_PATH].includes(originalRequest.url)
    ) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const response = await apiClient.post(AUTH_REFRESH_PATH, {}, { withCredentials: true });
          console.debug('[Token Refresh] Success:', response.data);
          isRefreshing = false;
          processQueue(null);
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('[Token Refresh] Failed:', refreshError.message);
          isRefreshing = false;
          processQueue(refreshError);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // Queue failed requests during refresh
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(apiClient(originalRequest)),
          reject: (err) => reject(err),
        });
      });
    }

    console.error(`[API Error ${status || 'N/A'}]`, error.message);
    return Promise.reject(error);
  }
);

export default apiClient;