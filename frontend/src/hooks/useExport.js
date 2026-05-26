/**
 * useExport Hook
 * Custom hook for handling data export operations
 * Manages loading state, error state, and async export operations
 * Separates export logic from UI components for reusability
 * @module hooks/useExport
 */

import { useState, useCallback } from 'react';
import { fetchExportData, buildExportParams } from '../services/export/export.service.js';
import { generateCsv, downloadCsv } from '../services/export/csv.export.js';
import { generateJson, downloadJson, generateBackupJson, generateBackupFilename } from '../services/export/json.export.js';
import { generateExcel, downloadExcel } from '../services/export/excel.export.js';
import { generateFilename } from '../services/export/export.utils.js';

/**
 * @typedef {Object} UseExportOptions
 * @property {Function} [onSuccess] - Callback for successful export (format, filename) => void
 * @property {Function} [onError] - Callback for export error (format, errorMessage) => void
 * @property {Function} [onStart] - Callback when export starts (format) => void
 * @property {Function} [onComplete] - Callback when export completes (format, success) => void
 */

/**
 * @typedef {Object} UseExportReturn
 * @property {boolean} isExporting - Whether export is in progress
 * @property {string|null} error - Error message if export failed
 * @property {Function} exportCsv - Function to export as CSV
 * @property {Function} exportJson - Function to export as JSON
 * @property {Function} exportExcel - Function to export as Excel
 * @property {Function} exportBackup - Function to export as backup JSON
 * @property {Function} exportData - Generic export function
 * @property {Function} clearError - Function to clear error state
 * @property {Function} reset - Function to reset all states
 */

/**
 * Validate export filters
 * @param {Object} filters
 * @throws {Error} If filters are invalid
 */
function validateFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    throw new Error('Bộ lọc không hợp lệ');
  }

  const validModes = ['all', 'day', 'month', 'year'];
  if (!validModes.includes(filters.mode)) {
    throw new Error('Chế độ bộ lọc không hợp lệ');
  }

  if (filters.mode === 'day' && !filters.day) {
    throw new Error('Vui lòng chọn ngày');
  }

  if (filters.mode === 'month' && (!filters.month || !filters.year)) {
    throw new Error('Vui lòng chọn tháng và năm');
  }

  if (filters.mode === 'year' && !filters.year) {
    throw new Error('Vui lòng chọn năm');
  }

  // Validate date format
  if (filters.day) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(filters.day)) {
      throw new Error('Định dạng ngày không hợp lệ (YYYY-MM-DD)');
    }
  }

  // Validate month range (ensure it's a number)
  const monthNum = Number(filters.month);
  if (filters.month && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
    throw new Error('Tháng phải từ 1 đến 12');
  }

  // Validate year range (ensure it's a number and match backend)
  const yearNum = Number(filters.year);
  if (filters.year && (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100)) {
    throw new Error('Năm phải từ 2000 đến 2100');
  }
}

/**
 * Custom hook for data export
 * Provides complete export functionality with loading state, error handling, and callbacks
 * @param {UseExportOptions} options
 * @returns {UseExportReturn}
 */
export default function useExport({ onSuccess, onError, onStart, onComplete } = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generic export handler
   * @param {string} format - Export format (csv, json, excel, backup)
   * @param {Object} filters - Filter parameters
   * @param {string} [filename] - Optional filename
   * @returns {Promise<void>}
   */
  const exportData = useCallback(async (format, filters, filename) => {
    setIsExporting(true);
    setError(null);

    try {
      // Validate filters
      validateFilters(filters);

      console.log("USEEXPORT - FILTERS:", filters);

      // Call start callback
      if (onStart) {
        onStart(format);
      }

      // Build params with sanitization
      const params = buildExportParams(filters);

      // Fetch data
      const data = await fetchExportData(params);

      // Generate and download based on format
      let finalFilename;
      switch (format) {
        case 'csv':
          const csvContent = generateCsv(data);
          finalFilename = filename || generateFilename('csv', data.range);
          downloadCsv(csvContent, finalFilename);
          break;


        case 'json':
          const jsonContent = generateJson(data);
          finalFilename = filename || generateFilename('json', data.range);
          downloadJson(jsonContent, finalFilename);
          break;

        case 'excel':
          const blob = await generateExcel(data);
          downloadExcel(blob, data.range);
          finalFilename = filename; // downloadExcel now generates professional filename
          break;

        case 'backup':
          const backupContent = generateBackupJson(data, filters);
          finalFilename = filename || generateBackupFilename();
          downloadJson(backupContent, finalFilename);
          break;

        default:
          throw new Error(`Định dạng export không hợp lệ: ${format}`);
      }

      // Success callback
      if (onSuccess) {
        onSuccess(format, finalFilename);
      }

      // Complete callback
      if (onComplete) {
        onComplete(format, true);
      }

    } catch (err) {
      let errorMessage = err.message || `Không thể xuất ${format}`;
      
      // Extract more detailed error from Axios response if available
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        errorMessage = Array.isArray(err.response.data.details) 
          ? err.response.data.details.join(', ')
          : err.response.data.details;
      }
      
      setError(errorMessage);
      console.error(`${format.toUpperCase()} Export Error:`, err);

      // Error callback
      if (onError) {
        onError(format, errorMessage);
      }

      // Complete callback
      if (onComplete) {
        onComplete(format, false);
      }

      throw err;
    } finally {
      setIsExporting(false);
    }
  }, [onSuccess, onError, onStart, onComplete]);

  /**
   * Export data as CSV
   * @param {Object} filters - Filter parameters
   * @param {string} [filename] - Optional filename
   * @returns {Promise<void>}
   */
  const exportCsv = useCallback(async (filters, filename) => {
    await exportData('csv', filters, filename);
  }, [exportData]);


  /**
   * Export data as JSON
   * @param {Object} filters - Filter parameters
   * @param {string} [filename] - Optional filename
   * @returns {Promise<void>}
   */
  const exportJson = useCallback(async (filters, filename) => {
    await exportData('json', filters, filename);
  }, [exportData]);

  /**
   * Export data as Excel
   * @param {Object} filters - Filter parameters
   * @param {string} [filename] - Optional filename
   * @returns {Promise<void>}
   */
  const exportExcel = useCallback(async (filters, filename) => {
    await exportData('excel', filters, filename);
  }, [exportData]);

  /**
   * Export data as backup JSON
   * @param {Object} filters - Filter parameters
   * @param {string} [filename] - Optional filename
   * @returns {Promise<void>}
   */
  const exportBackup = useCallback(async (filters, filename) => {
    await exportData('backup', filters, filename);
  }, [exportData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setError(null);
    setIsExporting(false);
  }, []);

  return {
    isExporting,
    error,
    exportCsv,
    exportJson,
    exportExcel,
    exportBackup,
    exportData,
    clearError,
    reset,
  };
}
