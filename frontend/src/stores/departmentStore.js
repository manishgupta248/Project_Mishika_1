/**
 * Zustand store for managing department state and actions.
 * Handles CRUD operations and faculty choices with integration to departmentService.
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import departmentService from '@/lib/api/departmentService';

const useDepartmentStore = create((set, get) => ({
  departments: [],
  facultyChoices: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all departments with optional filters.
   * @param {Object} [filters] - Query filters (e.g., { faculty: 'SC', is_deleted: false })
   */
  fetchDepartments: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const departments = await departmentService.getDepartments(filters);
      set({ departments, isLoading: false });
    } catch (error) {
      console.error('[Fetch Departments Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch departments' });
      toast.error('Failed to load departments');
    }
  },

  /**
   * Fetch a single department by ID.
   * @param {string} id - Department ID
   * @returns {Promise<Object>} Department data
   */
  fetchDepartment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const department = await departmentService.getDepartment(id);
      set({ isLoading: false });
      return department;
    } catch (error) {
      console.error('[Fetch Department Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch department' });
      toast.error('Failed to load department');
      throw error;
    }
  },

  /**
   * Create a new department.
   * @param {Object} data - Department data (e.g., { name, faculty })
   */
  createDepartment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newDepartment = await departmentService.createDepartment(data);
      set((state) => ({
        departments: [...state.departments, newDepartment],
        isLoading: false,
      }));
      toast.success('Department created successfully!');
    } catch (error) {
      console.error('[Create Department Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to create department' });
      toast.error(error.response?.data?.detail || 'Failed to create department');
      throw error;
    }
  },

  /**
   * Update an existing department.
   * @param {string} id - Department ID
   * @param {Object} data - Updated department data
   */
  updateDepartment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDepartment = await departmentService.updateDepartment(id, data);
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === id ? updatedDepartment : dept
        ),
        isLoading: false,
      }));
      toast.success('Department updated successfully!');
    } catch (error) {
      console.error('[Update Department Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to update department' });
      toast.error(error.response?.data?.detail || 'Failed to update department');
      throw error;
    }
  },

  /**
   * Soft-delete a department.
   * @param {string} id - Department ID
   */
  deleteDepartment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await departmentService.deleteDepartment(id);
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === id ? { ...dept, is_deleted: true } : dept
        ),
        isLoading: false,
      }));
      toast.success('Department deleted successfully!');
    } catch (error) {
      console.error('[Delete Department Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to delete department' });
      toast.error('Failed to delete department');
      throw error;
    }
  },

  /**
   * Fetch faculty choices for dropdowns.
   */
  fetchFacultyChoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const facultyChoices = await departmentService.getFacultyChoices();
      set({ facultyChoices, isLoading: false });
    } catch (error) {
      console.error('[Fetch Faculty Choices Error]', error.message);
      set({ isLoading: false, error: error.response?.data?.detail || 'Failed to fetch faculty choices' });
      toast.error('Failed to load faculty choices');
    }
  },
}));

export default useDepartmentStore;