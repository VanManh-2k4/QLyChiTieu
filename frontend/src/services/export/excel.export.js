/**
 * Excel Export Service
 * Professional single-sheet financial report optimized for A4 portrait print.
 * Only uses ordinary cells, borders, fills, fonts and alignment.
 * NO Excel Table, NO worksheet.addTable(), NO table styles.
 * All styling is manual using cell.font, cell.fill, cell.border, cell.alignment.
 * Designed for production-ready export, clean layout, and easy maintenance.
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { validateExportData, formatVND, getScopeLabel } from './export.utils.js';

// Color palette - professional and modern
const COLORS = {
  DARK_BLUE: 'FF1E3A8A',      // Xanh đậm cho header
  MEDIUM_BLUE: 'FF3B82F6',    // Xanh trung bình
  LIGHT_BLUE: 'FFDBEAFE',     // Xanh nhạt
  WHITE: 'FFFFFFFF',          // Trắng
  GRAY_100: 'FFF3F4F6',       // Xám rất nhạt
  GRAY_200: 'FFE5E7EB',       // Xám nhạt
  GRAY_300: 'FFD1D5DB',       // Xám trung bình
  GRAY_500: 'FF6B7280',       // Xám đậm
  GRAY_700: 'FF374151',       // Xám rất đậm
  GRAY_800: 'FF1F2937',       // Xám đen
  BORDER: 'FFD1D5DB',         // Màu border
  GREEN: 'FF10B981',          // Xanh lá cho số dương
  RED: 'FFEF4444',            // Đỏ cho số âm
};

// Font styles
const FONTS = {
  TITLE: { bold: true, size: 18, color: { argb: COLORS.WHITE }, name: 'Arial' },
  SUBTITLE: { bold: true, size: 12, color: { argb: COLORS.WHITE }, name: 'Arial' },
  INFO: { size: 10, color: { argb: COLORS.WHITE }, name: 'Arial' },
  SECTION: { bold: true, size: 12, color: { argb: COLORS.DARK_BLUE }, name: 'Arial' },
  SUMMARY_LABEL: { bold: true, size: 10, color: { argb: COLORS.GRAY_700 }, name: 'Arial' },
  SUMMARY_VALUE: { bold: true, size: 12, color: { argb: COLORS.GRAY_800 }, name: 'Arial' },
  TABLE_HEADER: { bold: true, size: 10, color: { argb: COLORS.WHITE }, name: 'Arial' },
  TABLE_CELL: { size: 10, color: { argb: COLORS.GRAY_800 }, name: 'Arial' },
  FOOTER: { italic: true, size: 9, color: { argb: COLORS.GRAY_500 }, name: 'Arial' },
};

// Alignment styles
const ALIGNMENT = {
  CENTER: { horizontal: 'center', vertical: 'middle', wrapText: false },
  LEFT: { horizontal: 'left', vertical: 'middle', wrapText: true },
  RIGHT: { horizontal: 'right', vertical: 'middle', wrapText: false },
};

// Border styles
const BORDER_THIN = { style: 'thin', color: { argb: COLORS.BORDER } };
const BORDER_MEDIUM = { style: 'medium', color: { argb: COLORS.GRAY_300 } };
const BORDERS = {
  ALL: { top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN },
  NONE: {},
  HEADER: { top: BORDER_MEDIUM, left: BORDER_MEDIUM, bottom: BORDER_MEDIUM, right: BORDER_MEDIUM },
};

// Fill styles
const FILLS = {
  DARK_BLUE: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.DARK_BLUE } },
  LIGHT_BLUE: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BLUE } },
  GRAY_100: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GRAY_100 } },
  GRAY_200: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GRAY_200 } },
  WHITE: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.WHITE } },
};

// Number formats
const NUM_FORMATS = {
  CURRENCY_VND: '#,##0',
  PERCENTAGE: '0.00%',
  DATE: 'dd/mm/yyyy',
};

// Predefined style combinations
const STYLES = {
  TITLE: { font: FONTS.TITLE, fill: FILLS.DARK_BLUE, alignment: ALIGNMENT.CENTER, border: BORDERS.NONE },
  SUBTITLE: { font: FONTS.SUBTITLE, fill: FILLS.DARK_BLUE, alignment: ALIGNMENT.CENTER, border: BORDERS.NONE },
  HEADER_INFO: { font: FONTS.INFO, fill: FILLS.DARK_BLUE, alignment: ALIGNMENT.CENTER, border: BORDERS.NONE },
  SECTION_TITLE: { font: FONTS.SECTION, fill: FILLS.LIGHT_BLUE, alignment: ALIGNMENT.LEFT, border: BORDERS.NONE },
  SUMMARY_LABEL: { font: FONTS.SUMMARY_LABEL, fill: FILLS.GRAY_100, alignment: ALIGNMENT.LEFT, border: BORDERS.ALL },
  SUMMARY_VALUE: { font: FONTS.SUMMARY_VALUE, fill: FILLS.WHITE, alignment: ALIGNMENT.RIGHT, border: BORDERS.ALL },
  TABLE_HEADER: { font: FONTS.TABLE_HEADER, fill: FILLS.DARK_BLUE, alignment: ALIGNMENT.CENTER, border: BORDERS.HEADER },
  TABLE_CELL: { font: FONTS.TABLE_CELL, fill: FILLS.WHITE, alignment: ALIGNMENT.LEFT, border: BORDERS.ALL },
  TABLE_CELL_CENTER: { font: FONTS.TABLE_CELL, fill: FILLS.WHITE, alignment: ALIGNMENT.CENTER, border: BORDERS.ALL },
  TABLE_CELL_RIGHT: { font: FONTS.TABLE_CELL, fill: FILLS.WHITE, alignment: ALIGNMENT.RIGHT, border: BORDERS.ALL },
  TABLE_CELL_WRAP: { font: FONTS.TABLE_CELL, fill: FILLS.WHITE, alignment: ALIGNMENT.LEFT, border: BORDERS.ALL },
  FOOTER: { font: FONTS.FOOTER, fill: FILLS.WHITE, alignment: ALIGNMENT.CENTER, border: BORDERS.NONE },
};

/**
 * Convert any value to a safe number.
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Convert any value to a trimmed string.
 * @param {any} value
 * @param {string} fallback
 * @returns {string}
 */
