/**
 * Export Utilities
 * Shared utility functions for export services
 * @module services/export/export.utils
 */

/**
 * @typedef {Object} ExportData
 * @property {Object} analytics - Analytics data
 * @property {Array} transactions - Transaction array
 * @property {Object} range - Date range
 */

/**
 * Validate export data
 * @param {ExportData} data
 * @throws {Error} If data is invalid
 */
export function validateExportData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Dữ liệu export không hợp lệ');
  }

  if (!data.analytics || typeof data.analytics !== 'object') {
    throw new Error('Dữ liệu analytics không hợp lệ');
  }

  // Handle both array and object with rows property
  const transactions = Array.isArray(data.transactions) 
    ? data.transactions 
    : (data.transactions?.rows || []);
  
  if (!Array.isArray(transactions)) {
    throw new Error('Dữ liệu giao dịch không hợp lệ');
  }

  if (!data.range || typeof data.range !== 'object') {
    throw new Error('Dữ liệu phạm vi không hợp lệ');
  }
}

/**
 * Format VND for display
 * @param {number} amount
 * @returns {string}
 */
export function formatVND(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Format date to dd/MM/yyyy
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get scope label from range
 * @param {Object} range
 * @returns {string}
 */
export function getScopeLabel(range) {
  if (!range) return 'Tất cả';
  if (!range.dateFrom && !range.dateTo) return 'Tất cả';
  if (range.dateFrom === range.dateTo) return range.dateFrom;
  return `${range.dateFrom || ''} → ${range.dateTo || ''}`;
}

/**
 * Generate filename based on date range and extension
 * @param {string} extension - File extension (csv, json, xlsx)
 * @param {Object} range - Date range
 * @returns {string}
 */
export function generateFilename(extension, range) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  
  let scope = 'all';
  if (range?.dateFrom && range?.dateTo) {
    if (range.dateFrom === range.dateTo) {
      scope = range.dateFrom;
    } else {
      scope = `${range.dateFrom}-${range.dateTo}`;
    }
  }
  
  const safeScope = scope.replace(/[^a-zA-Z0-9-]/g, '-');
  return `bao-cao-lychitieu-${safeScope}-${dateStr}.${extension}`;
}
