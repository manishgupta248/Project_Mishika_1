// src/app/profile/page.js
'use client';
/**
 * Profile page component for displaying and updating user information.
 * Includes profile editing and password change forms with enhanced styling.
 */

import { useEffect, useMemo, useState } from 'react';
import authService from '@/lib/api/authService';
import useAuthStore from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { DynamicForm } from '@/components/common/DynamicForm';
import ProfileDisplay from '@/components/common/ProfileDisplay';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import toast from 'react-hot-toast';

const AUTH_PROFILE_PATH = process.env.NEXT_PUBLIC_AUTH_PROFILE_PATH || '/auth/profile/';
const AUTH_PASSWORD_CHANGE_PATH = process.env.NEXT_PUBLIC_AUTH_PASSWORD_CHANGE_PATH || '/auth/password/change/';

export default function Profile() {
  const { user, fetchProfile, isAuthenticated, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      console.debug('[Profile] User not authenticated, redirecting to /login');
      router.push('/login');
    } else if (!user) {
      fetchProfile().catch((error) => {
        console.error('[Profile] Fetch error:', error.message);
        toast.error(error.response?.data?.error || error.message || 'Failed to load profile');
      });
    }
  }, [isAuthenticated, fetchProfile, router]);

  const profileInitialValues = useMemo(
    () => ({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      mobile_number: user?.mobile_number || '',
      bio: user?.bio || '',
      profile_picture: null,
    }),
    [user]
  );

  const profileFields = useMemo(
    () => [
      { name: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter your first name', required: true },
      { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter your last name', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'text', placeholder: '+919876543210' },
      { name: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself (max 500 characters)', maxLength: 500 },
      { name: 'profile_picture', label: 'Profile Picture', type: 'file', accept: 'image/*' },
    ],
    []
  );

  const passwordFields = useMemo(
    () => [
      { name: 'old_password', label: 'Current Password', type: 'password', placeholder: 'Enter your current password', required: true },
      { name: 'new_password', label: 'New Password', type: 'password', placeholder: 'Enter your new password', required: true },
      { name: 'confirm_new_password', label: 'Confirm New Password', type: 'password', placeholder: 'Confirm your new password', required: true },
    ],
    []
  );

  const validateProfile = (data) => {
    const newErrors = {};
    if (!data.first_name) newErrors.first_name = 'First name is required';
    if (!data.last_name) newErrors.last_name = 'Last name is required';
    if (data.mobile_number && !/^\+91[6-9]\d{9}$/.test(data.mobile_number)) {
      newErrors.mobile_number = 'Enter a valid Indian mobile number (e.g., +919876543210)';
    }
    if (data.bio && data.bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters';
    }
    if (data.profile_picture && data.profile_picture.size > 5 * 1024 * 1024) {
      newErrors.profile_picture = 'Profile picture must be less than 5MB';
    }
    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (data) => {
    const newErrors = {};
    if (!data.old_password) newErrors.old_password = 'Current password is required';
    if (!data.new_password) newErrors.new_password = 'New password is required';
    else if (data.new_password.length < 8) {
      newErrors.new_password = 'New password must be at least 8 characters';
    } else if (!/[0-9]/.test(data.new_password) || !/[!@#$%^&*]/.test(data.new_password)) {
      newErrors.new_password = 'New password must contain a number and a special character (!@#$%^&*)';
    }
    if (data.new_password !== data.confirm_new_password) {
      newErrors.confirm_new_password = 'Passwords do not match';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (formData) => {
    if (!validateProfile(formData)) {
      console.debug('[Profile] Profile validation failed:', profileErrors);
      return;
    }
  
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') formDataToSend.append(key, value);
    });
  
    try {
      console.log('[Profile] authService:', authService); // Debug
      const response = await authService.post(
        AUTH_PROFILE_PATH,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      useAuthStore.setState({ user: response });
      toast.success('Profile updated successfully!');
      setShowEditForm(false);
      setProfileErrors({});
      console.debug('[Profile] Profile updated successfully');
    } catch (error) {
      console.error('[Profile] Update error:', error.message);
      const errorData = error.response?.data || {};
      setProfileErrors(Object.keys(errorData).length > 0 ? errorData : {});
      toast.error(errorData.error || error.message || 'Profile update failed');
    }
  };

  const handlePasswordSubmit = async (formData) => {
    if (!validatePassword(formData)) {
      console.debug('[Profile] Password validation failed:', passwordErrors);
      return;
    }

    const dataToSend = {
      old_password: formData.old_password,
      new_password: formData.new_password,
    };

    try {
      if (!authService || typeof authService.post !== 'function') {
        throw new Error('authService.post is not available. Check authService configuration.');
      }
      await authService.post(AUTH_PASSWORD_CHANGE_PATH, dataToSend);
      toast.success('Password changed successfully! Please sign in again.');
      await logout(router);
      setPasswordErrors({});
      console.debug('[Profile] Password changed successfully');
    } catch (error) {
      console.error('[Profile] Password change error:', error.message);
      const errorData = error.response?.data || {};
      setPasswordErrors(Object.keys(errorData).length > 0 ? errorData : {});
      toast.error(errorData.error || error.message || 'Password change failed');
    }
  };

  if (!user) {
    return null; // Loading handled by RootLayout
  }

  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto mt-12 p-2 bg-white rounded-lg shadow-lg">
        <ProfileDisplay user={user} />
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            onClick={() => { setShowEditForm(!showEditForm); setShowPasswordForm(false); }}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {showEditForm ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button
            onClick={() => { setShowPasswordForm(!showPasswordForm); setShowEditForm(false); }}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
          </button>
        </div>
        {showEditForm && (
          <DynamicForm
            fields={profileFields}
            onSubmit={handleProfileSubmit}
            buttonText="Save Changes"
            errors={profileErrors}
            isLoading={isLoading}
            initialValues={profileInitialValues}
          />
        )}
        {showPasswordForm && (
          <DynamicForm
            fields={passwordFields}
            onSubmit={handlePasswordSubmit}
            buttonText="Update Password"
            errors={passwordErrors}
            isLoading={isLoading}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}