function safeString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

/**
 * Format date to dd/MM/yyyy.
 * @param {string|Date} raw
 * @returns {string}
 */
function formatDateLabel(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return safeString(raw);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date-time for header.
 * @param {string|Date} raw
 * @returns {string}
 */
function formatDateTimeLabel(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return safeString(raw);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

/**
 * Format transaction type to Vietnamese.
 * @param {string} rawType
 * @returns {string}
 */
function formatTransactionType(rawType) {
  const type = safeString(rawType).toLowerCase();
  if (type === 'income') return 'Thu nhập';
  if (type === 'expense') return 'Chi tiêu';
  if (type === 'transfer') return 'Chuyển khoản';
  return safeString(rawType, 'Khác');
}

/**
 * Build range label from range object.
 * @param {Object} range
 * @returns {string}
 */
function buildRangeLabel(range = {}) {
  const from = formatDateLabel(range.dateFrom);
  const to = formatDateLabel(range.dateTo);
  if (!from && !to) return 'Tất cả';
  if (from && to) return from === to ? from : `${from} → ${to}`;
  if (from) return `Từ ${from}`;
  if (to) return `Đến ${to}`;
  return 'Tất cả';
}

/**
 * Normalize transaction data.
 * @param {Array} rawTransactions
 * @returns {Array}
 */
function normalizeTransactions(rawTransactions) {
  if (!Array.isArray(rawTransactions)) return [];
  return rawTransactions.map((item) => {
    const typeRaw = safeString(item.type || item.transactionType || item.categoryType);
    return {
      date: formatDateLabel(item.date || item.transactionDate || item.createdAt),
      type: typeRaw.toLowerCase(),
      typeLabel: formatTransactionType(typeRaw),
      category: safeString(item.categoryName || item.category || item.categoryTitle, 'Không xác định'),
      note: safeString(item.note || item.description || item.memo, ''),
      amount: safeNumber(item.amount || item.total || item.value),
      wallet: safeString(item.walletName || item.accountName || item.wallet || item.destination, ''),
    };
  });
}

/**
 * Normalize analytics data.
 * @param {Object} rawAnalytics
 * @param {Array} transactions
 * @returns {Object}
 */
function normalizeAnalytics(rawAnalytics, transactions) {
  const analytics = rawAnalytics && typeof rawAnalytics === 'object' ? rawAnalytics : {};
  return {
    totalIncome: safeNumber(analytics.totalIncome),
    totalExpense: safeNumber(analytics.totalExpense),
    net: safeNumber(analytics.net),
    transactionCount: safeNumber(analytics.transactionCount) || transactions.length,
  };
}

/**
 * Normalize range data.
 * @param {Object} rawRange
 * @returns {Object}
 */
function normalizeRange(rawRange) {
  const range = rawRange && typeof rawRange === 'object' ? rawRange : {};
  return {
    dateFrom: formatDateLabel(range.dateFrom),
    dateTo: formatDateLabel(range.dateTo),
    label: buildRangeLabel(range),
  };
}

/**
 * Configure worksheet for A4 printing.
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} [freezeRow]
 */
function configureWorksheet(worksheet, freezeRow = 0) {
  worksheet.properties.defaultRowHeight = 15;
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    horizontalCentered: false,
  };

  if (freezeRow > 0) {
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: freezeRow,
        showGridLines: true,
        zoomScale: 120,
      },
    ];
  } else {
    worksheet.views = [{ showGridLines: true, zoomScale: 120 }];
  }
}

