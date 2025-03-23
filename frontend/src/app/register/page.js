// src/app/register/page.js
'use client';
/**
 * Register page component with enhanced styling and client-side validation.
 * Integrates with authStore for user registration.
 */

import { useState } from 'react';
import useAuthStore from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DynamicForm } from '@/components/common/DynamicForm';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Link from 'next/link';

export default function Register() {
  const { register, isLoading } = useAuthStore();
  const router = useRouter();
  const [errors, setErrors] = useState({});

  const fields = [
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email', required: true },
    { name: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter your first name', required: true },
    { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter your last name', required: true },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password', required: true },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password', required: true },
  ];

  const validateForm = (formData) => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[0-9]/.test(formData.password) || !/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = 'Password must contain a number and a special character (!@#$%^&*)';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (formData) => {
    if (!validateForm(formData)) {
      console.debug('[Register] Validation failed:', errors);
      return;
    }

    const dataToSend = {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
    };

    try {
      await register(dataToSend, router);
      setErrors({});
      console.debug('[Register] Success: User registered');
    } catch (error) {
      console.error('[Register] Error:', error.message);
      const errorData = error.response?.data || {};
      if (Object.keys(errorData).length > 0 && !errorData.error) {
        setErrors(errorData); // Field-specific errors
        toast.error('Registration failed. Please check your inputs.');
      } else {
        toast.error(errorData.error || error.message || 'Registration failed');
      }
    }
  };

  const extraContent = (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-gray-500 text-center">
        Password must be at least 8 characters, include a number, and a special character (!@#$%^&*).
      </p>
      <p className="text-sm text-gray-600 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Sign Up</h1>
          <DynamicForm
            fields={fields}
            onSubmit={handleSubmit}
            buttonText="Sign Up"
            errors={errors}
            isLoading={isLoading}
            extraContent={extraContent}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}