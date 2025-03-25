'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import useDepartmentStore from '@/stores/departmentStore';
import { DynamicForm } from '@/components/common/DynamicForm';
import GenericTable from '@/components/common/GenericTable';

export default function DepartmentsPage() {
  const {
    departments,
    facultyChoices,
    isLoading,
    error,
    fetchDepartments,
    fetchFacultyChoices,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartmentStore();

  const [editingId, setEditingId] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchDepartments();
    fetchFacultyChoices();
  }, [fetchDepartments, fetchFacultyChoices]);

  const handleSubmit = async (data) => {
    try {
      if (editingId) {
        await updateDepartment(editingId, data);
        toast.success('Department updated successfully!');
      } else {
        await createDepartment(data);
        toast.success('Department created successfully!');
      }
      setEditingId(null);
      setFormKey((prev) => prev + 1);
    } catch (err) {
      // Errors are handled by the store
    }
  };

  const handleEdit = (dept) => {
    setEditingId(dept.id);
    setFormKey((prev) => prev + 1);
  };

  const handleDelete = (item) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border max-w-md">
        <p className="text-lg font-semibold mb-2">Are you sure?</p>
        <p className="text-gray-700">Do you want to delete "{item.name}"?</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={async () => {
              try {
                await deleteDepartment(item.id);
                toast.dismiss(t.id);
               // toast.success('Department deleted successfully!'); // Move success toast here
              } catch (error) {
                toast.dismiss(t.id);
                toast.error('Failed to delete department');
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

  const departmentFields = [
    {
      name: 'name',
      label: 'Department Name',
      type: 'text',
      placeholder: 'Enter department name',
      required: true,
      maxLength: 50,
    },
    {
      name: 'faculty',
      label: 'Faculty',
      type: 'select',
      required: true,
      options: facultyChoices.map((choice) => ({
        value: choice.value,
        label: choice.label,
      })),
      placeholder: 'Select faculty',
    },
  ];

  const initialValues = editingId
    ? departments.find((d) => d.id === editingId) || {}
    : {};

  const departmentColumns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (item) => (
        <button
          onClick={() => showDetails(item)}
          className="text-blue-600 hover:underline"
        >
          {item.name}
        </button>
      ),
    },
    { key: 'faculty', label: 'Faculty', sortable: true },
  ];

  const showDetails = (dept) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded shadow-lg border max-w-md">
        <h3 className="text-lg font-semibold">{dept.name}</h3>
        <p><strong>ID:</strong> {dept.id}</p>
        <p><strong>Faculty:</strong> {dept.faculty}</p>
        <p><strong>Created By:</strong> {dept.created_by || 'Unknown'}</p>
        <p><strong>Created At:</strong> {new Date(dept.created_at).toLocaleString()}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-2 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    ));
  };

  // Filter out soft-deleted departments for display
  const activeDepartments = departments.filter((dept) => !dept.is_deleted);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Departments</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => useDepartmentStore.setState({ error: null })}
            className="text-red-900 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <DynamicForm
            key={formKey}
            fields={departmentFields}
            onSubmit={handleSubmit}
            buttonText={editingId ? 'Update Department' : 'Create Department'}
            isLoading={isLoading}
            initialValues={initialValues}
            errors={error ? { form: error } : {}}
          />
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormKey((prev) => prev + 1);
              }}
              className="mt-2 w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="lg:w-2/3">
          <GenericTable
            data={activeDepartments} // Use filtered data
            columns={departmentColumns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}