/**
 * Write a merged cell with style.
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} rowIndex
 * @param {number} startCol
 * @param {number} endCol
 * @param {string} value
 * @param {Object} style
 * @param {number} [height]
 */
function writeMergedCell(worksheet, rowIndex, startCol, endCol, value, style, height) {
  const row = worksheet.getRow(rowIndex);
  if (height) row.height = height;
  worksheet.mergeCells(rowIndex, startCol, rowIndex, endCol);
  const cell = row.getCell(startCol);
  cell.value = safeString(value);
  cell.font = style.font;
  cell.fill = style.fill;
  cell.alignment = style.alignment;
  cell.border = style.border;
}

/**
 * Set report header section.
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} rowIndex
 * @param {string} rangeLabel
 * @param {Object} analytics
 * @returns {number}
 */
function setHeaderSection(worksheet, rowIndex, rangeLabel, analytics) {
  writeMergedCell(worksheet, rowIndex, 1, 7, 'BÁO CÁO TÀI CHÍNH CÁ NHÂN', STYLES.TITLE, 30);
  rowIndex += 1;
  writeMergedCell(worksheet, rowIndex, 1, 7, 'Hệ thống quản lý chi tiêu', STYLES.SUBTITLE, 20);
  rowIndex += 1;
  const infoText = `Ngày xuất: ${formatDateTimeLabel(new Date())}  |  Phạm vi: ${safeString(rangeLabel)}  |  Số giao dịch: ${analytics.transactionCount}`;
  writeMergedCell(worksheet, rowIndex, 1, 7, infoText, STYLES.HEADER_INFO, 18);
  return rowIndex + 1;
}

/**
 * Set summary statistics section.
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} rowIndex
 * @param {Object} analytics
 * @returns {number}
 */
function setSummarySection(worksheet, rowIndex, analytics) {
  writeMergedCell(worksheet, rowIndex, 1, 7, 'THỐNG KÊ TỔNG QUAN', STYLES.SECTION_TITLE, 20);
  rowIndex += 1;

  const summaryData = [
    { label: 'Tổng thu nhập', value: formatVND(analytics.totalIncome) },
    { label: 'Tổng chi tiêu', value: formatVND(analytics.totalExpense) },
    { label: 'Chênh lệch', value: formatVND(analytics.net) },
    { label: 'Số giao dịch', value: analytics.transactionCount },
  ];

  summaryData.forEach((item, index) => {
    const row = worksheet.getRow(rowIndex + index);
    row.height = 18;

    const labelCell = row.getCell(1);
    labelCell.value = item.label;
    labelCell.font = STYLES.SUMMARY_LABEL.font;
    labelCell.fill = STYLES.SUMMARY_LABEL.fill;
    labelCell.alignment = STYLES.SUMMARY_LABEL.alignment;
    labelCell.border = STYLES.SUMMARY_LABEL.border;
    worksheet.mergeCells(rowIndex + index, 1, rowIndex + index, 2);

    const valueCell = row.getCell(3);
    valueCell.value = item.value;
    valueCell.font = STYLES.SUMMARY_VALUE.font;
    valueCell.fill = STYLES.SUMMARY_VALUE.fill;
    valueCell.alignment = STYLES.SUMMARY_VALUE.alignment;
    valueCell.border = STYLES.SUMMARY_VALUE.border;
    worksheet.mergeCells(rowIndex + index, 3, rowIndex + index, 7);
  });

  return rowIndex + summaryData.length + 1;
}

