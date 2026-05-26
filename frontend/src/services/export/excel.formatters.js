/**
 * Excel Data Validation and Formatting Utilities
 * Handles data validation, formatting, and transformation for Excel export
 * @module services/export/excel.formatters
 */

/**
 * Safe number conversion with fallback
 * @param {any} value - Value to convert
 * @param {number} fallback - Fallback value (default: 0)
 * @returns {number}
 */
export function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Safe string with fallback
 * @param {any} value - Value to convert
 * @param {string} fallback - Fallback value (default: '')
 * @returns {string}
 */
export function safeString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

/**
 * Format currency as VND
 * @param {number} amount - Amount to format
 * @returns {string}
 */
export function formatCurrencyVND(amount) {
  const num = safeNumber(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date to Vietnamese format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'date' | 'datetime' | 'time'
 * @returns {string}
 */
export function formatDateVN(date, format = 'date') {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'datetime':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'time':
      return `${hours}:${minutes}`;
    case 'date':
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Format transaction type
 * @param {string} type - Transaction type
 * @returns {string}
 */
export function formatTransactionType(type) {
  const typeMap = {
    'income': 'Thu nhập',
    'expense': 'Chi tiêu',
    'transfer': 'Chuyển khoản',
  };
  return typeMap[type] || safeString(type);
}

/**
 * Calculate savings rate
 * @param {number} income - Total income
 * @param {number} expense - Total expense
 * @returns {number} - Savings rate as percentage (0-100)
 */
export function calculateSavingsRate(income, expense) {
  const inc = safeNumber(income);
  const exp = safeNumber(expense);
  
  if (inc === 0) return 0;
  const savings = inc - exp;
  const rate = (savings / inc) * 100;
  return Math.max(0, Math.min(100, rate));
}

/**
 * Find top expense category
 * @param {Array} transactions - Transaction array
 * @returns {Object} - { categoryName, amount, percentage }
 */
export function findTopExpenseCategory(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { categoryName: 'N/A', amount: 0, percentage: 0 };
  }
  
  const categoryTotals = {};
  let totalExpense = 0;
  
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const category = safeString(t.categoryName, 'Khác');
      const amount = safeNumber(t.amount);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalExpense += amount;
    }
  });
  
  if (totalExpense === 0) {
    return { categoryName: 'N/A', amount: 0, percentage: 0 };
  }
  
  const sorted = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a);
  
  const [categoryName, amount] = sorted[0];
  const percentage = (amount / totalExpense) * 100;
  
  return { categoryName, amount, percentage };
}

/**
 * Group transactions by month
 * @param {Array} transactions - Transaction array
 * @returns {Array} - Array of { month, year, income, expense, net }
 */
