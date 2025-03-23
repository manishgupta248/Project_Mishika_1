// src/stores/authStore.js
/**
 * Zustand store for managing authentication state and actions.
 * Handles login, logout, registration, and profile fetching with HTTP-only cookie-based JWT.
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import authService from '@/lib/api/authService';

// Load environment variables
const AUTH_LOGIN_PATH = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH;
const AUTH_LOGOUT_PATH = process.env.NEXT_PUBLIC_AUTH_LOGOUT_PATH;
const AUTH_REGISTER_PATH = process.env.NEXT_PUBLIC_AUTH_REGISTER_PATH;
const AUTH_PROFILE_PATH = process.env.NEXT_PUBLIC_AUTH_PROFILE_PATH;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * Log in a user with email and password.
   * @param {Object} credentials - { email, password }
   * @param {Object} router - Next.js router instance
   */
  login: async (credentials, router) => {
    set({ isLoading: true });
    try {
      const response = await authService.post(AUTH_LOGIN_PATH, credentials);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      toast.success('Login successful!');
      router.push('/profile');
    } catch (error) {
      console.error('[Login Error]', error.message);
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  },

  /**
   * Log out the current user and clear authentication state.
   * @param {Object} router - Next.js router instance
   */
  logout: async (router) => {
    set({ isLoading: true });
    try {
      await authService.post(AUTH_LOGOUT_PATH, {});
      console.debug('[Logout] Success');
      toast.success('Logged out successfully!');
    } catch (error) {
      console.warn('[Logout] Failed:', error.message);
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    // Clear cookies (optional, if backend doesn’t)
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    router.push('/login');
  },

  /**
   * Register a new user.
   * @param {Object} data - Registration data (e.g., email, password, first_name)
   * @param {Object} router - Next.js router instance
   */
  register: async (data, router) => {
    set({ isLoading: true });
    try {
      const response = await authService.post(AUTH_REGISTER_PATH, data);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      toast.success('Registration successful!');
      router.push('/profile');
    } catch (error) {
      console.error('[Register Error]', error.message);
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  },

  /**
   * Fetch the current user's profile.
   * @returns {Promise<Object>} User data
   */
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const userData = await authService.get(AUTH_PROFILE_PATH);
      set({ user: userData, isAuthenticated: true, isLoading: false });
      return userData;
    } catch (error) {
      console.error('[Fetch Profile Error]', error.message);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Check if the user is authenticated by fetching their profile.
   * @returns {Promise<boolean>} True if authenticated, false otherwise
   */
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const userData = await authService.get(AUTH_PROFILE_PATH);
      set({ user: userData, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      console.debug('[Check Auth] Failed:', error.message);
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },
}));

export default useAuthStore;