/**
 * Set transactions table section.
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} rowIndex
 * @param {Array} transactions
 * @returns {number}
 */
function setTransactionsSection(worksheet, rowIndex, transactions) {
  writeMergedCell(worksheet, rowIndex, 1, 7, 'CHI TIẾT GIAO DỊCH', STYLES.SECTION_TITLE, 20);
  rowIndex += 1;

  const headers = ['STT', 'Ngày', 'Loại', 'Danh mục', 'Mô tả', 'Số tiền', 'Ví'];
  const headerRow = worksheet.getRow(rowIndex);
  headerRow.height = 20;

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = STYLES.TABLE_HEADER.font;
    cell.fill = STYLES.TABLE_HEADER.fill;
    cell.alignment = STYLES.TABLE_HEADER.alignment;
    cell.border = STYLES.TABLE_HEADER.border;
  });

  const headerRowIndex = rowIndex;
  rowIndex += 1;

  if (transactions.length === 0) {
    const emptyRow = worksheet.getRow(rowIndex);
    emptyRow.height = 20;
    const emptyCell = emptyRow.getCell(1);
    emptyCell.value = 'Không có dữ liệu giao dịch';
    emptyCell.font = STYLES.TABLE_CELL.font;
    emptyCell.fill = STYLES.TABLE_CELL.fill;
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyCell.border = STYLES.TABLE_CELL.border;
    worksheet.mergeCells(rowIndex, 1, rowIndex, 7);
    return rowIndex + 1;
  }

  transactions.forEach((item, index) => {
    const row = worksheet.getRow(rowIndex);
    row.height = 18;

    const cells = [
      { col: 1, value: index + 1, style: STYLES.TABLE_CELL_CENTER },
      { col: 2, value: item.date, style: STYLES.TABLE_CELL_CENTER },
      { col: 3, value: item.typeLabel, style: STYLES.TABLE_CELL_CENTER },
      { col: 4, value: item.category, style: STYLES.TABLE_CELL },
      { col: 5, value: item.note, style: STYLES.TABLE_CELL_WRAP },
      { col: 6, value: item.amount, style: STYLES.TABLE_CELL_RIGHT, numFmt: NUM_FORMATS.CURRENCY_VND },
      { col: 7, value: item.wallet, style: STYLES.TABLE_CELL },
    ];

    cells.forEach((cellData) => {
      const cell = row.getCell(cellData.col);
      cell.value = cellData.value;
      cell.font = cellData.style.font;
      cell.fill = cellData.style.fill;
      cell.alignment = cellData.style.alignment;
      cell.border = cellData.style.border;
      if (cellData.numFmt) cell.numFmt = cellData.numFmt;
    });

    rowIndex += 1;
  });

  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: rowIndex - 1, column: 7 },
  };

  return { rowIndex: rowIndex + 1, freezeRow: headerRowIndex };
}

/**
 * Set footer section.
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} rowIndex
 * @returns {number}
 */
function setFooterSection(worksheet, rowIndex) {
  writeMergedCell(worksheet, rowIndex, 1, 7, '© 2026 QLyChiTieu - Báo cáo tài chính cá nhân', STYLES.FOOTER, 16);
  return rowIndex + 1;
}

/**
 * Calculate approximate character width for a string.
 * @param {string} text
 * @returns {number}
 */
