'use client';

/**
 * Reusable dynamic form component with Tailwind styling and react-hook-form.
 * Supports text inputs, textareas, file uploads, and select dropdowns with sanitization and accessibility.
 */

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

export function DynamicForm({
  fields, // Array of field configurations (e.g., { name, label, type, required, options })
  onSubmit, // Callback function to handle form submission
  buttonText, // Text to display on the submit button
  errors: externalErrors = {}, // External errors (e.g., from server) to display
  isLoading = false, // Loading state to disable form during submission
  extraContent, // Additional content to render below the form
  initialValues = {}, // Initial values to pre-populate the form
}) {
  // Initialize react-hook-form with default values and validation mode
  const {
    control, // Controller for managing form inputs
    handleSubmit, // Function to handle form submission
    formState: { errors, isSubmitting }, // Form state including validation errors and submission status
    setFocus, // Function to focus a specific field
    setError, // Function to manually set errors
  } = useForm({
    defaultValues: fields.reduce((acc, field) => {
      const rawValue = initialValues[field.name] || ''; // Get initial value or empty string
      const sanitizedValue = String(rawValue).replace(/\s+/g, ' ').trim(); // Sanitize initial value
      return { ...acc, [field.name]: sanitizedValue };
    }, {}),
    mode: 'onTouched', // Validate on blur or change after first interaction
  });

  const formRef = useRef(null); // Ref for form element to manage focus

  // Sync external errors (e.g., from server) with form state
  useEffect(() => {
    Object.entries(externalErrors).forEach(([name, message]) => {
      setError(name, { type: 'server', message }); // Set server-side errors
    });
  }, [externalErrors, setError]);

  // Focus the first field with an error after submission fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      setFocus(firstErrorField); // Focus on the first errored field
    }
  }, [errors, setFocus]);

  // Handle form submission with sanitized data
  const onFormSubmit = async (data) => {
    try {
      // Sanitize text fields before submission
      const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = value.replace(/\s+/g, ' ').trim(); // Remove extra spaces
        } else {
          acc[key] = value; // Keep non-string values (e.g., files) unchanged
        }
        return acc;
      }, {});
      await onSubmit(sanitizedData); // Call the provided submission handler
    } catch (error) {
      console.error(`[DynamicForm] Submission error for ${buttonText}:`, error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 p-6 bg-green-100 border border-green-200 rounded-lg shadow-md">
      {/* Form title */}
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">{buttonText}</h1>

      {/* Form element with submission handler */}
      <form
        ref={formRef}
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
        noValidate // Disable browser validation to rely on react-hook-form
        aria-label={`${buttonText} form`}
      >
        {fields.map((field) => (
          <div key={field.name}>
            {/* Field label with required indicator */}
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

            {/* Controller for managing form field state */}
            <Controller
              name={field.name}
              control={control}
              rules={{
                required: field.required ? `${field.label} is required` : false, // Required validation
                maxLength: field.maxLength
                  ? { value: field.maxLength, message: `${field.label} exceeds ${field.maxLength} characters` }
                  : undefined, // Max length validation
              }}
              render={({ field: { onChange, onBlur, value, ref } }) => {
                // Handle input change with sanitization
                const handleChange = (e) => {
                  const { value: inputValue, files } = e.target;
                  if (files) {
                    onChange(files[0]); // Handle file input
                  } else {
                    const sanitizedValue = inputValue.replace(/\s+/g, ' ').trimStart(); // Sanitize text input
                    onChange(sanitizedValue);
                  }
                };

                // Render different input types based on field.type
                if (field.type === 'textarea') {
                  return (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={value || ''} // Controlled value
                      onChange={handleChange}
                      onBlur={onBlur} // Trigger validation on blur
                      ref={ref} // Reference for focus management
                      className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none disabled:bg-gray-100"
                      placeholder={field.placeholder || ''} // Placeholder text
                      rows="3" // Default rows for textarea
                      maxLength={field.maxLength || 500} // Max length limit
                      disabled={isLoading || isSubmitting} // Disable during loading/submission
                      aria-required={field.required || false} // Accessibility attribute
                      aria-describedby={
                        errors[field.name] || externalErrors[field.name]
                          ? `${field.name}-error`
                          : undefined
                      } // Link to error message
                      aria-invalid={!!(errors[field.name] || externalErrors[field.name])} // Indicate invalid state
                    />
                  );
                } else if (field.type === 'file') {
                  return (
                    <input
                      type="file"
                      id={field.name}
                      name={field.name}
                      onChange={handleChange}
                      onBlur={onBlur}
                      ref={ref}
                      className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md disabled:bg-gray-100"
                      accept={field.accept || ''} // File type restriction
                      disabled={isLoading || isSubmitting}
                      aria-describedby={
                        errors[field.name] || externalErrors[field.name]
                          ? `${field.name}-error`
                          : undefined
                      }
                      aria-invalid={!!(errors[field.name] || externalErrors[field.name])}
                    />
                  );
                } else if (field.type === 'select') {
                  return (
                    <select
                      id={field.name}
                      name={field.name}
                      value={value || ''} // Controlled value
                      onChange={handleChange}
                      onBlur={onBlur}
                      ref={ref}
                      className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none disabled:bg-gray-100"
                      disabled={isLoading || isSubmitting}
                      aria-required={field.required || false}
                      aria-describedby={
                        errors[field.name] || externalErrors[field.name]
                          ? `${field.name}-error`
                          : undefined
                      }
                      aria-invalid={!!(errors[field.name] || externalErrors[field.name])}
                    >
                      {/* Default placeholder option */}
                      <option value="" disabled>
                        {field.placeholder || 'Select an option'}
                      </option>
                      {/* Map options for dropdown */}
                      {field.options && field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  );
                } else {
                  return (
                    <input
                      type={field.type || 'text'} // Default to text if type not specified
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
                }
              }}
            />

            {/* Display validation or server errors */}
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

        {/* Submit button */}
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

      {/* Optional extra content below the form */}
      {extraContent && <div className="mt-4">{extraContent}</div>}
    </div>
  );
}