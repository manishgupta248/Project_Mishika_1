/**
 * Service layer for department-related API calls.
 * Wraps apiClient to provide a clean interface for department operations.
 */

import apiClient from './authClient';

// Load environment variables
const DEPARTMENTS_PATH = process.env.NEXT_PUBLIC_ACADEMIC_DEPARTMENTS_PATH;
const FACULTY_CHOICES_PATH = process.env.NEXT_PUBLIC_ACADEMIC_FACULTY_CHOICES_PATH;

/**
 * Department service object.
 */
const departmentService = {
  /**
   * Fetch all departments with optional filtering.
   * @param {Object} [params] - Query parameters (e.g., { faculty: 'SC', is_deleted: false })
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getDepartments(params = {}) {
    try {
      const response = await apiClient.get(DEPARTMENTS_PATH, { params });
      return response.data;
    } catch (error) {
      console.error(`[DepartmentService GET ${DEPARTMENTS_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch a single department by ID.
   * @param {string} id - Department ID (e.g., '1000')
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getDepartment(id) {
    try {
      const response = await apiClient.get(`${DEPARTMENTS_PATH}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`[DepartmentService GET ${DEPARTMENTS_PATH}${id}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Create a new department.
   * @param {Object} data - Department data (e.g., { name, faculty })
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async createDepartment(data) {
    try {
      const response = await apiClient.post(DEPARTMENTS_PATH, data);
      return response.data;
    } catch (error) {
      console.error(`[DepartmentService POST ${DEPARTMENTS_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Update an existing department.
   * @param {string} id - Department ID (e.g., '1000')
   * @param {Object} data - Updated department data (e.g., { name, faculty })
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async updateDepartment(id, data) {
    try {
      const response = await apiClient.put(`${DEPARTMENTS_PATH}${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`[DepartmentService PUT ${DEPARTMENTS_PATH}${id}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Soft-delete a department.
   * @param {string} id - Department ID (e.g., '1000')
   * @returns {Promise<void>} No content on success.
   * @throws {Error} If the request fails.
   */
  async deleteDepartment(id) {
    try {
      await apiClient.delete(`${DEPARTMENTS_PATH}${id}/`);
    } catch (error) {
      console.error(`[DepartmentService DELETE ${DEPARTMENTS_PATH}${id}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch faculty choices for dropdowns.
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getFacultyChoices() {
    try {
      const response = await apiClient.get(FACULTY_CHOICES_PATH);
      return response.data;
    } catch (error) {
      console.error(`[DepartmentService GET ${FACULTY_CHOICES_PATH}] Error:`, error.message);
      throw error;
    }
  },
};

export default departmentService;