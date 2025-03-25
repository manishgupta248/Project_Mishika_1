'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import useSyllabusStore from '@/stores/syllabusStore';
import useCourseStore from '@/stores/courseStore'; // For course dropdown
import GenericTable from '@/components/common/GenericTable';
import Pagination from '@/components/common/Pagination';

export default function SyllabiPage() {
  const {
    syllabi,
    pagination,
    isLoading,
    error,
    fetchSyllabi,
    createSyllabus,
    updateSyllabus,
    deleteSyllabus,
  } = useSyllabusStore();

  const { courses, fetchCourses } = useCourseStore();

  const [editingSyllabusId, setEditingSyllabusId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm({
    defaultValues: {
      course: '',
      syllabus_file: null,
      version: '1.0',
      description: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    fetchSyllabi({ page: currentPage });
    fetchCourses(); // Fetch courses for dropdown
  }, [fetchSyllabi, fetchCourses, currentPage]);

  useEffect(() => {
    if (editingSyllabusId) {
      const syllabus = syllabi.find((s) => s.id === editingSyllabusId);
      if (syllabus) {
        setValue('course', syllabus.course);
        setValue('version', syllabus.version);
        setValue('description', syllabus.description || '');
        // syllabus_file is not pre-filled as it's a file input
      }
    } else {
      reset();
    }
  }, [editingSyllabusId, syllabi, setValue, reset]);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('course', data.course);
    if (data.syllabus_file) formData.append('syllabus_file', data.syllabus_file);
    formData.append('version', data.version);
    formData.append('description', data.description || '');

    try {
      if (editingSyllabusId) {
        await updateSyllabus(editingSyllabusId, formData);
        toast.success('Syllabus updated successfully!');
      } else {
        await createSyllabus(formData);
        toast.success('Syllabus created successfully!');
      }
      setEditingSyllabusId(null);
      reset();
      fetchSyllabi({ page: currentPage });
    } catch (err) {
      // Errors handled by store
    }
  };

  const handleEdit = (syllabus) => {
    setEditingSyllabusId(syllabus.id);
  };

  const handleDelete = (syllabus) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border max-w-md">
        <p className="text-lg font-semibold mb-2">Are you sure?</p>
        <p className="text-gray-700">Do you want to delete syllabus for "{syllabus.course_name}" v{syllabus.version}?</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={async () => {
              try {
                await deleteSyllabus(syllabus.id);
                toast.dismiss(t.id);
                fetchSyllabi({ page: currentPage });
              } catch (error) {
                toast.dismiss(t.id);
                toast.error('Failed to delete syllabus');
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
            disabled={isLoading}
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const syllabusFields = [
    {
      name: 'course',
      label: 'Course',
      type: 'select',
      required: true,
      options: courses
        .filter((course) => !course.is_deleted)
        .map((course) => ({
          value: course.course_code,
          label: `${course.course_code} - ${course.course_name}`,
        })),
      placeholder: 'Select course',
    },
    {
      name: 'syllabus_file',
      label: 'Syllabus File (PDF)',
      type: 'file',
      required: !editingSyllabusId, // Required only for create
      accept: '.pdf',
    },
    {
      name: 'version',
      label: 'Version',
      type: 'text',
      required: true,
      placeholder: 'e.g., 1.0',
      maxLength: 10,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional notes',
    },
  ];

  const syllabusColumns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'course_name',
      label: 'Course Name',
      sortable: true,
      render: (item) => (
        <button
          onClick={() => showDetails(item)}
          className="text-blue-600 hover:underline"
        >
          {item.course_name}
        </button>
      ),
    },
    { key: 'course', label: 'Course Code', sortable: true },
    { key: 'version', label: 'Version', sortable: true },
    {
      key: 'syllabus_file',
      label: 'File',
      render: (item) => (
        <a href={item.syllabus_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Download
        </a>
      ),
    },
    { key: 'uploaded_at', label: 'Uploaded At', sortable: true, render: (item) => new Date(item.uploaded_at).toLocaleString() },
  ];

  const showDetails = (syllabus) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border max-w-md">
        <h3 className="text-lg font-semibold">{syllabus.course_name} - v{syllabus.version}</h3>
        <p><strong>ID:</strong> {syllabus.id}</p>
        <p><strong>Course Code:</strong> {syllabus.course}</p>
        <p><strong>File:</strong> <a href={syllabus.syllabus_file} target="_blank" rel="noopener noreferrer" className="text-blue-600">Download</a></p>
        <p><strong>Description:</strong> {syllabus.description || '-'}</p>
        <p><strong>Uploaded By:</strong> {syllabus.uploaded_by || 'Unknown'}</p>
        <p><strong>Uploaded At:</strong> {new Date(syllabus.uploaded_at).toLocaleString()}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-2 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    ));
  };

  const activeSyllabi = Array.isArray(syllabi)
    ? syllabi.filter((syllabus) => !syllabus.is_deleted)
    : [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#800000]">Syllabi</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => useSyllabusStore.setState({ error: null })}
            className="text-red-900 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Custom 3-Column Form */}
        <div className="w-full bg-green-50 border border-green-200 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6  text-[#800000]">
            {editingSyllabusId ? 'Update Syllabus' : 'Create Syllabus'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4" noValidate>
            {syllabusFields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Controller
                  name={field.name}
                  control={control}
                  rules={{
                    required: field.required ? `${field.label} is required` : false,
                    maxLength: field.maxLength
                      ? { value: field.maxLength, message: `${field.label} exceeds ${field.maxLength} characters` }
                      : undefined,
                  }}
                  render={({ field: { onChange, onBlur, value, ref } }) => {
                    if (field.type === 'select') {
                      return (
                        <select
                          id={field.name}
                          value={value || ''}
                          onChange={onChange}
                          onBlur={onBlur}
                          ref={ref}
                          className="mt-1 block w-full p-2 bg-white border border-gray-700 rounded-md focus:ring focus:ring-blue-300"
                          disabled={isLoading || isSubmitting}
                        >
                          <option value="" disabled>{field.placeholder}</option>
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      );
                    } else if (field.type === 'file') {
                      return (
                        <input
                          type="file"
                          id={field.name}
                          onChange={(e) => onChange(e.target.files[0])}
                          onBlur={onBlur}
                          ref={ref}
                          accept={field.accept}
                          className="mt-1 block w-full p-2 bg-white border border-gray-700 rounded-md"
                          disabled={isLoading || isSubmitting}
                        />
                      );
                    } else if (field.type === 'textarea') {
                      return (
                        <textarea
                          id={field.name}
                          value={value || ''}
                          onChange={onChange}
                          onBlur={onBlur}
                          ref={ref}
                          placeholder={field.placeholder}
                          className="mt-1 block w-full p-2 bg-white border border-gray-700 rounded-md focus:ring focus:ring-blue-300"
                          disabled={isLoading || isSubmitting}
                          rows="3"
                        />
                      );
                    }
                    return (
                      <input
                        type={field.type}
                        id={field.name}
                        value={value || ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        placeholder={field.placeholder}
                        className="mt-1 block w-full p-2 bg-white border border-gray-700 rounded-md focus:ring focus:ring-blue-300"
                        disabled={isLoading || isSubmitting}
                      />
                    );
                  }}
                />
                {errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
                )}
              </div>
            ))}
            <div className="md:col-span-3 flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? 'Submitting...' : (editingSyllabusId ? 'Update Syllabus' : 'Create Syllabus')}
              </button>
              {editingSyllabusId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSyllabusId(null);
                    reset();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table and Pagination */}
        <div className="w-full">
          <GenericTable
            title = 'Syllabi List'
            data={activeSyllabi}
            columns={syllabusColumns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <Pagination
            count={pagination.count}
            next={pagination.next}
            previous={pagination.previous}
            onPageChange={handlePageChange}
            pageSize={5} // Matches backend default from SyllabusPagination
          />
        </div>
      </div>
    </div>
  );
}