function calculateTextWidth(text) {
  if (!text) return 0;
  
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.charCodeAt(0) > 127) {
      width += 1.5;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Auto-fit column widths based on content with precise calculation.
 * @param {ExcelJS.Worksheet} worksheet
 */
function autoFitColumns(worksheet) {
  worksheet.columns.forEach((column, colIndex) => {
    if (!column) return;
    
    let maxWidth = 0;
    let hasData = false;
    
    column.eachCell({ includeEmpty: false }, (cell) => {
      hasData = true;
      const value = cell.value ? String(cell.value) : '';
      
      if (value) {
        const lines = value.split('\n');
        lines.forEach((line) => {
          const textWidth = calculateTextWidth(line);
          maxWidth = Math.max(maxWidth, textWidth);
        });
      }
    });
    
    if (!hasData) {
      column.width = 8;
      return;
    }
    
    const headerCell = worksheet.getCell(1, colIndex + 1);
    if (headerCell && headerCell.value) {
      const headerWidth = calculateTextWidth(String(headerCell.value));
      maxWidth = Math.max(maxWidth, headerWidth);
    }
    
    // Cột STT (0), Ngày (1), Loại (2), Ví (6) - kích thước nhỏ nhất
    const smallColumns = [0, 1, 2, 6];
    let padding;
    let minWidth;
    let maxWidthLimit;
    
    if (smallColumns.includes(colIndex)) {
      padding = 0.5;
      minWidth = 4;
      maxWidthLimit = 12;
    } else if (colIndex === 4) {
      // Cột Mô tả - cần rộng hơn
      padding = 2;
      minWidth = 10;
      maxWidthLimit = 35;
    } else {
      // Các cột khác
      padding = 1.5;
      minWidth = 6;
      maxWidthLimit = 25;
    }
    
    const calculatedWidth = Math.ceil(maxWidth + padding);
    const finalWidth = Math.min(Math.max(calculatedWidth, minWidth), maxWidthLimit);
    
    column.width = finalWidth;
  });
}

/**
 * Auto-fit row heights based on content and wrap text with precise calculation.
 * @param {ExcelJS.Worksheet} worksheet
 */
function autoFitRowHeights(worksheet) {
  worksheet.eachRow((row, rowNumber) => {
    let maxLines = 1;
    let hasWrapText = false;
    
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.alignment && cell.alignment.wrapText) {
        hasWrapText = true;
        const value = cell.value ? String(cell.value) : '';
        if (value) {
          const lines = value.split('\n');
          maxLines = Math.max(maxLines, lines.length);
          
          lines.forEach((line) => {
            const textWidth = calculateTextWidth(line);
            const estimatedLines = Math.ceil(textWidth / 40);
            maxLines = Math.max(maxLines, estimatedLines);
          });
        }
      }
    });
    
    if (hasWrapText && maxLines > 1) {
      const lineHeight = 14;
      const calculatedHeight = maxLines * lineHeight;
      row.height = Math.min(calculatedHeight, 80);
    } else if (!hasWrapText) {
      row.height = 16;
    }
  });
}

/**
 * Generate Excel file.
 * @param {Object} data
 * @param {Object} [options]
 * @returns {Promise<Blob>}
 */
export async function generateExcel(data, options = {}) {
  try {
    validateExportData(data);

    const rawTransactions = Array.isArray(data.transactions)
      ? data.transactions
      : Array.isArray(data.transactions?.rows)
        ? data.transactions.rows
        : [];

    const transactions = normalizeTransactions(rawTransactions);
    const analytics = normalizeAnalytics(data.analytics, transactions);
    const range = normalizeRange(data.range);

    if (typeof options.onProgress === 'function') {
      options.onProgress('started');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QLyChiTieu';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Báo cáo');
    configureWorksheet(worksheet);

    let rowIndex = 1;
    rowIndex = setHeaderSection(worksheet, rowIndex, range.label, analytics);
    rowIndex = setSummarySection(worksheet, rowIndex, analytics);
    const transactionsResult = setTransactionsSection(worksheet, rowIndex, transactions);
    rowIndex = transactionsResult.rowIndex;
    rowIndex = setFooterSection(worksheet, rowIndex);

    configureWorksheet(worksheet, transactionsResult.freezeRow);
    autoFitColumns(worksheet);
    autoFitRowHeights(worksheet);

    if (typeof options.onProgress === 'function') {
      options.onProgress('ready');
    }

    const buffer = await workbook.xlsx.writeBuffer();
    if (typeof options.onProgress === 'function') {
      options.onProgress('completed');
    }

    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    const message = error?.message || 'Không thể tạo file Excel';
    throw new Error(`Không thể tạo Excel: ${message}`);
  }
}

/**
 * Download Excel file.
 * @param {Blob} blob
 * @param {Object} [range]
 */
export function downloadExcel(blob, range = null) {
  if (!blob || !(blob instanceof Blob) || blob.size === 0) {
    throw new Error('File Excel không hợp lệ');
  }

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  let scope = 'all';
  if (range?.dateFrom && range?.dateTo) {
    if (range.dateFrom === range.dateTo) {
      scope = range.dateFrom.replace(/\//g, '-');
    } else {
      scope = `${range.dateFrom.replace(/\//g, '-')}-${range.dateTo.replace(/\//g, '-')}`;
    }
  }
  const safeScope = scope.replace(/[^a-zA-Z0-9-]/g, '-');
  const filename = `bao-cao-tai-chinh-${safeScope}-${dateStr}.xlsx`;

  saveAs(blob, filename);
}
