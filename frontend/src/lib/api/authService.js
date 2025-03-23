// src/lib/api/authService.js
/**
 * Service layer for authentication-related API calls.
 * Wraps apiClient to provide a clean interface for auth operations.
 */

import apiClient from './authClient';

/**
 * Authentication service object.
 */
const authService = {
  /**
   * Perform a POST request to the specified endpoint.
   * @param {string} url - The API endpoint path (relative to base URL).
   * @param {Object|FormData} data - Data to send in the request body.
   * @param {Object} [config] - Optional Axios config (e.g., headers).
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async post(url, data, config = {}) {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`[AuthService POST ${url}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Perform a GET request to the specified endpoint.
   * @param {string} url - The API endpoint path (relative to base URL).
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async get(url) {
    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`[AuthService GET ${url}] Error:`, error.message);
      throw error;
    }
  },
};

export default authService;