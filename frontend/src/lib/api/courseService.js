//src/lib/api/courseService.js
/**
 * Service layer for course-related API calls.
 * Wraps apiClient to provide a clean interface for course operations.
 */

import apiClient from './authClient';

// Load environment variables
const COURSES_PATH = process.env.NEXT_PUBLIC_COURSES_COURSES_PATH;
const COURSE_CATEGORY_CHOICES_PATH = process.env.NEXT_PUBLIC_COURSES_CATEGORY_CHOICES_PATH;
const COURSE_TYPE_CHOICES_PATH = process.env.NEXT_PUBLIC_COURSES_TYPE_CHOICES_PATH;
const CBCS_CATEGORY_CHOICES_PATH = process.env.NEXT_PUBLIC_COURSES_CBCS_CATEGORY_CHOICES_PATH;

/**
 * Course service object.
 */
const courseService = {
  /**
   * Fetch all courses with optional filtering.
   * @param {Object} [params] - Query parameters (e.g., { discipline: 'CS', course_category: 'COMPULSORY' })
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getCourses(params = {}) {
    try {
      const response = await apiClient.get(COURSES_PATH, { params });
      return response.data;
    } catch (error) {
      console.error(`[CourseService GET ${COURSES_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch a single course by course_code.
   * @param {string} courseCode - Course code (e.g., 'CS101')
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getCourse(courseCode) {
    try {
      const response = await apiClient.get(`${COURSES_PATH}${courseCode}/`);
      return response.data;
    } catch (error) {
      console.error(`[CourseService GET ${COURSES_PATH}${courseCode}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Create a new course.
   * @param {Object} data - Course data (e.g., { course_code, course_name, discipline })
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async createCourse(data) {
    try {
      const response = await apiClient.post(COURSES_PATH, data);
      return response.data;
    } catch (error) {
      console.error(`[CourseService POST ${COURSES_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Update an existing course.
   * @param {string} courseCode - Course code (e.g., 'CS101')
   * @param {Object} data - Updated course data
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async updateCourse(courseCode, data) {
    try {
      const response = await apiClient.put(`${COURSES_PATH}${courseCode}/`, data);
      return response.data;
    } catch (error) {
      console.error(`[CourseService PUT ${COURSES_PATH}${courseCode}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Soft-delete a course.
   * @param {string} courseCode - Course code (e.g., 'CS101')
   * @returns {Promise<void>} No content on success.
   * @throws {Error} If the request fails.
   */
  async deleteCourse(courseCode) {
    try {
      await apiClient.delete(`${COURSES_PATH}${courseCode}/`);
    } catch (error) {
      console.error(`[CourseService DELETE ${COURSES_PATH}${courseCode}/] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch course category choices for dropdowns.
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getCourseCategoryChoices() {
    try {
      const response = await apiClient.get(COURSE_CATEGORY_CHOICES_PATH);
      return response.data;
    } catch (error) {
      console.error(`[CourseService GET ${COURSE_CATEGORY_CHOICES_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch course type choices for dropdowns.
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getCourseTypeChoices() {
    try {
      const response = await apiClient.get(COURSE_TYPE_CHOICES_PATH);
      return response.data;
    } catch (error) {
      console.error(`[CourseService GET ${COURSE_TYPE_CHOICES_PATH}] Error:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch CBCS category choices for dropdowns.
   * @returns {Promise<Object>} Response data from the API.
   * @throws {Error} If the request fails.
   */
  async getCBCSCategoryChoices() {
    try {
      const response = await apiClient.get(CBCS_CATEGORY_CHOICES_PATH);
      return response.data;
    } catch (error) {
      console.error(`[CourseService GET ${CBCS_CATEGORY_CHOICES_PATH}] Error:`, error.message);
      throw error;
    }
  },
};

export default courseService;