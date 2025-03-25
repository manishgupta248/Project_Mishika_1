/**
 * Zustand store for managing syllabus state and actions.
 * Handles CRUD operations with integration to syllabusService.
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import syllabusService from '@/lib/api/syllabusService';

const useSyllabusStore = create((set, get) => ({
  syllabi: [],
  pagination: { count: 0, next: null, previous: null },
  isLoading: false,
  error: null,

  /**
   * Fetch all syllabi with optional filters and pagination.
   * @param {Object} [filters] - Query filters (e.g., { course: 'CS101', page: 1 })
   */
  fetchSyllabi: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await syllabusService.getSyllabi(filters);
      set({
        syllabi: response.results || [],
        pagination: {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('[Fetch Syllabi Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch syllabi' });
      toast.error('Failed to load syllabi');
    }
  },

  /**
   * Fetch a single syllabus by ID.
   * @param {number} id - Syllabus ID
   * @returns {Promise<Object>} Syllabus data
   */
  fetchSyllabus: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const syllabus = await syllabusService.getSyllabus(id);
      set({ isLoading: false });
      return syllabus;
    } catch (error) {
      console.error('[Fetch Syllabus Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch syllabus' });
      toast.error('Failed to load syllabus');
      throw error;
    }
  },

  /**
   * Create a new syllabus.
   * @param {FormData} data - Syllabus data including file
   */
  createSyllabus: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newSyllabus = await syllabusService.createSyllabus(data);
      set((state) => ({
        syllabi: [...state.syllabi, newSyllabus],
        isLoading: false,
      }));
      toast.success('Syllabus created successfully!');
    } catch (error) {
      console.error('[Create Syllabus Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to create syllabus' });
      toast.error(error.response?.data?.detail || 'Failed to create syllabus');
      throw error;
    }
  },

  /**
   * Update an existing syllabus.
   * @param {number} id - Syllabus ID
   * @param {FormData} data - Updated syllabus data
   */
  updateSyllabus: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSyllabus = await syllabusService.updateSyllabus(id, data);
      set((state) => ({
        syllabi: state.syllabi.map((syllabus) =>
          syllabus.id === id ? updatedSyllabus : syllabus
        ),
        isLoading: false,
      }));
      toast.success('Syllabus updated successfully!');
    } catch (error) {
      console.error('[Update Syllabus Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to update syllabus' });
      toast.error(error.response?.data?.detail || 'Failed to update syllabus');
      throw error;
    }
  },

  /**
   * Soft-delete a syllabus.
   * @param {number} id - Syllabus ID
   */
  deleteSyllabus: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await syllabusService.deleteSyllabus(id);
      set((state) => ({
        syllabi: state.syllabi.map((syllabus) =>
          syllabus.id === id ? { ...syllabus, is_deleted: true } : syllabus
        ),
        isLoading: false,
      }));
      toast.success('Syllabus deleted successfully!');
    } catch (error) {
      console.error('[Delete Syllabus Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to delete syllabus' });
      toast.error('Failed to delete syllabus');
      throw error;
    }
  },
}));

export default useSyllabusStore;