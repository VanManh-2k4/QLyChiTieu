/**
 * Export Service
 * Main service for handling data export operations
 * @module services/export/export.service
 */

import api from '../api.js';

/**
 * @typedef {Object} ExportParams
 * @property {string} mode - 'all' | 'day' | 'month' | 'year'
 * @property {string} [day] - Date string for day mode (YYYY-MM-DD)
 * @property {number} [month] - Month number (1-12)
 * @property {number} [year] - Year number
 * @property {string} [activityType] - Activity type filter
 */

/**
 * @typedef {Object} ExportData
 * @property {Object} analytics - Analytics data from history API
 * @property {Array} transactions - Array of transactions
 * @property {Object} range - Date range { dateFrom, dateTo }
 */

/**
 * Validate export params
 * @param {ExportParams} params
 * @throws {Error} If params are invalid
 */
function validateExportParams(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('Tham số export không hợp lệ');
  }

  const validModes = ['all', 'day', 'month', 'year'];
  if (!validModes.includes(params.mode)) {
    throw new Error('Phạm vi export không hợp lệ');
  }

  if (params.mode === 'day' && !params.day) {
    throw new Error('Vui lòng chọn ngày khi export theo ngày');
  }

  if (params.mode === 'month' && (!params.month || !params.year)) {
    throw new Error('Vui lòng chọn tháng và năm khi export theo tháng');
  }

  if (params.mode === 'year' && !params.year) {
    throw new Error('Vui lòng chọn năm khi export theo năm');
  }

  // Validate date format for day mode
  if (params.day) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.day)) {
      throw new Error('Định dạng ngày không hợp lệ (YYYY-MM-DD)');
    }
  }

  // Validate month range (ensure it's a number)
  const monthNum = Number(params.month);
  if (params.month && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
    throw new Error('Tháng phải từ 1 đến 12');
  }

  // Validate year range (ensure it's a number)
  const yearNum = Number(params.year);
  if (params.year && (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100)) {
    throw new Error('Năm phải từ 2000 đến 2100');
  }
}

/**
 * Fetch export data from API
 * @param {ExportParams} params
 * @returns {Promise<ExportData>}
 * @throws {Error} If API call fails or data is invalid
 */
export async function fetchExportData(params) {
  try {
    validateExportParams(params);

    const historyParams = {
      mode: params.mode,
      activityType: 'all',
      page: 1,
      limit: 10000,
      txPage: 1,
      txLimit: 10000,
      savingsPage: 1,
      savingsLimit: 10000,
      ...(params.day && { day: params.day }),
      ...(params.month && { month: Number(params.month) }),
      ...(params.year && { year: Number(params.year) }),
    };

    console.log("EXPORT - HISTORY PARAMS:", historyParams);

    const [historyRes, transactions] = await Promise.all([
      api.get('/history', { params: historyParams }),
      fetchAllTransactions(params),
    ]);

    // Validate response data
    if (!historyRes.data) {
      throw new Error('Không nhận được dữ liệu từ server');
    }

    const analytics = historyRes.data.analytics || {};
    const range = historyRes.data.range || {};

    // Validate transactions array
    if (!Array.isArray(transactions)) {
      throw new Error('Dữ liệu giao dịch không hợp lệ');
    }

    return {
      analytics,
      transactions,
      range,
    };
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.message || error.response.data?.error || 'Lỗi server khi fetch dữ liệu export';
      throw new Error(errorMsg);
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Không thể fetch dữ liệu export');
  }
}

/**
 * Fetch all transactions with pagination
 * @param {ExportParams} params
 * @returns {Promise<Array>}
 * @throws {Error} If API call fails
 */
async function fetchAllTransactions(params) {
  const all = [];
  let page = 1;
  const limit = 200;
  const MAX_PAGES = 100;
  let consecutiveEmptyPages = 0;
  const MAX_EMPTY_PAGES = 3;

  try {
    while (page <= MAX_PAGES) {
      const queryParams = {
        page: Number(page),
        limit: Number(limit),
        ...(params.day && { dateFrom: params.day, dateTo: params.day }),
        ...(params.month && params.year && {
          dateFrom: `${Number(params.year)}-${String(Number(params.month)).padStart(2, '0')}-01`,
          dateTo: `${Number(params.year)}-${String(Number(params.month)).padStart(2, '0')}-${new Date(Number(params.year), Number(params.month), 0).getDate()}`,
        }),
        ...(params.mode === 'year' && params.year && {
          dateFrom: `${Number(params.year)}-01-01`,
          dateTo: `${Number(params.year)}-12-31`,
        }),
      };

      console.log(`EXPORT - TRANSACTIONS PARAMS (page ${page}):`, queryParams);

      const { data } = await api.get('/transactions', { params: queryParams });
      
      if (!data || !Array.isArray(data.rows)) {
        throw new Error('Dữ liệu giao dịch không hợp lệ từ API');
      }

      const rows = data.rows || [];
      
      if (rows.length === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= MAX_EMPTY_PAGES) {
          break;
        }
      } else {
        consecutiveEmptyPages = 0;
        all.push(...rows);
      }

      const total = Number(data.total ?? 0);
      if (rows.length < limit || page * limit >= total) break;
      page += 1;
    }

    return all;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Lỗi server khi fetch giao dịch');
    }
    throw new Error('Không thể fetch danh sách giao dịch');
  }
}

/**
 * Build export params from form data
 * @param {Object} formData
 * @returns {ExportParams}
 */
export function buildExportParams(formData) {
  const params = {
    mode: formData.mode || 'all',
  };

  if (formData.mode === 'day' && formData.day) {
    params.day = formData.day;
  }

  if (formData.mode === 'month') {
    params.month = Number(formData.month);
    params.year = Number(formData.year);
  }

  if (formData.mode === 'year') {
    params.year = Number(formData.year);
  }

  console.log("EXPORT - BUILD PARAMS:", params);
  return params;
}
