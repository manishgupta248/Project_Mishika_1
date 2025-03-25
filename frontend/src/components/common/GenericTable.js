'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

/**
 * A reusable table component with sorting, searching, action buttons, and resizable columns.
 * @param {Object} props
 * @param {Array<Object>} props.data - The data to display in the table.
 * @param {Array<{key: string, label: string, sortable?: boolean, render?: (item: Object) => React.ReactNode, width?: string}>} props.columns - Column configurations with optional initial width.
 * @param {boolean} [props.loading] - Whether the table is in a loading state.
 * @param {(item: Object) => void} [props.onEdit] - Callback for editing an item.
 * @param {(item: Object) => void} [props.onDelete] - Callback for deleting an item.
 */
export default function GenericTable({
  data = [],
  columns,
  loading = false,
  onEdit,
  onDelete,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [columnWidths, setColumnWidths] = useState(() =>
    columns.reduce((acc, col) => ({
      ...acc,
      [col.key]: col.width || 'auto', // Default to 'auto' if no width specified
    }), {})
  );
  const tableRef = useRef(null); // Ref for the table element
  const resizingColumn = useRef(null); // Track the column being resized
  const startX = useRef(0); // Starting X position for resize

  // Handle column sorting
  const handleSort = (key) => {
    if (!columns.find((col) => col.key === key)?.sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle column resize start
  const handleResizeStart = (e, columnKey) => {
    resizingColumn.current = columnKey;
    startX.current = e.clientX;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Handle column resize movement
  const handleResizeMove = (e) => {
    if (!resizingColumn.current) return;
    const th = tableRef.current.querySelector(`th[data-key="${resizingColumn.current}"]`);
    const currentWidth = th.getBoundingClientRect().width;
    const delta = e.clientX - startX.current;
    const newWidth = Math.max(50, currentWidth + delta); // Minimum width of 50px
    setColumnWidths((prev) => ({
      ...prev,
      [resizingColumn.current]: `${newWidth}px`,
    }));
    startX.current = e.clientX; // Update startX for smooth dragging
  };

  // Handle column resize end
  const handleResizeEnd = () => {
    resizingColumn.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Memoize filtered and sorted data for performance
  const filteredAndSortedData = useMemo(() => {
    let result = [...(Array.isArray(data) ? data : [])];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) =>
        columns.some((col) =>
          String(item[col.key] ?? '').toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        const compare = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }

    return result;
  }, [data, columns, searchTerm, sortConfig]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md">
      {loading && !data.length ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : filteredAndSortedData.length === 0 ? (
        <p className="text-gray-500 text-center">No items found.</p>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              disabled={loading}
              className="w-full p-2 border border-green-400 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-green-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Search table data"
            />
          </div>
          <div className="overflow-x-auto">
            <table
              ref={tableRef}
              className="min-w-full border-collapse border border-green-400"
            >
              <thead>
                <tr className="bg-[#800000] text-white">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      data-key={col.key} // For referencing in resize
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`border border-green-400 p-3 text-center text-sm font-semibold relative ${
                        col.sortable
                          ? 'cursor-pointer hover:bg-[#600000] transition-colors'
                          : ''
                      }`}
                      style={{ width: columnWidths[col.key] }} // Apply dynamic width
                      aria-sort={
                        col.sortable && sortConfig.key === col.key
                          ? sortConfig.direction
                          : 'none'
                      }
                    >
                      {col.label}
                      {col.sortable && sortConfig.key === col.key && (
                        <span aria-hidden="true">
                          {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                        </span>
                      )}
                      {/* Resize handle */}
                      <span
                        onMouseDown={(e) => handleResizeStart(e, col.key)}
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label={`Resize ${col.label} column`}
                      />
                    </th>
                  ))}
                  <th
                    className="border border-green-400 p-3 text-center text-sm font-semibold"
                    style={{ width: columnWidths['actions'] || 'auto' }}
                  >
                    Actions
                    <span
                      onMouseDown={(e) => handleResizeStart(e, 'actions')}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity"
                      aria-label="Resize Actions column"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((item) => (
                  <tr
                    key={item.id || JSON.stringify(item)}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="border border-green-400 p-3 text-center"
                        style={{ width: columnWidths[col.key] }} // Apply dynamic width
                      >
                        {col.render ? col.render(item) : item[col.key] ?? '-'}
                      </td>
                    ))}
                    <td
                      className="border border-green-400 p-2 text-center"
                      style={{ width: columnWidths['actions'] || 'auto' }}
                    >
                      <button
                        onClick={() => onEdit?.(item)}
                        disabled={loading || !onEdit}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 mr-4 px-1 transition-colors"
                        aria-label={`Edit ${item.name || 'item'}`}
                      >
                        Edit
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        onClick={() => onDelete?.(item)}
                        disabled={loading || !onDelete}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 px-2 transition-colors"
                        aria-label={`Delete ${item.name || 'item'}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}