export function groupByMonth(transactions) {
  if (!Array.isArray(transactions)) return [];
  
  const monthlyData = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return;
    
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = { month, year, income: 0, expense: 0, net: 0 };
    }
    
    const amount = safeNumber(t.amount);
    if (t.type === 'income') {
      monthlyData[key].income += amount;
    } else if (t.type === 'expense') {
      monthlyData[key].expense += amount;
    }
  });
  
  // Calculate net and sort by date
  return Object.values(monthlyData)
    .map(m => ({
      ...m,
      net: m.income - m.expense,
      label: `Tháng ${m.month}/${m.year}`,
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
}

/**
 * Group transactions by category
 * @param {Array} transactions - Transaction array
 * @param {string} type - Filter by type: 'income' | 'expense' | 'all'
 * @returns {Array} - Array of { categoryName, amount, percentage, transactionCount }
 */
export function groupByCategory(transactions, type = 'all') {
  if (!Array.isArray(transactions)) return [];
  
  const categoryData = {};
  let totalAmount = 0;
  
  transactions.forEach(t => {
    if (type !== 'all' && t.type !== type) return;
    
    const category = safeString(t.categoryName, 'Khác');
    const amount = safeNumber(t.amount);
    
    if (!categoryData[category]) {
      categoryData[category] = { amount: 0, count: 0 };
    }
    
    categoryData[category].amount += amount;
    categoryData[category].count += 1;
    totalAmount += amount;
  });
  
  return Object.entries(categoryData)
    .map(([categoryName, data]) => ({
      categoryName,
      amount: data.amount,
      transactionCount: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Validate transaction data
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Validated transaction with fallback values
 */
export function validateTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object') {
    return {
      date: '',
      walletName: '',
      categoryName: '',
      type: '',
      amount: 0,
      note: '',
      status: 'unknown',
    };
  }
  
  return {
    date: formatDateVN(transaction.date),
    walletName: safeString(transaction.walletName),
    categoryName: safeString(transaction.categoryName),
    type: formatTransactionType(transaction.type),
    amount: safeNumber(transaction.amount),
    note: safeString(transaction.note),
    status: safeString(transaction.status, 'hoàn thành'),
  };
}

/**
 * Validate analytics data
 * @param {Object} analytics - Analytics object
 * @returns {Object} - Validated analytics with fallback values
 */
export function validateAnalytics(analytics) {
  if (!analytics || typeof analytics !== 'object') {
    return {
      totalIncome: 0,
      totalExpense: 0,
      net: 0,
      transactionCount: 0,
      timeSeries: [],
    };
  }
  
  return {
    totalIncome: safeNumber(analytics.totalIncome),
    totalExpense: safeNumber(analytics.totalExpense),
    net: safeNumber(analytics.net),
    transactionCount: safeNumber(analytics.transactionCount),
    timeSeries: Array.isArray(analytics.timeSeries) ? analytics.timeSeries : [],
  };
}

/**
 * Validate date range
 * @param {Object} range - Range object
 * @returns {Object} - Validated range with fallback values
 */
export function validateRange(range) {
  if (!range || typeof range !== 'object') {
    return {
      dateFrom: '',
      dateTo: '',
      label: 'Tất cả',
    };
  }
  
  const dateFrom = formatDateVN(range.dateFrom);
  const dateTo = formatDateVN(range.dateTo);
  
  let label = 'Tất cả';
  if (dateFrom && dateTo) {
    if (dateFrom === dateTo) {
      label = dateFrom;
    } else {
      label = `${dateFrom} - ${dateTo}`;
    }
  } else if (dateFrom) {
    label = `Từ ${dateFrom}`;
  } else if (dateTo) {
    label = `Đến ${dateTo}`;
  }
  
  return {
    dateFrom,
    dateTo,
    label,
  };
}

/**
 * Generate professional filename
 * @param {Object} range - Date range object
 * @returns {string} - Professional filename
 */
export function generateProfessionalFilename(range) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  let scope = 'all';
  if (range?.dateFrom && range?.dateTo) {
    if (range.dateFrom === range.dateTo) {
      scope = range.dateFrom.replace(/\//g, '-');
    } else {
      scope = `${range.dateFrom.replace(/\//g, '-')}-${range.dateTo.replace(/\//g, '-')}`;
    }
  }
  
  const safeScope = scope.replace(/[^a-zA-Z0-9-]/g, '-');
  return `Spendify_Report_${year}-${month}${safeScope !== 'all' ? `_${safeScope}` : ''}.xlsx`;
}

/**
 * Format large number with suffix (K, M, B)
 * @param {number} num - Number to format
 * @returns {string}
 */
export function formatLargeNumber(num) {
  const n = safeNumber(num);
  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(2) + 'B';
  }
  if (n >= 1000000) {
    return (n / 1000000).toFixed(2) + 'M';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(2) + 'K';
  }
  return n.toString();
}

/**
 * Calculate average transaction amount
 * @param {Array} transactions - Transaction array
 * @param {string} type - Filter by type: 'income' | 'expense' | 'all'
 * @returns {number}
 */
export function calculateAverageTransaction(transactions, type = 'all') {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  
  const filtered = type === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === type);
  
  if (filtered.length === 0) return 0;
  
  const total = filtered.reduce((sum, t) => sum + safeNumber(t.amount), 0);
  return total / filtered.length;
}

/**
 * Get transaction status label
 * @param {string} status - Status value
 * @returns {string}
 */
export function getStatusLabel(status) {
  const statusMap = {
    'completed': 'Hoàn thành',
    'pending': 'Đang chờ',
    'cancelled': 'Đã hủy',
    'hoàn thành': 'Hoàn thành',
    'đang chờ': 'Đang chờ',
    'đã hủy': 'Đã hủy',
  };
  return statusMap[status] || safeString(status, 'Không xác định');
}
