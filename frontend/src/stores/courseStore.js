//src/stores/courseStore.js
/**
 * Zustand store for managing course state and actions.
 * Handles CRUD operations and choice options with integration to courseService.
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import courseService from '@/lib/api/courseService';

const useCourseStore = create((set, get) => ({
  courses: [],
  pagination: { count: 0, next: null, previous: null },
  courseCategoryChoices: [],
  courseTypeChoices: [],
  cbcsCategoryChoices: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all courses with optional filters.
   * @param {Object} [filters] - Query filters (e.g., { discipline: 'CS', course_category: 'COMPULSORY' })
   */
  fetchCourses: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCourses(filters);
      set({
        courses: response.results || [],
        pagination: {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('[Fetch Courses Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch courses' });
      toast.error('Failed to load courses');
    }
  },

  /**
   * Fetch a single course by course_code.
   * @param {string} courseCode - Course code
   * @returns {Promise<Object>} Course data
   */
  fetchCourse: async (courseCode) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseService.getCourse(courseCode);
      set({ isLoading: false });
      return course;
    } catch (error) {
      console.error('[Fetch Course Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch course' });
      toast.error('Failed to load course');
      throw error;
    }
  },

  /**
   * Create a new course.
   * @param {Object} data - Course data (e.g., { course_code, course_name, discipline })
   */
  createCourse: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newCourse = await courseService.createCourse(data);
      set((state) => ({
        courses: [...state.courses, newCourse],
        isLoading: false,
      }));
      toast.success('Course created successfully!');
    } catch (error) {
      console.error('[Create Course Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to create course' });
      toast.error(error.response?.data?.detail || 'Failed to create course');
      throw error;
    }
  },

  /**
   * Update an existing course.
   * @param {string} courseCode - Course code
   * @param {Object} data - Updated course data
   */
  updateCourse: async (courseCode, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCourse = await courseService.updateCourse(courseCode, data);
      set((state) => ({
        courses: state.courses.map((course) =>
          course.course_code === courseCode ? updatedCourse : course
        ),
        isLoading: false,
      }));
      toast.success('Course updated successfully!');
    } catch (error) {
      console.error('[Update Course Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to update course' });
      toast.error(error.response?.data?.detail || 'Failed to update course');
      throw error;
    }
  },

  /**
   * Soft-delete a course.
   * @param {string} courseCode - Course code
   */
  deleteCourse: async (courseCode) => {
    set({ isLoading: true, error: null });
    try {
      await courseService.deleteCourse(courseCode);
      set((state) => ({
        courses: state.courses.map((course) =>
          course.course_code === courseCode ? { ...course, is_deleted: true } : course
        ),
        isLoading: false,
      }));
      toast.success('Course deleted successfully!');
    } catch (error) {
      console.error('[Delete Course Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to delete course' });
      toast.error('Failed to delete course');
      throw error;
    }
  },

  /**
   * Fetch course category choices for dropdowns.
   */
  fetchCourseCategoryChoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const courseCategoryChoices = await courseService.getCourseCategoryChoices();
      set({ courseCategoryChoices, isLoading: false });
    } catch (error) {
      console.error('[Fetch Course Category Choices Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch course category choices' });
      toast.error('Failed to load course category choices');
    }
  },

  /**
   * Fetch course type choices for dropdowns.
   */
  fetchCourseTypeChoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const courseTypeChoices = await courseService.getCourseTypeChoices();
      set({ courseTypeChoices, isLoading: false });
    } catch (error) {
      console.error('[Fetch Course Type Choices Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch course type choices' });
      toast.error('Failed to load course type choices');
    }
  },

  /**
   * Fetch CBCS category choices for dropdowns.
   */
  fetchCBCSCategoryChoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const cbcsCategoryChoices = await courseService.getCBCSCategoryChoices();
      set({ cbcsCategoryChoices, isLoading: false });
    } catch (error) {
      console.error('[Fetch CBCS Category Choices Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch CBCS category choices' });
      toast.error('Failed to load CBCS category choices');
    }
  },
}));

export default useCourseStore;