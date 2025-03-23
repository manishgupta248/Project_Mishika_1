// src/components/common/DynamicForm.js
'use client';
/**
 * Reusable dynamic form component with Tailwind styling and react-hook-form.
 * Supports text inputs, textareas, and file uploads with sanitization and accessibility.
 */

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

export function DynamicForm({
  fields,
  onSubmit,
  buttonText,
  errors: externalErrors = {},
  isLoading = false,
  extraContent,
  initialValues = {},
}) {
  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    setError,
  } = useForm({
    defaultValues: fields.reduce((acc, field) => {
      const rawValue = initialValues[field.name] || '';
      const sanitizedValue = String(rawValue).replace(/\s+/g, ' ').trim();
      return { ...acc, [field.name]: sanitizedValue };
    }, {}),
    mode: 'onTouched', // Validate on blur or change after first interaction
  });

  const formRef = useRef(null); // Ref for focus management

  // Sync external errors (e.g., from server) with form state
  useEffect(() => {
    Object.entries(externalErrors).forEach(([name, message]) => {
      setError(name, { type: 'server', message });
    });
  }, [externalErrors, setError]);

  // Focus the first error field after submission fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      setFocus(firstErrorField);
    }
  }, [errors, setFocus]);

  // Handle form submission
  const onFormSubmit = async (data) => {
    try {
      // Sanitize text fields before submission
      const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = value.replace(/\s+/g, ' ').trim();
        } else {
          acc[key] = value; // File inputs remain unchanged
        }
        return acc;
      }, {});
      await onSubmit(sanitizedData);
    } catch (error) {
      console.error(`[DynamicForm] Submission error for ${buttonText}:`, error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 p-6 bg-green-100 border border-green-200 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">{buttonText}</h1>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
        noValidate // Prevent browser validation to rely on react-hook-form
        aria-label={`${buttonText} form`}
      >
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}
              {field.required && (
                <span className="text-red-500 ml-1" aria-hidden="true">
                  *
                </span>
              )}
            </label>
            <Controller
              name={field.name}
              control={control}
              rules={{
                required: field.required ? `${field.label} is required` : false,
                maxLength: field.maxLength ? { value: field.maxLength, message: `${field.label} exceeds ${field.maxLength} characters` } : undefined,
              }}
              render={({ field: { onChange, onBlur, value, ref } }) => {
                const handleChange = (e) => {
                  const { value: inputValue, files } = e.target;
                  if (files) {
                    onChange(files[0]); // Handle file input
                  } else {
                    const sanitizedValue = inputValue.replace(/\s+/g, ' ').trimStart();
                    onChange(sanitizedValue); // Update form state
                  }
                };

                return field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={value || ''}
                    onChange={handleChange}
                    onBlur={onBlur}
                    ref={ref}
                    className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none disabled:bg-gray-100"
                    placeholder={field.placeholder || ''}
                    rows="3"
                    maxLength={field.maxLength || 500}
                    disabled={isLoading || isSubmitting}
                    aria-required={field.required || false}
                    aria-describedby={
                      errors[field.name] || externalErrors[field.name]
                        ? `${field.name}-error`
                        : undefined
                    }
                    aria-invalid={!!(errors[field.name] || externalErrors[field.name])}
                  />
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    id={field.name}
                    name={field.name}
                    onChange={handleChange}
                    onBlur={onBlur}
                    ref={ref}
                    className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md disabled:bg-gray-100"
                    accept={field.accept || ''}
                    disabled={isLoading || isSubmitting}
                    aria-describedby={
                      errors[field.name] || externalErrors[field.name]
                        ? `${field.name}-error`
                        : undefined
                    }
                    aria-invalid={!!(errors[field.name] || externalErrors[field.name])}
                  />
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={value || ''}
                    onChange={handleChange}
                    onBlur={onBlur}
                    ref={ref}
                    className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none disabled:bg-gray-100"
                    placeholder={field.placeholder || ''}
                    disabled={isLoading || isSubmitting}
                    aria-required={field.required || false}
                    aria-describedby={
                      errors[field.name] || externalErrors[field.name]
                        ? `${field.name}-error`
                        : undefined
                    }
                    aria-invalid={!!(errors[field.name] || externalErrors[field.name])}
                  />
                );
              }}
            />
            {(errors[field.name] || externalErrors[field.name]) && (
              <p
                id={`${field.name}-error`}
                className="text-red-500 text-sm mt-1"
                role="alert"
              >
                {errors[field.name]?.message || externalErrors[field.name]}
              </p>
            )}
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={isLoading || isSubmitting}
          aria-busy={isLoading || isSubmitting}
          aria-label={`Submit ${buttonText}`}
        >
          {isLoading || isSubmitting ? 'Submitting...' : buttonText}
        </button>
      </form>
      {extraContent && <div className="mt-4">{extraContent}</div>}
    </div>
  );
}