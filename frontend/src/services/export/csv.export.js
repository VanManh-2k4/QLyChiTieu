/**
 * CSV Export Service
 * Handles CSV file generation and download
 * @module services/export/csv.export
 */

import { validateExportData, formatVND, getScopeLabel } from './export.utils.js';

/**
 * @typedef {Object} ExportData
 * @property {Object} analytics - Analytics data
 * @property {Array} transactions - Transaction array
 * @property {Object} range - Date range
 */

/**
 * Escape CSV cell value
 * @param {string|number} value
 * @returns {string}
 */
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV content from export data
 * @param {ExportData} data
 * @returns {string}
 * @throws {Error} If data validation fails
 */
export function generateCsv(data) {
  try {
    validateExportData(data);

    // Handle both array and object with rows property
    const transactions = Array.isArray(data.transactions) 
      ? data.transactions 
      : (data.transactions?.rows || []);

    const lines = [];

    // Header
    lines.push('QLyChiTieu - Báo cáo tài chính');
    lines.push(`Phạm vi: ${getScopeLabel(data.range)}`);
    lines.push(`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`);
    lines.push('');

    // Analytics Summary
    lines.push('=== TỔNG QUAN ===');
    lines.push(`Tổng thu,${formatVND(data.analytics.totalIncome || 0)}`);
    lines.push(`Tổng chi,${formatVND(data.analytics.totalExpense || 0)}`);
    lines.push(`Chênh lệch,${formatVND(data.analytics.net || 0)}`);
    lines.push(`Số giao dịch,${data.analytics.transactionCount || 0}`);
    lines.push(`Tỷ lệ thu,${data.analytics.incomeSharePct || 0}%`);
    lines.push(`Tỷ lệ chi,${data.analytics.expenseSharePct || 0}%`);
    lines.push('');

    // Time Series
    if (data.analytics.timeSeries && Array.isArray(data.analytics.timeSeries) && data.analytics.timeSeries.length > 0) {
      lines.push('=== BIẾN ĐỘNG THEO KỲ ===');
      lines.push('Kỳ,Thu nhập,Chi tiêu');
      data.analytics.timeSeries.forEach((item) => {
        lines.push(`${csvCell(item.label)},${formatVND(item.income)},${formatVND(item.expense)}`);
      });
      lines.push('');
    }

    // Transaction List
    lines.push('=== DANH SÁCH GIAO DỊCH ===');
    lines.push('Thời gian,Ví,Danh mục,Loại,Số tiền,Ghi chú');
    
    if (transactions.length === 0) {
      lines.push('Không có giao dịch trong phạm vi này');
    } else {
      transactions.forEach((t) => {
        const dateStr = t.date ? new Date(t.date).toLocaleString('vi-VN') : '';
        lines.push(
          `${csvCell(dateStr)},` +
          `${csvCell(t.walletName || '')},` +
          `${csvCell(t.categoryName || '')},` +
          `${csvCell(t.type === 'income' ? 'Thu' : 'Chi')},` +
          `${formatVND(t.amount)},` +
          `${csvCell(t.note || '')}`
        );
      });
    }

    return lines.join('\n');
  } catch (error) {
    throw new Error(`Không thể tạo CSV: ${error.message}`);
  }
}

/**
 * Download CSV file
 * @param {string} content
 * @param {string} filename
 * @throws {Error} If download fails
 */
export function downloadCsv(content, filename = 'bao-cao-lychitieu.csv') {
  try {
    if (!content || typeof content !== 'string') {
      throw new Error('Nội dung CSV không hợp lệ');
    }

    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    
    if (blob.size === 0) {
      throw new Error('File CSV trống');
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
    throw new Error(`Không thể tải CSV: ${error.message}`);
  }
}

