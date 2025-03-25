'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import useCourseStore from '@/stores/courseStore';
import useDepartmentStore from '@/stores/departmentStore'; // To fetch departments for discipline dropdown
import GenericTable from '@/components/common/GenericTable';
import Pagination from '@/components/common/Pagination';
import { useForm, Controller } from 'react-hook-form';

export default function CoursesPage() {
  const {
    courses,
    pagination,
    courseCategoryChoices,
    courseTypeChoices,
    cbcsCategoryChoices,
    isLoading,
    error,
    fetchCourses,
    fetchCourseCategoryChoices,
    fetchCourseTypeChoices,
    fetchCBCSCategoryChoices,
    createCourse,
    updateCourse,
    deleteCourse,
  } = useCourseStore();

  const { departments, fetchDepartments } = useDepartmentStore();

  const [editingCourseCode, setEditingCourseCode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm({
    defaultValues: {
      course_code: '',
      course_name: '',
      course_category: '',
      type: '',
      cbcs_category: '',
      maximum_credit: '',
      discipline: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    fetchCourses({ page: currentPage });
    fetchCourseCategoryChoices();
    fetchCourseTypeChoices();
    fetchCBCSCategoryChoices();
    fetchDepartments();
  }, [
    fetchCourses,
    fetchCourseCategoryChoices,
    fetchCourseTypeChoices,
    fetchCBCSCategoryChoices,
    fetchDepartments,
    currentPage,
  ]);

  useEffect(() => {
    if (editingCourseCode) {
      const course = courses.find((c) => c.course_code === editingCourseCode);
      if (course) {
        setValue('course_code', course.course_code);
        setValue('course_name', course.course_name);
        setValue('course_category', course.course_category);
        setValue('type', course.type);
        setValue('cbcs_category', course.cbcs_category);
        setValue('maximum_credit', course.maximum_credit.toString());
        setValue('discipline', course.discipline?.id || course.discipline);
      }
    } else {
      reset();
    }
  }, [editingCourseCode, courses, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      data.maximum_credit = parseInt(data.maximum_credit, 10);
      if (editingCourseCode) {
        await updateCourse(editingCourseCode, data);
        toast.success('Course updated successfully!');
      } else {
        await createCourse(data);
        toast.success('Course created successfully!');
      }
      setEditingCourseCode(null);
      reset();
      fetchCourses({ page: currentPage }); // Refresh current page
    } catch (err) {
      // Errors handled by store
    }
  };

  const handleEdit = (course) => {
    setEditingCourseCode(course.course_code);
  };

  const handleDelete = (course) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border max-w-md">
        <p className="text-lg font-semibold mb-2">Are you sure?</p>
        <p className="text-gray-700">Do you want to delete "{course.course_name}"?</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={async () => {
              try {
                await deleteCourse(course.course_code);
                toast.dismiss(t.id);
                fetchCourses({ page: currentPage }); // Refresh current page
              } catch (error) {
                toast.dismiss(t.id);
                toast.error('Failed to delete course');
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

  const courseFields = [
    {
      name: 'course_code',
      label: 'Course Code',
      type: 'text',
      placeholder: 'e.g., CSE-101-V',
      required: true,
      maxLength: 10,
    },
    {
      name: 'course_name',
      label: 'Course Name',
      type: 'text',
      placeholder: 'e.g., Introduction to Programming',
      required: true,
      maxLength: 255,
    },
    {
      name: 'course_category',
      label: 'Category',
      type: 'select',
      required: true,
      options: courseCategoryChoices.map((choice) => ({
        value: choice.value,
        label: choice.label,
      })),
      placeholder: 'Select category',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: courseTypeChoices.map((choice) => ({
        value: choice.value,
        label: choice.label,
      })),
      placeholder: 'Select type',
    },
    {
      name: 'cbcs_category',
      label: 'CBCS Category',
      type: 'select',
      required: true,
      options: cbcsCategoryChoices.map((choice) => ({
        value: choice.value,
        label: choice.label,
      })),
      placeholder: 'Select CBCS category',
    },
    {
      name: 'maximum_credit',
      label: 'Maximum Credit',
      type: 'number',
      required: true,
      placeholder: '0-20',
    },
    {
      name: 'discipline',
      label: 'Discipline',
      type: 'select',
      required: true,
      options: departments
        .filter((dept) => !dept.is_deleted)
        .map((dept) => ({
          value: dept.id,
          label: dept.name,
        })),
      placeholder: 'Select department',
    },
  ];

  const courseColumns = [
    { key: 'course_code', label: 'Code', sortable: true },
    {
      key: 'course_name',
      label: 'Name',
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
    { key: 'course_category', label: 'Category', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'cbcs_category', label: 'CBCS Category', sortable: true },
    { key: 'maximum_credit', label: 'Credit', sortable: true },
    {
      key: 'discipline',
      label: 'Discipline',
      render: (item) => item.discipline?.name || item.discipline || '-',
    },
  ];

  const showDetails = (course) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border max-w-md">
        <h3 className="text-lg font-semibold">{course.course_name}</h3>
        <p><strong>Code:</strong> {course.course_code}</p>
        <p><strong>Category:</strong> {course.course_category}</p>
        <p><strong>Type:</strong> {course.type}</p>
        <p><strong>CBCS Category:</strong> {course.cbcs_category}</p>
        <p><strong>Credit:</strong> {course.maximum_credit}</p>
        <p><strong>Discipline:</strong> {course.discipline?.name || course.discipline || '-'}</p>
        <p><strong>Created By:</strong> {course.created_by || 'Unknown'}</p>
        <p><strong>Created At:</strong> {new Date(course.created_at).toLocaleString()}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-2 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    ));
  };

  const activeCourses = Array.isArray(courses)
    ? courses.filter((course) => !course.is_deleted)
    : [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#800000]">Courses</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => useCourseStore.setState({ error: null })}
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
            {editingCourseCode ? 'Update Course' : 'Create Course'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4" noValidate>
            {courseFields.map((field) => (
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
                    const handleChange = (e) => {
                      const inputValue = e.target.value;
                      onChange(typeof inputValue === 'string' ? inputValue.trimStart() : inputValue);
                    };
                    if (field.type === 'select') {
                      return (
                        <select
                          id={field.name}
                          value={value || ''}
                          onChange={handleChange}
                          onBlur={onBlur}
                          ref={ref}
                          className="mt-1 block w-full p-2 border bg-white border-gray-700 rounded-md focus:ring focus:ring-blue-300"
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
                    }
                    return (
                      <input
                        type={field.type}
                        id={field.name}
                        value={value || ''}
                        onChange={handleChange}
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
                {isLoading || isSubmitting ? 'Submitting...' : (editingCourseCode ? 'Update Course' : 'Create Course')}
              </button>
              {editingCourseCode && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourseCode(null);
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
            title ='Courses List'
            data={activeCourses}
            columns={courseColumns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <Pagination
            count={pagination.count}
            next={pagination.next}
            previous={pagination.previous}
            onPageChange={handlePageChange}
            pageSize={10} // Matches backend default from CoursePagination
          />
        </div>
      </div>
    </div>
  );
}