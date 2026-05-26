/**
 * JSON Export Service
 * Handles JSON file generation and download
 * @module services/export/json.export
 */

import { validateExportData } from './export.utils.js';

/**
 * @typedef {Object} ExportData
 * @property {Object} analytics - Analytics data
 * @property {Array} transactions - Transaction array
 * @property {Object} range - Date range
 */

/**
 * @typedef {Object} BackupFilters
 * @property {string} mode - Filter mode: 'all' | 'day' | 'month' | 'year'
 * @property {string} [day] - Date string for day mode (YYYY-MM-DD)
 * @property {number} [month] - Month number (1-12)
 * @property {number} [year] - Year number
 */

/**
 * @typedef {Object} BackupData
 * @property {string} version - Backup format version
 * @property {string} timestamp - ISO timestamp
 * @property {BackupFilters} filters - Export filters used
 * @property {Object} data - Actual data (analytics, transactions, range)
 */

/**
 * Generate JSON content from export data (for viewing/export)
 * @param {ExportData} data
 * @returns {string}
 * @throws {Error} If data validation fails
 */
export function generateJson(data) {
  try {
    validateExportData(data);

    // Handle both array and object with rows property
    const transactions = Array.isArray(data.transactions) 
      ? data.transactions 
      : (data.transactions?.rows || []);

    const exportData = {
      meta: {
        app: 'QLyChiTieu',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: data.range,
      },
      analytics: data.analytics,
      transactions: transactions,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    throw new Error(`Không thể tạo JSON: ${error.message}`);
  }
}

/**
 * Generate backup JSON with version, timestamp, filters, and data
 * This format is designed for restore functionality
 * @param {ExportData} data
 * @param {BackupFilters} filters
 * @returns {string}
 * @throws {Error} If generation fails
 */
export function generateBackupJson(data, filters) {
  try {
    validateExportData(data);

    // Handle both array and object with rows property
    const transactions = Array.isArray(data.transactions) 
      ? data.transactions 
      : (data.transactions?.rows || []);

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      filters: {
        mode: filters.mode,
        ...(filters.day && { day: filters.day }),
        ...(filters.month && { month: filters.month }),
        ...(filters.year && { year: filters.year }),
      },
      data: {
        analytics: data.analytics,
        transactions: transactions,
        range: data.range,
      },
    };

    return JSON.stringify(backupData, null, 2);
  } catch (error) {
    throw new Error(`Không thể tạo backup JSON: ${error.message}`);
  }
}

/**
 * Download JSON file
 * @param {string} content
 * @param {string} filename
 * @throws {Error} If download fails
 */
export function downloadJson(content, filename = 'bao-cao-lychitieu.json') {
  try {
    if (!content || typeof content !== 'string') {
      throw new Error('Nội dung JSON không hợp lệ');
    }

    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    
    if (blob.size === 0) {
      throw new Error('File JSON trống');
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 100);
  } catch (error) {
    throw new Error(`Không thể tải JSON: ${error.message}`);
  }
}

/**
 * Generate backup filename based on date
 * @returns {string}
 */
export function generateBackupFilename() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `backup-lychitieu-${dateStr}-${timeStr}.json`;
}
