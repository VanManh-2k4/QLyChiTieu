/**
 * ExportFilters Component
 * Filter form for data export
 * @module components/export/ExportFilters
 */

import React from 'react';

/**
 * @typedef {Object} ExportFiltersProps
 * @property {Object} filters - Current filter values
 * @property {string} filters.mode - Filter mode: 'all' | 'day' | 'month' | 'year'
 * @property {string} [filters.day] - Date string for day mode (YYYY-MM-DD)
 * @property {number} [filters.month] - Month number (1-12)
 * @property {number} [filters.year] - Year number
 * @property {Function} onChange - Callback when filters change
 * @property {boolean} [disabled] - Whether filters are disabled
 * @property {string} [error] - Error message to display
 */

/**
 * Validate filter values
 * @param {Object} filters
 * @returns {{valid: boolean, error: string|null}}
 */
function validateFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return { valid: false, error: 'Bộ lọc không hợp lệ' };
  }

  const validModes = ['all', 'day', 'month', 'year'];
  if (!validModes.includes(filters.mode)) {
    return { valid: false, error: 'Phạm vi không hợp lệ' };
  }

  if (filters.mode === 'day' && !filters.day) {
    return { valid: false, error: 'Vui lòng chọn ngày' };
  }

  if (filters.mode === 'month' && (!filters.month || !filters.year)) {
    return { valid: false, error: 'Vui lòng chọn tháng và năm' };
  }

  if (filters.mode === 'year' && !filters.year) {
    return { valid: false, error: 'Vui lòng chọn năm' };
  }

  // Validate date format
  if (filters.day) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(filters.day)) {
      return { valid: false, error: 'Định dạng ngày không hợp lệ (YYYY-MM-DD)' };
    }
  }

  // Validate month range
  if (filters.month && (filters.month < 1 || filters.month > 12)) {
    return { valid: false, error: 'Tháng phải từ 1 đến 12' };
  }

  // Validate year range
  if (filters.year && (filters.year < 1900 || filters.year > 2100)) {
    return { valid: false, error: 'Năm phải từ 1900 đến 2100' };
  }

  return { valid: true, error: null };
}

/**
 * ExportFilters component
 * @param {ExportFiltersProps} props
 * @returns {JSX.Element}
 */
export default function ExportFilters({ filters, onChange, disabled = false, error }) {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const validation = validateFilters(filters);
  const hasError = error || !validation.valid;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Mode Selector */}
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Phạm vi
          </span>
          <select
            value={filters.mode}
            onChange={(e) => handleChange('mode', e.target.value)}
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">Tất cả dữ liệu</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
        </label>

        {/* Month Mode Inputs */}
        {filters.mode === 'month' && (
          <>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tháng
              </span>
              <select
                value={filters.month || currentMonth}
                onChange={(e) => handleChange('month', Number(e.target.value))}
                disabled={disabled}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Năm
              </span>
              <input
                type="number"
                value={filters.year || currentYear}
                onChange={(e) => handleChange('year', Number(e.target.value))}
                disabled={disabled}
                min="1900"
                max="2100"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </>
        )}

        {/* Year Mode Input */}
        {filters.mode === 'year' && (
          <label className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Năm
            </span>
            <input
              type="number"
              value={filters.year || currentYear}
              onChange={(e) => handleChange('year', Number(e.target.value))}
              disabled={disabled}
              min="1900"
              max="2100"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        )}
      </div>

      {/* Validation Error */}
      {hasError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error || validation.error}
        </div>
      )}

      {/* Filter Summary */}
      {validation.valid && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Phạm vi export: </span>
          {filters.mode === 'all' && 'Tất cả dữ liệu'}
          {filters.mode === 'month' && `Tháng ${filters.month || currentMonth}/${filters.year || currentYear}`}
          {filters.mode === 'year' && `Năm ${filters.year || currentYear}`}
        </div>
      )}
    </div>
  );
}
