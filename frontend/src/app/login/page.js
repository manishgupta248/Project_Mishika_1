// src/app/login/page.js
'use client';
/**
 * Login page component with enhanced styling and authentication flow.
 * Integrates with authStore for cookie-based JWT login.
 */

import { useState } from 'react';
import useAuthStore from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DynamicForm } from '@/components/common/DynamicForm';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Link from 'next/link';

export default function Login() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const [errors, setErrors] = useState({});

  const fields = [
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email', required: true },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password', required: true },
  ];

  const handleSubmit = async (formData) => {
    try {
      await login(formData, router);
      setErrors({});
      console.debug('[Login] Success: User authenticated');
    } catch (error) {
      console.error('[Login] Error:', error.message);
      const errorData = error.response?.data || {};
      if (Object.keys(errorData).length > 0 && !errorData.message) {
        setErrors(errorData); // Field-specific errors
        toast.error('Login failed. Please check your inputs.');
      } else {
        toast.error(errorData.error || error.message || 'Login failed');
      }
    }
  };

  const extraContent = (
    <p className="text-sm text-gray-600 text-center mt-4">
      Don’t have an account?{' '}
      <Link href="/register" className="text-blue-600 hover:underline font-medium">
        Register
      </Link>
    </p>
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Sign In</h1>
          <DynamicForm
            fields={fields}
            onSubmit={handleSubmit}
            buttonText="Sign In"
            errors={errors}
            isLoading={isLoading}
            extraContent={extraContent}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}