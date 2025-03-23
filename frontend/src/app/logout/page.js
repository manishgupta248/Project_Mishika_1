// src/app/logout/page.js
'use client';
/**
 * Logout page component with confirmation modal and smooth redirection.
 * Integrates with authStore for logout functionality.
 */

import { useState, useEffect } from 'react';
import useAuthStore from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Modal } from '@/components/common/Model';

export default function Logout() {
  const { logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleConfirmLogout = async () => {
    try {
      await logout(router);
      console.debug('[Logout] Success: User logged out');
      setIsModalOpen(false);
    } catch (error) {
      console.error('[Logout] Error:', error.message);
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
      toast.error(error.response?.data?.error || error.message || 'Logout failed');
      router.push('/login');
      setIsModalOpen(false);
    }
  };

  const handleCancelLogout = () => {
    setIsModalOpen(false);
    router.push('/profile');
  };

  useEffect(() => {
    if (!isModalOpen && isAuthenticated) {
      console.debug('[Logout] Cancelled, redirecting to /profile');
      router.push('/profile');
    }
  }, [isModalOpen, isAuthenticated, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <Modal
        isOpen={isModalOpen}
        title="Confirm Logout"
        message="Are you sure you want to sign out?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
      {!isModalOpen && (
        <p className="text-lg font-semibold text-gray-700 animate-pulse">Signing you out...</p>
      )}
    </div>
  );
}