/**
 * Service layer for syllabus-related API calls.
 * Wraps apiClient to provide a clean interface for syllabus operations.
 */

import apiClient from './authClient';

// Load environment variables
const SYLLABI_PATH = process.env.NEXT_PUBLIC_COURSES_SYLLABI_PATH;

/**
 * Syllabus service object.
 */
const syllabusService = {
  /**
   * Fetch all syllabi with optional filtering and pagination.
   * @param {Object} [params] - Query parameters (e.g., { course: 'CS101', page: 1 })
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getSyllabi(params = {}) {
    try {
      const response = await apiClient.get(SYLLABI_PATH, { params });
      return response.data;
    } catch (error) {
      console.error(`[SyllabusService GET ${SYLLABI_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch a single syllabus by ID.
   * @param {number} id - Syllabus ID
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getSyllabus(id) {
    try {
      const response = await apiClient.get(`${SYLLABI_PATH}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`[SyllabusService GET ${SYLLABI_PATH}${id}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Create a new syllabus.
   * @param {FormData} data - Syllabus data including file (e.g., syllabus_file)
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async createSyllabus(data) {
    try {
      const response = await apiClient.post(SYLLABI_PATH, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error(`[SyllabusService POST ${SYLLABI_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Update an existing syllabus.
   * @param {number} id - Syllabus ID
   * @param {FormData} data - Updated syllabus data
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async updateSyllabus(id, data) {
    try {
      const response = await apiClient.put(`${SYLLABI_PATH}${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error(`[SyllabusService PUT ${SYLLABI_PATH}${id}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Soft-delete a syllabus.
   * @param {number} id - Syllabus ID
   * @returns {Promise<void>} No content on success.
   * @throws {Error} If the request fails.
   */
  async deleteSyllabus(id) {
    try {
      await apiClient.delete(`${SYLLABI_PATH}${id}/`);
    } catch (error) {
      console.error(`[SyllabusService DELETE ${SYLLABI_PATH}${id}/] Error:`, error.message);
      throw error;
    }
  },
};

export default syllabusService;