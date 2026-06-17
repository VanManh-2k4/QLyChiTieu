import * as transactionRepository from '../repositories/transactionRepository.js';
import * as categoryRepository from '../repositories/categoryRepository.js';
import * as budgetRepository from '../repositories/budgetRepository.js';

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

function getQuarter(month) {
  return Math.ceil(month / 3);
}

export function getWeeklyReport(userId, year, week) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    const tYear = date.getFullYear();
    const tWeek = getWeekNumber(date);
    return t.type === 'expense' && tYear === year && tWeek === week;
  });

  const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  
  const byCategory = {};
  filtered.forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;
  });

  const categories = categoryRepository.listAll(userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryBreakdown = Object.entries(byCategory).map(([catId, data]) => ({
    categoryId: Number(catId),
    categoryName: categoryMap.get(Number(catId)) || 'Unknown',
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
  }));

  return {
    period: { type: 'week', year, week },
    totalExpense: total,
    transactionCount: filtered.length,
    categoryBreakdown,
  };
}

export function getMonthlyReport(userId, year, month) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'expense' && date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const totalExpense = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Calculate income for the same period
  const incomeFiltered = rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'income' && date.getFullYear() === year && date.getMonth() + 1 === month;
  });
  const totalIncome = incomeFiltered.reduce((sum, t) => sum + Number(t.amount), 0);
  
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  
  const byCategory = {};
  filtered.forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;
  });

  const categories = categoryRepository.listAll(userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryBreakdown = Object.entries(byCategory).map(([catId, data]) => ({
    categoryId: Number(catId),
    categoryName: categoryMap.get(Number(catId)) || 'Unknown',
    amount: data.amount,
    count: data.count,
    percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
  }));

  return {
    period: { type: 'month', year, month },
    totalExpense,
    totalIncome,
    savings,
    savingsRate,
    transactionCount: filtered.length,
    categoryBreakdown,
  };
}

export function getQuarterlyReport(userId, year, quarter) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;

  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    const tYear = date.getFullYear();
    const tMonth = date.getMonth() + 1;
    return t.type === 'expense' && tYear === year && tMonth >= startMonth && tMonth <= endMonth;
  });

  const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  
  const byCategory = {};
  filtered.forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;
  });

  const categories = categoryRepository.listAll(userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryBreakdown = Object.entries(byCategory).map(([catId, data]) => ({
    categoryId: Number(catId),
    categoryName: categoryMap.get(Number(catId)) || 'Unknown',
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
  }));

  return {
    period: { type: 'quarter', year, quarter },
    totalExpense: total,
    transactionCount: filtered.length,
    categoryBreakdown,
  };
}

export function getYearlyReport(userId, year) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'expense' && date.getFullYear() === year;
  });

  const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  
  const byCategory = {};
  const byMonth = {};
  filtered.forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;

    const month = new Date(t.date).getMonth() + 1;
    if (!byMonth[month]) {
      byMonth[month] = 0;
    }
    byMonth[month] += Number(t.amount);
  });

  const categories = categoryRepository.listAll(userId);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryBreakdown = Object.entries(byCategory).map(([catId, data]) => ({
    categoryId: Number(catId),
    categoryName: categoryMap.get(Number(catId)) || 'Unknown',
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
  }));

  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    amount: byMonth[i + 1] || 0,
  }));

  return {
    period: { type: 'year', year },
    totalExpense: total,
    transactionCount: filtered.length,
    categoryBreakdown,
    monthlyBreakdown,
  };
}

export function comparePeriods(userId, periodType, period1, period2) {
  let report1, report2;

  if (periodType === 'month') {
    report1 = getMonthlyReport(userId, period1.year, period1.month);
    report2 = getMonthlyReport(userId, period2.year, period2.month);
  } else if (periodType === 'quarter') {
    report1 = getQuarterlyReport(userId, period1.year, period1.quarter);
    report2 = getQuarterlyReport(userId, period2.year, period2.quarter);
  } else if (periodType === 'year') {
    report1 = getYearlyReport(userId, period1.year);
    report2 = getYearlyReport(userId, period2.year);
  }

  const expenseDiff = report2.totalExpense - report1.totalExpense;
  const expenseChangePercent = report1.totalExpense > 0 
    ? ((expenseDiff / report1.totalExpense) * 100).toFixed(2)
    : 0;

  const categoryComparison = report1.categoryBreakdown.map((cat1) => {
    const cat2 = report2.categoryBreakdown.find((c) => c.categoryId === cat1.categoryId);
    const diff = cat2 ? cat2.amount - cat1.amount : -cat1.amount;
    const changePercent = cat1.amount > 0 ? ((diff / cat1.amount) * 100).toFixed(2) : 0;
    return {
      categoryId: cat1.categoryId,
      categoryName: cat1.categoryName,
      amount1: cat1.amount,
      amount2: cat2 ? cat2.amount : 0,
      diff,
      changePercent: Number(changePercent),
    };
  });

  return {
    periodType,
    period1: report1.period,
    period2: report2.period,
    expense1: report1.totalExpense,
    expense2: report2.totalExpense,
    expenseDiff,
    expenseChangePercent: Number(expenseChangePercent),
    categoryComparison,
  };
}

export function analyzeTrends(userId, periodType, periods) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  
  const reports = periods.map((p) => {
    let filtered;
    if (periodType === 'month') {
      filtered = rows.filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === p.year && date.getMonth() + 1 === p.month;
      });
    } else if (periodType === 'quarter') {
      const startMonth = (p.quarter - 1) * 3 + 1;
      const endMonth = p.quarter * 3;
      filtered = rows.filter((t) => {
        const date = new Date(t.date);
        const tYear = date.getFullYear();
        const tMonth = date.getMonth() + 1;
        return tYear === p.year && tMonth >= startMonth && tMonth <= endMonth;
      });
    } else if (periodType === 'year') {
      filtered = rows.filter((t) => {
        const date = new Date(t.date);
        return date.getFullYear() === p.year;
      });
    }

    const income = filtered.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filtered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? ((savings / income) * 100) : 0;

    // Get budget data for this period
    let totalBudget = 0;
    let budgetByCategory = {};
    
    if (periodType === 'month') {
      const budgets = budgetRepository.listByUserMonthYear(userId, p.month, p.year);
      budgets.forEach((b) => {
        totalBudget += Number(b.amount);
        budgetByCategory[b.categoryId] = Number(b.amount);
      });
    }

    const byCategory = {};
    filtered.filter((t) => t.type === 'expense').forEach((t) => {
      if (!byCategory[t.categoryId]) {
        byCategory[t.categoryId] = { amount: 0, count: 0 };
      }
      byCategory[t.categoryId].amount += Number(t.amount);
      byCategory[t.categoryId].count += 1;
    });

    const categories = categoryRepository.listAll(userId);
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

    // Separate budgeted and non-budgeted categories
    const budgetedCategoryBreakdown = [];
    const nonBudgetedCategoryBreakdown = [];

    Object.entries(byCategory).forEach(([catId, data]) => {
      const budgetAmount = budgetByCategory[catId] || 0;

      if (budgetAmount > 0) {
        // Category has budget
        budgetedCategoryBreakdown.push({
          categoryId: Number(catId),
          categoryName: categoryMap.get(Number(catId)) || 'Unknown',
          amount: data.amount,
          count: data.count,
          percentage: expense > 0 ? (data.amount / expense) * 100 : 0,
          budget: budgetAmount,
          budgetUsed: (data.amount / budgetAmount) * 100,
          hasBudget: true,
        });
      } else {
        // Category has no budget
        nonBudgetedCategoryBreakdown.push({
          categoryId: Number(catId),
          categoryName: categoryMap.get(Number(catId)) || 'Unknown',
          amount: data.amount,
          count: data.count,
          percentage: expense > 0 ? (data.amount / expense) * 100 : 0,
          budget: 0,
          budgetUsed: 0,
          hasBudget: false,
        });
      }
    });

    const categoryBreakdown = [...budgetedCategoryBreakdown, ...nonBudgetedCategoryBreakdown];

    // Calculate budgeted expense (only for categories with budget)
    const budgetedExpense = budgetedCategoryBreakdown.reduce((sum, c) => sum + c.amount, 0);

    return {
      period: p,
      income,
      expense,
      savings,
      savingsRate,
      transactionCount: filtered.length,
      totalBudget,
      budgetUsed: totalBudget > 0 ? (budgetedExpense / totalBudget) * 100 : 0,
      categoryBreakdown,
    };
  });

  const trendData = reports.map((r) => ({
    period: r.period,
    income: r.income,
    expense: r.expense,
    savings: r.savings,
    savingsRate: r.savingsRate,
    transactionCount: r.transactionCount,
    totalBudget: r.totalBudget,
    budgetUsed: r.budgetUsed,
  }));

  const totalExpenseChange = reports.length > 1
    ? reports[reports.length - 1].expense - reports[0].expense
    : 0;

  const totalIncomeChange = reports.length > 1
    ? reports[reports.length - 1].income - reports[0].income
    : 0;

  const avgExpense = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.expense, 0) / reports.length
    : 0;

  const avgIncome = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.income, 0) / reports.length
    : 0;

  const avgSavingsRate = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.savingsRate, 0) / reports.length
    : 0;

  const trendDirection = totalExpenseChange > 0 ? 'increasing' : totalExpenseChange < 0 ? 'decreasing' : 'stable';

  // YoY Comparison (compare with same period last year)
  const yoyComparison = [];
  if (periodType === 'month' && reports.length > 0) {
    const lastPeriod = reports[reports.length - 1];
    const lastYear = lastPeriod.period.year - 1;
    const lastMonth = lastPeriod.period.month;
    
    const lastYearFiltered = rows.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === lastYear && date.getMonth() + 1 === lastMonth;
    });
    
    const lastYearExpense = lastYearFiltered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const lastYearIncome = lastYearFiltered.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (lastYearExpense > 0) {
      yoyComparison.push({
        period: `T${lastMonth}/${lastYear}`,
        expense: lastYearExpense,
        income: lastYearIncome,
        expenseChange: lastPeriod.expense - lastYearExpense,
        expenseChangePercent: ((lastPeriod.expense - lastYearExpense) / lastYearExpense) * 100,
        incomeChange: lastPeriod.income - lastYearIncome,
        incomeChangePercent: lastYearIncome > 0 ? ((lastPeriod.income - lastYearIncome) / lastYearIncome) * 100 : 0,
      });
    }
  }

  // Trend Scoring (Health Score 0-100)
  let healthScore = 50; // Base score
  const scoreFactors = [];

  // Savings rate factor (0-30 points)
  if (avgSavingsRate >= 20) {
    healthScore += 30;
    scoreFactors.push({ factor: 'Tỷ lệ tiết kiệm', points: 30, reason: 'Tốt (≥20%)' });
  } else if (avgSavingsRate >= 10) {
    healthScore += 15;
    scoreFactors.push({ factor: 'Tỷ lệ tiết kiệm', points: 15, reason: 'Trung bình (10-19%)' });
  } else {
    healthScore -= 10;
    scoreFactors.push({ factor: 'Tỷ lệ tiết kiệm', points: -10, reason: 'Thấp (<10%)' });
  }

  // Expense trend factor (0-20 points)
  if (trendDirection === 'decreasing') {
    healthScore += 20;
    scoreFactors.push({ factor: 'Xu hướng chi tiêu', points: 20, reason: 'Giảm' });
  } else if (trendDirection === 'stable') {
    healthScore += 10;
    scoreFactors.push({ factor: 'Xu hướng chi tiêu', points: 10, reason: 'Ổn định' });
  } else {
    healthScore -= 15;
    scoreFactors.push({ factor: 'Xu hướng chi tiêu', points: -15, reason: 'Tăng' });
  }

  // Budget adherence factor (0-20 points)
  const avgBudgetUsed = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.budgetUsed, 0) / reports.length
    : 0;
  
  if (avgBudgetUsed <= 100) {
    healthScore += 20;
    scoreFactors.push({ factor: 'Tuân thủ ngân sách', points: 20, reason: 'Trong ngân sách' });
  } else if (avgBudgetUsed <= 110) {
    healthScore += 10;
    scoreFactors.push({ factor: 'Tuân thủ ngân sách', points: 10, reason: 'Vượt nhẹ (≤110%)' });
  } else {
    healthScore -= 20;
    scoreFactors.push({ factor: 'Tuân thủ ngân sách', points: -20, reason: 'Vượt nhiều (>110%)' });
  }

  // Income stability factor (0-10 points)
  if (totalIncomeChange >= 0) {
    healthScore += 10;
    scoreFactors.push({ factor: 'Ổn định thu nhập', points: 10, reason: 'Tăng hoặc ổn định' });
  } else {
    healthScore -= 5;
    scoreFactors.push({ factor: 'Ổn định thu nhập', points: -5, reason: 'Giảm' });
  }

  // Clamp score between 0 and 100
  healthScore = Math.max(0, Math.min(100, healthScore));

  const categoryTrends = {};
  reports.forEach((report) => {
    report.categoryBreakdown.forEach((cat) => {
      if (!categoryTrends[cat.categoryId]) {
        categoryTrends[cat.categoryId] = {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          amounts: [],
          percentages: [],
        };
      }
      categoryTrends[cat.categoryId].amounts.push(cat.amount);
      categoryTrends[cat.categoryId].percentages.push(cat.percentage);
    });
  });

  const categoryTrendAnalysis = Object.values(categoryTrends).map((cat) => {
    const firstAmount = cat.amounts[0] || 0;
    const lastAmount = cat.amounts[cat.amounts.length - 1] || 0;
    const change = lastAmount - firstAmount;
    const changePercent = firstAmount > 0 ? ((change / firstAmount) * 100).toFixed(2) : 0;
    const avgAmount = cat.amounts.reduce((sum, a) => sum + a, 0) / cat.amounts.length;
    const avgPercentage = cat.percentages.reduce((sum, p) => sum + p, 0) / cat.percentages.length;
    
    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      firstAmount,
      lastAmount,
      change,
      changePercent: Number(changePercent),
      avgAmount,
      avgPercentage,
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
    };
  });

  // Generate insights
  const insights = [];
  
  if (reports.length >= 2) {
    const lastPeriod = reports[reports.length - 1];
    const prevPeriod = reports[reports.length - 2];
    
    if (lastPeriod.expense > prevPeriod.expense * 1.2) {
      insights.push(`Chi tiêu tăng ${(lastPeriod.expense / prevPeriod.expense - 1).toFixed(1)}% so với kỳ trước. Cần kiểm soát chi tiêu.`);
    } else if (lastPeriod.expense < prevPeriod.expense * 0.8) {
      insights.push(`Chi tiêu giảm ${(1 - lastPeriod.expense / prevPeriod.expense).toFixed(1)}% so với kỳ trước. Tuyệt vời!`);
    }

    if (lastPeriod.savingsRate < 10 && avgSavingsRate < 10) {
      insights.push('Tỷ lệ tiết kiệm thấp (dưới 10%). Nên cố gắng tiết kiệm ít nhất 20% thu nhập.');
    } else if (lastPeriod.savingsRate >= 20) {
      insights.push('Tỷ lệ tiết kiệm tốt! Tiếp tục duy trì thói quen tài chính lành mạnh.');
    }

    if (totalIncomeChange < 0) {
      insights.push('Thu nhập có xu hướng giảm. Cần xem xét các nguồn thu nhập và tìm cách tăng thu.');
    }
  }

  // Find top increasing categories
  const increasingCategories = categoryTrendAnalysis
    .filter((cat) => cat.trend === 'increasing' && cat.changePercent > 20)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);

  if (increasingCategories.length > 0) {
    insights.push(`Danh mục tăng mạnh: ${increasingCategories.map((c) => c.categoryName).join(', ')}`);
  }

  return {
    periodType,
    trendData,
    totalExpenseChange,
    totalIncomeChange,
    avgExpense,
    avgIncome,
    avgSavingsRate,
    trendDirection,
    categoryTrendAnalysis,
    insights,
    yoyComparison,
    healthScore,
    scoreFactors,
  };
}

// Helper function to analyze previous month
function analyzePreviousMonth(userId, currentPeriod) {
  try {
    const prevMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
    const prevYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;
    
    const currentReport = getMonthlyReport(userId, currentPeriod.year, currentPeriod.month);
    const prevReport = getMonthlyReport(userId, prevYear, prevMonth);
    
    if (!currentReport || !prevReport) {
      return null;
    }
    
    const expenseChange = prevReport.totalExpense > 0 
      ? ((currentReport.totalExpense - prevReport.totalExpense) / prevReport.totalExpense) * 100 
      : 0;
    
    const savingsRateChange = prevReport.savingsRate !== null && currentReport.savingsRate !== null
      ? currentReport.savingsRate - prevReport.savingsRate
      : 0;
    
    // Category-wise comparison
    const categoryChanges = {};
    if (currentReport.categoryBreakdown && prevReport.categoryBreakdown) {
      currentReport.categoryBreakdown.forEach(cat => {
        const prevCat = prevReport.categoryBreakdown.find(c => c.categoryId === cat.categoryId);
        if (prevCat) {
          const change = prevCat.amount > 0 
            ? ((cat.amount - prevCat.amount) / prevCat.amount) * 100 
            : 0;
          categoryChanges[cat.categoryId] = {
            categoryName: cat.categoryName,
            currentAmount: cat.amount,
            prevAmount: prevCat.amount,
            changePercent: change,
            trend: change > 20 ? 'increasing' : change < -15 ? 'decreasing' : 'stable'
          };
        }
      });
    }
    
    return {
      expenseChange,
      savingsRateChange,
      categoryChanges,
      currentExpense: currentReport.totalExpense,
      prevExpense: prevReport.totalExpense,
      currentSavingsRate: currentReport.savingsRate,
      prevSavingsRate: prevReport.savingsRate
    };
  } catch (error) {
    console.error('Error in analyzePreviousMonth:', error);
    return null;
  }
}

// Helper function to analyze spending habits by day of week and week of month
function analyzeSpendingHabits(userId, period) {
  try {
    const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
    
    // Filter transactions for the current period
    const filtered = rows.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && 
             date.getFullYear() === period.year && 
             date.getMonth() + 1 === period.month;
    });
    
    // Analyze by day of week (0 = Sunday, 6 = Saturday)
    const spendingByDayOfWeek = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    filtered.forEach(t => {
      const dayOfWeek = new Date(t.date).getDay();
      spendingByDayOfWeek[dayOfWeek].push(Number(t.amount));
    });
    
    const avgByDayOfWeek = {};
    const totalByDayOfWeek = {};
    Object.keys(spendingByDayOfWeek).forEach(day => {
      const amounts = spendingByDayOfWeek[day];
      const total = amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) : 0;
      avgByDayOfWeek[day] = amounts.length > 0 ? total / amounts.length : 0;
      totalByDayOfWeek[day] = total;
    });
    
    // Identify high-spending days (weekend vs weekday)
    const weekendDays = [0, 6]; // Sunday, Saturday
    const weekdayDays = [1, 2, 3, 4, 5];
    
    const weekendSpending = weekendDays.reduce((sum, day) => sum + totalByDayOfWeek[day], 0);
    const weekdaySpending = weekdayDays.reduce((sum, day) => sum + totalByDayOfWeek[day], 0);
    const weekendAvg = weekendDays.reduce((sum, day) => sum + avgByDayOfWeek[day], 0) / 2;
    const weekdayAvg = weekdayDays.reduce((sum, day) => sum + avgByDayOfWeek[day], 0) / 5;
    
    // Analyze by week of month (1-4)
    const spendingByWeek = { 1: [], 2: [], 3: [], 4: [] };
    filtered.forEach(t => {
      const day = new Date(t.date).getDate();
      const week = Math.ceil(day / 7);
      if (week <= 4) {
        spendingByWeek[week].push(Number(t.amount));
      }
    });
    
    const avgByWeek = {};
    const totalByWeek = {};
    Object.keys(spendingByWeek).forEach(week => {
      const amounts = spendingByWeek[week];
      const total = amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) : 0;
      avgByWeek[week] = amounts.length > 0 ? total / amounts.length : 0;
      totalByWeek[week] = total;
    });
    
    // Find highest spending week
    const highestWeek = Object.keys(totalByWeek).reduce((max, week) => 
      totalByWeek[week] > totalByWeek[max] ? week : max, '1'
    );
    
    return {
      avgByDayOfWeek,
      totalByDayOfWeek,
      weekendAvg,
      weekdayAvg,
      weekendToWeekdayRatio: weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0,
      avgByWeek,
      totalByWeek,
      highestWeek,
      highestWeekAvg: totalByWeek[highestWeek],
      totalTransactions: filtered.length
    };
  } catch (error) {
    console.error('Error in analyzeSpendingHabits:', error);
    return null;
  }
}

// Helper function to calculate savings potential
function calculateSavingsPotential(userId, period, habits) {
  try {
    const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
    
    // Filter transactions for the current period
    const filtered = rows.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && 
             date.getFullYear() === period.year && 
             date.getMonth() + 1 === period.month;
    });
    
    const categories = categoryRepository.listAll(userId).filter(c => c.type === 'expense');
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    // Define discretionary categories (can be reduced)
    const discretionaryCategoryNames = ['Ăn uống ngoài', 'Giải trí', 'Mua sắm', 'Du lịch', 'Cà phê', 'Rạp phim'];
    const discretionaryCategories = categories.filter(c => discretionaryCategoryNames.includes(c.name));
    const discretionaryCategoryIds = new Set(discretionaryCategories.map(c => c.id));
    
    // Calculate discretionary spending
    const discretionarySpending = filtered
      .filter(t => discretionaryCategoryIds.has(t.categoryId))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calculate fixed spending (hard to reduce)
    const fixedCategoryNames = ['Tiền nhà', 'Điện nước', 'Internet', 'Bảo hiểm', 'Học phí'];
    const fixedCategories = categories.filter(c => fixedCategoryNames.includes(c.name));
    const fixedCategoryIds = new Set(fixedCategories.map(c => c.id));
    
    const fixedSpending = filtered
      .filter(t => fixedCategoryIds.has(t.categoryId))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
    const flexibleSpending = totalExpense - fixedSpending;
    
    // Calculate savings potential
    const discretionarySavingsPotential = discretionarySpending * 0.3; // Can save 30% of discretionary
    const weekendSavingsPotential = habits && habits.weekendAvg > habits.weekdayAvg 
      ? (habits.weekendAvg - habits.weekdayAvg) * 4 * 0.2 // 20% of excess weekend spending
      : 0;
    
    const totalSavingsPotential = discretionarySavingsPotential + weekendSavingsPotential;
    
    return {
      totalExpense,
      fixedSpending,
      discretionarySpending,
      flexibleSpending,
      discretionarySavingsPotential,
      weekendSavingsPotential,
      totalSavingsPotential,
      discretionaryRatio: totalExpense > 0 ? (discretionarySpending / totalExpense) * 100 : 0,
      fixedRatio: totalExpense > 0 ? (fixedSpending / totalExpense) * 100 : 0,
      flexibleRatio: totalExpense > 0 ? (flexibleSpending / totalExpense) * 100 : 0
    };
  } catch (error) {
    console.error('Error in calculateSavingsPotential:', error);
    return null;
  }
}

export function suggestSavings(userId, periodType, period) {
  console.log('suggestSavings called with:', { userId, periodType, period });
  let report;
  if (periodType === 'month') {
    report = getMonthlyReport(userId, period.year, period.month);
  } else if (periodType === 'quarter') {
    report = getQuarterlyReport(userId, period.year, period.quarter);
  } else if (periodType === 'year') {
    report = getYearlyReport(userId, period.year);
  }

  const categories = categoryRepository.listAll(userId).filter((c) => c.type === 'expense');
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Get user's average income for personalized thresholds
  let avgIncome = 0;
  if (periodType === 'month') {
    const periods = [];
    for (let i = 5; i >= 0; i--) {
      const currentDate = new Date(period.year, period.month - 1, 1);
      const prevDate = new Date(currentDate.setMonth(currentDate.getMonth() - i));
      periods.push({
        year: prevDate.getFullYear(),
        month: prevDate.getMonth() + 1,
      });
    }
    
    try {
      const trendAnalysis = analyzeTrends(userId, 'month', periods);
      avgIncome = trendAnalysis.avgIncome || 0;
    } catch (error) {
      console.error('Failed to get average income:', error);
    }
  }

  // Calculate personalized thresholds based on income
  const highSpendingThreshold = avgIncome > 0 ? avgIncome * 0.15 : report.totalExpense * 0.2; // 15% of income or 20% of total expense
  const largeTransactionThreshold = avgIncome > 0 ? avgIncome * 0.05 : 1000000; // 5% of income or 1M fixed

  const suggestions = [];

  // Get all transactions for outlier detection (needed for all period types)
  const allTransactions = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });

  // New: Analyze previous month, spending habits, and savings potential (only for month)
  let previousMonthAnalysis = null;
  let spendingHabits = null;
  let savingsPotential = null;

  if (periodType === 'month') {
    try {
      previousMonthAnalysis = analyzePreviousMonth(userId, period);
      spendingHabits = analyzeSpendingHabits(userId, period);
      savingsPotential = calculateSavingsPotential(userId, period, spendingHabits);

      // Add suggestions based on previous month analysis
      if (previousMonthAnalysis && previousMonthAnalysis.expenseChange > 20) {
        suggestions.push({
          type: 'month_over_month_increase',
          priority: 'high',
          suggestion: `Chi tiêu tháng này tăng ${previousMonthAnalysis.expenseChange.toFixed(1)}% so với tháng trước (${formatVND(previousMonthAnalysis.prevExpense)} → ${formatVND(previousMonthAnalysis.currentExpense)}). Cần kiểm soát chi tiêu ngay.`,
          potentialSavings: (previousMonthAnalysis.currentExpense - previousMonthAnalysis.prevExpense) * 0.3,
          action: 'review_category',
          actionLabel: 'Xem chi tiết',
        });
      } else if (previousMonthAnalysis && previousMonthAnalysis.expenseChange < -15) {
        suggestions.push({
          type: 'month_over_month_decrease',
          priority: 'low',
          suggestion: `Tuyệt vời! Chi tiêu tháng này giảm ${Math.abs(previousMonthAnalysis.expenseChange).toFixed(1)}% so với tháng trước. Tiếp tục duy trì.`,
          potentialSavings: 0,
          action: null,
          actionLabel: null,
        });
      }

      if (previousMonthAnalysis && previousMonthAnalysis.savingsRateChange < -10) {
        suggestions.push({
          type: 'savings_rate_decrease',
          priority: 'medium',
          suggestion: `Tỷ lệ tiết kiệm giảm ${Math.abs(previousMonthAnalysis.savingsRateChange).toFixed(1)}% so với tháng trước. Hãy cố gắng tăng tỷ lệ tiết kiệm lên ít nhất 20%.`,
          potentialSavings: avgIncome * 0.1,
          action: 'review_category',
          actionLabel: 'Xem chi tiết',
        });
      }

      // Add suggestions based on spending habits
      if (spendingHabits && spendingHabits.weekendToWeekdayRatio > 1.5) {
        suggestions.push({
          type: 'weekend_spending_high',
          priority: 'medium',
          suggestion: `Chi tiêu cuối tuần cao ${spendingHabits.weekendToWeekdayRatio.toFixed(1)} lần so với ngày thường. Hãy lập kế hoạch chi tiêu cho cuối tuần.`,
          potentialSavings: savingsPotential ? savingsPotential.weekendSavingsPotential : 0,
          action: 'review_transactions',
          actionLabel: 'Xem giao dịch cuối tuần',
        });
      }

      if (spendingHabits && spendingHabits.highestWeekAvg > spendingHabits.weekdayAvg * 2) {
        suggestions.push({
          type: 'high_spending_week',
          priority: 'medium',
          suggestion: `Tuần ${spendingHabits.highestWeek} có chi tiêu cao nhất trong tháng. Hãy kiểm soát chi tiêu vào tuần này.`,
          potentialSavings: (spendingHabits.highestWeekAvg - spendingHabits.weekdayAvg) * 0.2,
          action: 'review_transactions',
          actionLabel: 'Xem giao dịch tuần này',
        });
      }

      // Add suggestions based on savings potential
      if (savingsPotential && savingsPotential.discretionaryRatio > 30) {
        suggestions.push({
          type: 'reduce_discretionary',
          priority: 'high',
          suggestion: `Chi tiêu không cần thiết chiếm ${savingsPotential.discretionaryRatio.toFixed(1)}% tổng chi tiêu (${formatVND(savingsPotential.discretionarySpending)}). Có thể tiết kiệm ${formatVND(savingsPotential.discretionarySavingsPotential)} bằng cách giảm 30% chi tiêu này.`,
          potentialSavings: savingsPotential.discretionarySavingsPotential,
          action: 'review_category',
          actionLabel: 'Xem chi tiết',
        });
      }

      if (savingsPotential && savingsPotential.flexibleRatio > 50) {
        suggestions.push({
          type: 'optimize_flexible_spending',
          priority: 'medium',
          suggestion: `Chi tiêu linh hoạt chiếm ${savingsPotential.flexibleRatio.toFixed(1)}% tổng chi tiêu. Có nhiều cơ hội để tối ưu hóa và tiết kiệm.`,
          potentialSavings: savingsPotential.flexibleSpending * 0.15,
          action: 'review_category',
          actionLabel: 'Xem chi tiết',
        });
      }
    } catch (error) {
      console.error('Error in new analysis:', error);
    }
  }

  report.categoryBreakdown.forEach((cat) => {
    const categoryInfo = categoryMap.get(cat.categoryId);
    if (!categoryInfo) return;

    const percentage = cat.percentage;
    const avgTransaction = cat.count > 0 ? cat.amount / cat.count : 0;

    // High spending category suggestion (personalized)
    if (cat.amount > highSpendingThreshold) {
      const thresholdPercent = avgIncome > 0 ? ((cat.amount / avgIncome) * 100).toFixed(1) : percentage.toFixed(1);
      suggestions.push({
        type: 'high_spending',
        priority: 'high',
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        currentAmount: cat.amount,
        percentage,
        suggestion: avgIncome > 0 
          ? `Danh mục "${cat.categoryName}" chiếm ${thresholdPercent}% thu nhập trung bình. Cân nhắc giảm bớt các khoản chi tiêu không cần thiết trong danh mục này.`
          : `Danh mục "${cat.categoryName}" chiếm ${percentage.toFixed(1)}% tổng chi tiêu. Cân nhắc giảm bớt các khoản chi tiêu không cần thiết trong danh mục này.`,
        potentialSavings: cat.amount * 0.15,
        action: 'review_category',
        actionLabel: 'Xem chi tiết danh mục',
      });
    }

    // Large transactions suggestion (personalized)
    if (avgTransaction > largeTransactionThreshold) {
      suggestions.push({
        type: 'large_transactions',
        priority: 'medium',
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        avgTransaction,
        suggestion: avgIncome > 0
          ? `Trung bình mỗi giao dịch trong "${cat.categoryName}" là ${avgTransaction.toLocaleString('vi-VN')}đ (${((avgTransaction / avgIncome) * 100).toFixed(1)}% thu nhập). Hãy xem xét lại các khoản chi tiêu lớn này.`
          : `Trung bình mỗi giao dịch trong "${cat.categoryName}" là ${avgTransaction.toLocaleString('vi-VN')}đ. Hãy xem xét lại các khoản chi tiêu lớn này.`,
        potentialSavings: avgTransaction * 0.1 * cat.count,
        action: 'review_transactions',
        actionLabel: 'Xem giao dịch',
      });
    }
  });

  // Get budget data for budget-based suggestions
  if (periodType === 'month') {
    const budgets = budgetRepository.listByUserMonthYear(userId, period.month, period.year);
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));

    report.categoryBreakdown.forEach((cat) => {
      const budget = budgetMap.get(cat.categoryId);
      if (budget && cat.amount > Number(budget.amount)) {
        const overspent = cat.amount - Number(budget.amount);
        suggestions.push({
          type: 'budget_exceeded',
          priority: 'high',
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          budget: Number(budget.amount),
          spent: cat.amount,
          overspent,
          suggestion: `Danh mục "${cat.categoryName}" đã vượt ngân sách ${formatVND(overspent)}. Cần kiểm soát chi tiêu hoặc tăng ngân sách.`,
          potentialSavings: overspent * 0.5,
          action: 'adjust_budget',
          actionLabel: 'Điều chỉnh ngân sách',
        });
      }
    });

    // Budget optimization suggestions - analyze last 6 months
    const budgetOptimizationSuggestions = {};
    
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date(period.year, period.month - 1, 1);
      const prevDate = new Date(currentDate.setMonth(currentDate.getMonth() - i));
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth() + 1;

      const prevBudgets = budgetRepository.listByUserMonthYear(userId, prevMonth, prevYear);
      const prevBudgetMap = new Map(prevBudgets.map((b) => [b.categoryId, b]));

      const prevFiltered = allTransactions.rows.filter((t) => {
        const date = new Date(t.date);
        return t.type === 'expense' && date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth;
      });

      const prevByCategory = {};
      prevFiltered.forEach((t) => {
        if (!prevByCategory[t.categoryId]) {
          prevByCategory[t.categoryId] = { amount: 0, count: 0 };
        }
        prevByCategory[t.categoryId].amount += Number(t.amount);
        prevByCategory[t.categoryId].count += 1;
      });

      Object.entries(prevByCategory).forEach(([catId, data]) => {
        const prevBudget = prevBudgetMap.get(Number(catId));
        if (prevBudget) {
          const budgetAmount = Number(prevBudget.amount);
          const spentAmount = data.amount;
          const overspentCount = spentAmount > budgetAmount ? 1 : 0;
          
          if (!budgetOptimizationSuggestions[catId]) {
            budgetOptimizationSuggestions[catId] = {
              categoryId: Number(catId),
              categoryName: categoryMap.get(Number(catId))?.name || 'Unknown',
              overspentMonths: 0,
              underutilizedMonths: 0,
              totalBudget: 0,
              totalSpent: 0,
            };
          }
          
          budgetOptimizationSuggestions[catId].overspentMonths += overspentCount;
          if (spentAmount < budgetAmount * 0.5) {
            budgetOptimizationSuggestions[catId].underutilizedMonths += 1;
          }
          budgetOptimizationSuggestions[catId].totalBudget += budgetAmount;
          budgetOptimizationSuggestions[catId].totalSpent += spentAmount;
        }
      });
    }

    // Generate budget optimization suggestions
    Object.values(budgetOptimizationSuggestions).forEach((opt) => {
      // Frequently overspent categories - suggest increasing budget
      if (opt.overspentMonths >= 4) {
        const avgOverspend = Math.max(0, (opt.totalSpent - opt.totalBudget) / 6);
        suggestions.push({
          type: 'budget_increase',
          priority: 'medium',
          categoryId: opt.categoryId,
          categoryName: opt.categoryName,
          suggestion: `Danh mục "${opt.categoryName}" thường xuyên vượt ngân sách (${opt.overspentMonths}/6 tháng). Nên tăng ngân sách thêm ${formatVND(avgOverspend)}.`,
          potentialSavings: avgOverspend * 0.3,
          action: 'adjust_budget',
          actionLabel: 'Điều chỉnh ngân sách',
        });
      }

      // Underutilized budget categories - suggest decreasing budget
      if (opt.underutilizedMonths >= 4 && opt.overspentMonths === 0) {
        const avgUnderutilized = (opt.totalBudget - opt.totalSpent) / 6;
        suggestions.push({
          type: 'budget_decrease',
          priority: 'low',
          categoryId: opt.categoryId,
          categoryName: opt.categoryName,
          suggestion: `Danh mục "${opt.categoryName}" thường xuyên dư ngân sách (${opt.underutilizedMonths}/6 tháng). Có thể giảm ngân sách ${formatVND(avgUnderutilized)} để dùng cho mục khác.`,
          potentialSavings: avgUnderutilized * 0.5,
          action: 'adjust_budget',
          actionLabel: 'Điều chỉnh ngân sách',
        });
      }
    });

    // Categories with no budget but high spending
    report.categoryBreakdown.forEach((cat) => {
      const hasBudget = budgetMap.has(cat.categoryId);
      if (!hasBudget && cat.amount > highSpendingThreshold) {
        suggestions.push({
          type: 'no_budget',
          priority: 'high',
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          currentAmount: cat.amount,
          suggestion: `Danh mục "${cat.categoryName}" không có ngân sách nhưng chi tiêu ${formatVND(cat.amount)}. Nên thiết lập ngân sách để kiểm soát chi tiêu.`,
          potentialSavings: cat.amount * 0.1,
          action: 'create_budget',
          actionLabel: 'Tạo ngân sách',
        });
      }
    });
  }

  // Add trend-based suggestions using analyzeTrends
  if (periodType === 'month') {
    const periods = [];
    for (let i = 5; i >= 0; i--) {
      const currentDate = new Date(period.year, period.month - 1, 1);
      const prevDate = new Date(currentDate.setMonth(currentDate.getMonth() - i));
      periods.push({
        year: prevDate.getFullYear(),
        month: prevDate.getMonth() + 1,
      });
    }
    
    try {
      const trendAnalysis = analyzeTrends(userId, 'month', periods);
      
      // Find categories with strong increasing trend (>20% increase)
      const increasingCategories = trendAnalysis.categoryTrendAnalysis
        .filter((cat) => cat.trend === 'increasing' && cat.changePercent > 20)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 3);

      increasingCategories.forEach((cat) => {
        const currentCat = report.categoryBreakdown.find((c) => c.categoryId === cat.categoryId);
        if (currentCat) {
          suggestions.push({
            type: 'trend_increasing',
            priority: 'high',
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            changePercent: cat.changePercent,
            currentAmount: currentCat.amount,
            suggestion: `Danh mục "${cat.categoryName}" đang tăng mạnh ${cat.changePercent.toFixed(1)}% trong 6 tháng qua. Cần kiểm soát chi tiêu này ngay.`,
            potentialSavings: currentCat.amount * 0.2,
            action: 'review_category',
            actionLabel: 'Xem xu hướng',
          });
        }
      });

      // Find categories with strong decreasing trend (>15% decrease) - positive reinforcement
      const decreasingCategories = trendAnalysis.categoryTrendAnalysis
        .filter((cat) => cat.trend === 'decreasing' && cat.changePercent < -15)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 2);

      decreasingCategories.forEach((cat) => {
        const currentCat = report.categoryBreakdown.find((c) => c.categoryId === cat.categoryId);
        if (currentCat) {
          suggestions.push({
            type: 'trend_decreasing',
            priority: 'low',
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            changePercent: cat.changePercent,
            currentAmount: currentCat.amount,
            suggestion: `Tuyệt vời! Danh mục "${cat.categoryName}" đã giảm ${Math.abs(cat.changePercent).toFixed(1)}% trong 6 tháng qua. Tiếp tục duy trì.`,
            potentialSavings: 0,
            action: null,
            actionLabel: null,
          });
        }
      });
    } catch (error) {
      // If trend analysis fails, continue without trend suggestions
      console.error('Trend analysis failed:', error);
    }
  }

  // Detect potential subscriptions (recurring transactions) with cycle analysis
  // DISABLED: User requested to remove subscription suggestions
  /*
  const allTransactions = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  
  // Get transactions from last 6 months for better cycle detection
  const sixMonthsAgo = new Date(period.year, period.month - 7, 1);
  const filteredForSubscription = allTransactions.rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'expense' && date >= sixMonthsAgo;
  });

  // Group by note and analyze cycle
  const byNote = {};
  filteredForSubscription.forEach((t) => {
    const note = t.note || t.description || '';
    if (note.length > 0) {
      if (!byNote[note]) {
        byNote[note] = { 
          count: 0, 
          amount: 0, 
          categoryId: t.categoryId,
          dates: [],
          amounts: []
        };
      }
      byNote[note].count += 1;
      byNote[note].amount += Number(t.amount);
      byNote[note].dates.push(new Date(t.date));
      byNote[note].amounts.push(Number(t.amount));
    }
  });

  Object.entries(byNote).forEach(([note, data]) => {
    if (data.count >= 2) {
      const categoryInfo = categoryMap.get(data.categoryId);
      if (categoryInfo) {
        // Analyze cycle pattern
        const sortedDates = data.dates.sort((a, b) => a - b);
        const intervals = [];
        
        for (let i = 1; i < sortedDates.length; i++) {
          const diffDays = Math.round((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
          intervals.push(diffDays);
        }

        // Determine cycle type based on intervals
        let cycleType = 'unknown';
        let cycleDescription = 'không xác định';
        
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
          const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
          const stdDev = Math.sqrt(variance);
          const consistency = stdDev / avgInterval; // Lower is more consistent

          if (consistency < 0.3) { // Very consistent
            if (avgInterval >= 25 && avgInterval <= 35) {
              cycleType = 'monthly';
              cycleDescription = 'hàng tháng';
            } else if (avgInterval >= 6 && avgInterval <= 8) {
              cycleType = 'weekly';
              cycleDescription = 'hàng tuần';
            } else if (avgInterval >= 85 && avgInterval <= 95) {
              cycleType = 'quarterly';
              cycleDescription = 'hàng quý';
            } else if (avgInterval >= 360 && avgInterval <= 370) {
              cycleType = 'yearly';
              cycleDescription = 'hàng năm';
            } else {
              cycleType = 'regular';
              cycleDescription = `định kỳ (${Math.round(avgInterval)} ngày)`;
            }
          } else {
            cycleType = 'irregular';
            cycleDescription = 'không đều đặn';
          }
        }

        const avgAmount = data.amount / data.count;
        const amountConsistency = data.amounts.length > 1 
          ? (Math.min(...data.amounts) / Math.max(...data.amounts)) > 0.8 
          : true;

        suggestions.push({
          type: 'subscription',
          priority: cycleType !== 'unknown' && cycleType !== 'irregular' ? 'high' : 'medium',
          categoryId: data.categoryId,
          categoryName: categoryInfo.name,
          note,
          count: data.count,
          avgAmount,
          totalAmount: data.amount,
          cycleType,
          cycleDescription,
          isAmountConsistent: amountConsistency,
          suggestion: cycleType !== 'unknown' && cycleType !== 'irregular'
            ? `Phát hiện khoản định kỳ ${cycleDescription}: "${note}" (${data.count} lần, ${formatVND(avgAmount)}/lần). Cân nhắc hủy bỏ nếu không cần thiết.`
            : `Phát hiện khoản lặp lại có thể: "${note}" (${data.count} lần, trung bình ${formatVND(avgAmount)}/lần). Cân nhắc hủy bỏ nếu không cần thiết.`,
          potentialSavings: cycleType !== 'unknown' && cycleType !== 'irregular' ? data.amount * 0.4 : data.amount * 0.3,
          action: 'review_subscription',
          actionLabel: 'Xem chi tiết',
        });
      }
    }
  });
  */

  // Detect outlier transactions (unusual spending)
  const currentPeriodTransactions = allTransactions.rows.filter((t) => {
    const date = new Date(t.date);
    if (periodType === 'month') {
      return t.type === 'expense' && date.getFullYear() === period.year && date.getMonth() + 1 === period.month;
    } else if (periodType === 'quarter') {
      const startMonth = (period.quarter - 1) * 3 + 1;
      const endMonth = period.quarter * 3;
      const tMonth = date.getMonth() + 1;
      return t.type === 'expense' && date.getFullYear() === period.year && tMonth >= startMonth && tMonth <= endMonth;
    } else if (periodType === 'year') {
      return t.type === 'expense' && date.getFullYear() === period.year;
    }
    return false;
  });

  // Calculate statistics for outlier detection
  if (currentPeriodTransactions.length > 0) {
    const amounts = currentPeriodTransactions.map((t) => Number(t.amount));
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const outlierThreshold = mean + 3 * stdDev; // 3-sigma rule

    // Find outlier transactions
    const outliers = currentPeriodTransactions.filter((t) => Number(t.amount) > outlierThreshold);
    
    if (outliers.length > 0) {
      const categoryInfo = categoryMap.get(outliers[0].categoryId);
      const totalOutlierAmount = outliers.reduce((sum, t) => sum + Number(t.amount), 0);
      
      suggestions.push({
        type: 'outlier',
        priority: 'high',
        categoryId: outliers[0].categoryId,
        categoryName: categoryInfo?.name || 'Unknown',
        outlierCount: outliers.length,
        totalOutlierAmount,
        avgOutlierAmount: totalOutlierAmount / outliers.length,
        suggestion: `Phát hiện ${outliers.length} giao dịch bất thường lớn hơn mức trung bình (trung bình ${formatVND(totalOutlierAmount / outliers.length)}). Có thể là lỗi hoặc chi tiêu không cần thiết.`,
        potentialSavings: totalOutlierAmount * 0.5,
        action: 'review_transactions',
        actionLabel: 'Xem giao dịch',
      });
    }
  }

  // Pattern-based suggestions
  // Sort by priority first, then by potential savings
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedSuggestions = suggestions.sort((a, b) => {
    const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialSavings - a.potentialSavings;
  });

  // Deduplicate by category: keep only the best suggestion per category
  const deduplicatedSuggestions = [];
  const categoryMap2 = new Map(); // Track which categories have been added
  
  for (const suggestion of sortedSuggestions) {
    const categoryId = suggestion.categoryId || `type_${suggestion.type}`; // Use categoryId if available, else use type
    
    // If this category hasn't been added yet, add this suggestion
    if (!categoryMap2.has(categoryId)) {
      deduplicatedSuggestions.push(suggestion);
      categoryMap2.set(categoryId, true);
    }
  }

  // Limit to top 5 suggestions
  const finalSuggestions = deduplicatedSuggestions.slice(0, 5);
  const totalPotentialSavings = finalSuggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

  // Generate overall insights
  const insights = [];
  if (totalPotentialSavings > 0) {
    const savingsPercentage = report.totalExpense > 0 
      ? ((totalPotentialSavings / report.totalExpense) * 100).toFixed(2)
      : 0;
    insights.push({
      type: 'info',
      message: `Có thể tiết kiệm được ${formatVND(totalPotentialSavings)} (${savingsPercentage}% tổng chi tiêu) bằng cách thực hiện các gợi ý dưới đây.`,
    });
  }

  const highPriorityCount = finalSuggestions.filter((s) => s.priority === 'high').length;
  if (highPriorityCount > 0) {
    insights.push({
      type: 'warning',
      message: `${highPriorityCount} gợi ý ưu tiên cần chú ý ngay để tiết kiệm chi tiêu.`,
    });
  }

  // Add insights based on spending habits
  if (spendingHabits && spendingHabits.weekendToWeekdayRatio > 1.5) {
    insights.push({
      type: 'info',
      message: `Chi tiêu cuối tuần cao ${spendingHabits.weekendToWeekdayRatio.toFixed(1)} lần so với ngày thường. Hãy lập kế hoạch chi tiêu cho cuối tuần.`,
    });
  }

  if (spendingHabits && spendingHabits.highestWeek) {
    insights.push({
      type: 'info',
      message: `Tuần ${spendingHabits.highestWeek} có chi tiêu cao nhất trong tháng (${formatVND(spendingHabits.highestWeekAvg)}). Hãy kiểm soát chi tiêu vào tuần này.`,
    });
  }

  // Add insights based on savings potential
  if (savingsPotential && savingsPotential.discretionaryRatio > 30) {
    insights.push({
      type: 'warning',
      message: `Chi tiêu không cần thiết chiếm ${savingsPotential.discretionaryRatio.toFixed(1)}% tổng chi tiêu. Có thể tiết kiệm ${formatVND(savingsPotential.discretionarySavingsPotential)}.`,
    });
  }

  return {
    period: report.period,
    totalExpense: report.totalExpense,
    totalIncome: report.totalIncome || 0,
    savings: report.savings || 0,
    savingsRate: report.savingsRate || 0,
    suggestions: finalSuggestions,
    totalPotentialSavings,
    savingsPercentage: report.totalExpense > 0 
      ? ((totalPotentialSavings / report.totalExpense) * 100).toFixed(2)
      : 0,
    insights,
    spendingHabits,
    savingsPotential,
    previousMonthAnalysis,
  };
}

export function compareWithBudget(userId, year, month) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'expense' && date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const totalExpense = filtered.reduce((sum, t) => sum + Number(t.amount), 0);

  const byCategory = {};
  filtered.forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;
  });

  const categories = categoryRepository.listAll(userId).filter((c) => c.type === 'expense');
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Get budgets for this month
  const budgets = budgetRepository.listByUserMonthYear(userId, month, year);
  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));

  // Separate categories into budgeted and non-budgeted
  const budgetedCategoryBreakdown = [];
  const nonBudgetedCategoryBreakdown = [];

  Object.entries(byCategory).forEach(([catId, data]) => {
    const budget = budgetMap.get(Number(catId));
    const budgetAmount = budget ? Number(budget.amount) : 0;
    
    if (budget && budgetAmount > 0) {
      // Category has budget - include in budget analysis
      const remaining = budgetAmount - data.amount;
      const percentUsed = budgetAmount > 0 ? (data.amount / budgetAmount) * 100 : 0;
      budgetedCategoryBreakdown.push({
        categoryId: Number(catId),
        categoryName: categoryMap.get(Number(catId)) || 'Unknown',
        amount: data.amount,
        count: data.count,
        budget: budgetAmount,
        remaining,
        percentUsed,
        exceeded: data.amount > budgetAmount,
        hasBudget: true,
      });
    } else {
      // Category has no budget - only track spending
      nonBudgetedCategoryBreakdown.push({
        categoryId: Number(catId),
        categoryName: categoryMap.get(Number(catId)) || 'Unknown',
        amount: data.amount,
        count: data.count,
        budget: 0,
        remaining: 0,
        percentUsed: 0,
        exceeded: false,
        hasBudget: false,
      });
    }
  });

  // Combine both breakdowns
  const categoryBreakdown = [...budgetedCategoryBreakdown, ...nonBudgetedCategoryBreakdown];

  // Calculate total budget and expense only for budgeted categories
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const budgetedExpense = budgetedCategoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
  const totalRemaining = totalBudget - budgetedExpense;
  const totalPercentUsed = totalBudget > 0 ? (budgetedExpense / totalBudget) * 100 : 0;

  // Budget Health Score (0-100)
  let healthScore = 50;
  const scoreFactors = [];

  // Budget adherence factor (0-40 points)
  if (totalPercentUsed <= 100) {
    healthScore += 40;
    scoreFactors.push({ factor: 'Tuân thủ ngân sách', points: 40, reason: 'Trong ngân sách' });
  } else if (totalPercentUsed <= 110) {
    healthScore += 20;
    scoreFactors.push({ factor: 'Tuân thủ ngân sách', points: 20, reason: 'Vượt nhẹ (≤110%)' });
  } else {
    healthScore -= 20;
    scoreFactors.push({ factor: 'Tuân thủ ngân sách', points: -20, reason: 'Vượt nhiều (>110%)' });
  }

  // Category adherence factor (0-30 points)
  const exceededCategories = categoryBreakdown.filter((c) => c.exceeded).length;
  const totalBudgetedCategories = budgets.length;
  if (totalBudgetedCategories > 0) {
    const exceededRatio = exceededCategories / totalBudgetedCategories;
    if (exceededRatio === 0) {
      healthScore += 30;
      scoreFactors.push({ factor: 'Danh mục vượt ngân sách', points: 30, reason: 'Không có' });
    } else if (exceededRatio <= 0.3) {
      healthScore += 15;
      scoreFactors.push({ factor: 'Danh mục vượt ngân sách', points: 15, reason: 'Ít (≤30%)' });
    } else {
      healthScore -= 15;
      scoreFactors.push({ factor: 'Danh mục vượt ngân sách', points: -15, reason: 'Nhiều (>30%)' });
    }
  }

  // Remaining budget factor (0-20 points)
  if (totalRemaining >= 0) {
    const remainingRatio = totalBudget > 0 ? totalRemaining / totalBudget : 0;
    if (remainingRatio >= 0.2) {
      healthScore += 20;
      scoreFactors.push({ factor: 'Ngân sách còn lại', points: 20, reason: 'Dồi dào (≥20%)' });
    } else if (remainingRatio >= 0.1) {
      healthScore += 10;
      scoreFactors.push({ factor: 'Ngân sách còn lại', points: 10, reason: 'Ổn định (10-19%)' });
    } else {
      healthScore -= 10;
      scoreFactors.push({ factor: 'Ngân sách còn lại', points: -10, reason: 'Thấp (<10%)' });
    }
  }

  // Clamp score between 0 and 100
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Overspending alerts - only for budgeted categories
  const overspendingAlerts = budgetedCategoryBreakdown
    .filter((c) => c.exceeded)
    .map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      budget: c.budget,
      spent: c.amount,
      overspent: c.amount - c.budget,
      overspentPercent: ((c.amount - c.budget) / c.budget) * 100,
    }))
    .sort((a, b) => b.overspentPercent - a.overspentPercent);

  // Budget history (last 6 months) - only for budgeted categories
  const budgetHistory = [];
  for (let i = 5; i >= 0; i--) {
    const historyDate = new Date(year, month - i - 1, 1);
    const hYear = historyDate.getFullYear();
    const hMonth = historyDate.getMonth() + 1;

    const hBudgets = budgetRepository.listByUserMonthYear(userId, hMonth, hYear);
    const hTotalBudget = hBudgets.reduce((sum, b) => sum + Number(b.amount), 0);

    // Only calculate expense for budgeted categories
    const hBudgetedCategoryIds = hBudgets.map(b => b.categoryId);
    const hFiltered = rows.filter((t) => {
      const date = new Date(t.date);
      return t.type === 'expense' &&
             date.getFullYear() === hYear &&
             date.getMonth() + 1 === hMonth &&
             hBudgetedCategoryIds.includes(t.categoryId);
    });

    const hExpense = hFiltered.reduce((sum, t) => sum + Number(t.amount), 0);
    const hPercentUsed = hTotalBudget > 0 ? (hExpense / hTotalBudget) * 100 : 0;

    budgetHistory.push({
      month: hMonth,
      year: hYear,
      label: `T${hMonth}/${hYear}`,
      expense: hExpense,
      budget: hTotalBudget,
      percentUsed: hPercentUsed,
    });
  }

  // Budget performance insights
  const insights = [];
  if (healthScore >= 80) {
    insights.push({
      type: 'success',
      message: 'Tuân thủ ngân sách xuất sắc! Tiếp tục duy trì thói quen tài chính tốt.',
    });
  } else if (healthScore >= 60) {
    insights.push({
      type: 'info',
      message: 'Tuân thủ ngân sách khá tốt. Có thể cải thiện thêm bằng cách kiểm soát các danh mục vượt ngân sách.',
    });
  } else {
    insights.push({
      type: 'warning',
      message: 'Cần cải thiện tuân thủ ngân sách. Hãy xem xét lại các danh mục chi tiêu và điều chỉnh ngân sách phù hợp.',
    });
  }

  if (overspendingAlerts.length > 0) {
    insights.push({
      type: 'warning',
      message: `${overspendingAlerts.length} danh mục vượt ngân sách. Cần chú ý: ${overspendingAlerts.slice(0, 2).map((a) => a.categoryName).join(', ')}`,
    });
  }

  if (totalRemaining < 0) {
    insights.push({
      type: 'error',
      message: `Đã vượt tổng ngân sách ${formatVND(Math.abs(totalRemaining))}. Cần cắt giảm chi tiêu ngay.`,
    });
  }

  // Find frequently overspent categories - only for budgeted categories
  const frequentlyOverspent = [];
  for (const cat of categories) {
    let overspentCount = 0;
    let hasBudgetInAnyMonth = false;

    for (let i = 0; i < 6; i++) {
      const hDate = new Date(year, month - i - 1, 1);
      const hYear = hDate.getFullYear();
      const hMonth = hDate.getMonth() + 1;

      const hBudgets = budgetRepository.listByUserMonthYear(userId, hMonth, hYear);
      const hBudget = hBudgets.find((b) => b.categoryId === cat.id);

      if (hBudget) {
        hasBudgetInAnyMonth = true;
        const hFiltered = rows.filter((t) => {
          const date = new Date(t.date);
          return t.type === 'expense' && t.categoryId === cat.id && date.getFullYear() === hYear && date.getMonth() + 1 === hMonth;
        });
        const hExpense = hFiltered.reduce((sum, t) => sum + Number(t.amount), 0);
        if (hExpense > Number(hBudget.amount)) {
          overspentCount++;
        }
      }
    }

    // Only include categories that have budget in at least one month
    if (hasBudgetInAnyMonth && overspentCount >= 3) {
      frequentlyOverspent.push({
        categoryId: cat.id,
        categoryName: cat.name,
        overspentCount,
        suggestion: `Danh mục "${cat.name}" thường xuyên vượt ngân sách (${overspentCount}/6 tháng). Nên tăng ngân sách hoặc giảm chi tiêu.`,
      });
    }
  }

  if (frequentlyOverspent.length > 0) {
    insights.push({
      type: 'warning',
      message: `Danh mục thường xuyên vượt ngân sách: ${frequentlyOverspent.map((f) => f.categoryName).join(', ')}`,
    });
  }

  return {
    period: { type: 'month', year, month },
    totalExpense,
    totalBudget,
    totalRemaining,
    totalPercentUsed,
    categoryBreakdown,
    healthScore,
    scoreFactors,
    overspendingAlerts,
    budgetHistory,
    insights,
    frequentlyOverspent,
  };
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMonthlySummary(userId, year, month) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSavings = income - expense;
  const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(2) : 0;

  const byCategory = {};
  filtered.filter((t) => t.type === 'expense').forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;
  });

  const categories = categoryRepository.listAll(userId).filter((c) => c.type === 'expense');
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryBreakdown = Object.entries(byCategory).map(([catId, data]) => ({
    categoryId: Number(catId),
    categoryName: categoryMap.get(Number(catId)) || 'Unknown',
    amount: data.amount,
    count: data.count,
    percentage: expense > 0 ? (data.amount / expense) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  const dailyAverage = expense / new Date(year, month, 0).getDate();
  const highestTransaction = filtered
    .filter((t) => t.type === 'expense')
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  // Top 3 categories by amount
  const topCategories = categoryBreakdown.slice(0, 3);

  // Savings breakdown
  const savingsBreakdown = {
    totalSavings: netSavings,
    savingsRate: Number(savingsRate),
    byCategory: categoryBreakdown.map((cat) => ({
      categoryName: cat.categoryName,
      potentialSavings: cat.amount * 0.1, // Assume 10% could be saved from each category
    })),
  };

  // MoM Comparison (compare with previous month)
  let momComparison = null;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthFiltered = rows.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth;
  });
  const prevMonthIncome = prevMonthFiltered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const prevMonthExpense = prevMonthFiltered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  if (prevMonthIncome > 0 || prevMonthExpense > 0) {
    momComparison = {
      period: `T${prevMonth}/${prevYear}`,
      income: prevMonthIncome,
      expense: prevMonthExpense,
      incomeChange: income - prevMonthIncome,
      incomeChangePercent: prevMonthIncome > 0 ? ((income - prevMonthIncome) / prevMonthIncome) * 100 : 0,
      expenseChange: expense - prevMonthExpense,
      expenseChangePercent: prevMonthExpense > 0 ? ((expense - prevMonthExpense) / prevMonthExpense) * 100 : 0,
    };
  }

  // YoY Comparison (compare with same month last year)
  let yoyComparison = null;
  const lastYear = year - 1;
  const lastYearFiltered = rows.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === lastYear && date.getMonth() + 1 === month;
  });
  const lastYearIncome = lastYearFiltered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const lastYearExpense = lastYearFiltered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  if (lastYearIncome > 0 || lastYearExpense > 0) {
    yoyComparison = {
      period: `T${month}/${lastYear}`,
      income: lastYearIncome,
      expense: lastYearExpense,
      incomeChange: income - lastYearIncome,
      incomeChangePercent: lastYearIncome > 0 ? ((income - lastYearIncome) / lastYearIncome) * 100 : 0,
      expenseChange: expense - lastYearExpense,
      expenseChangePercent: lastYearExpense > 0 ? ((expense - lastYearExpense) / lastYearExpense) * 100 : 0,
    };
  }

  // Heatmap data (spending by day)
  const daysInMonth = new Date(year, month, 0).getDate();
  const byDay = {};
  for (let i = 1; i <= daysInMonth; i++) {
    byDay[i] = { amount: 0, count: 0 };
  }
  filtered.filter((t) => t.type === 'expense').forEach((t) => {
    const day = new Date(t.date).getDate();
    byDay[day].amount += Number(t.amount);
    byDay[day].count += 1;
  });
  const heatmapData = Object.entries(byDay).map(([day, data]) => ({
    day: Number(day),
    amount: data.amount,
    count: data.count,
  }));

  const insights = [];
  if (netSavings < 0) {
    insights.push('Bạn đã chi tiêu vượt quá thu nhập trong tháng này. Cần xem xét lại các khoản chi tiêu.');
  } else if (Number(savingsRate) < 10) {
    insights.push('Tỷ lệ tiết kiệm thấp. Nên cố gắng tiết kiệm ít nhất 20% thu nhập.');
  } else if (Number(savingsRate) >= 20) {
    insights.push('Tỷ lệ tiết kiệm tốt! Tiếp tục duy trì thói quen tài chính lành mạnh.');
  }

  if (highestTransaction && Number(highestTransaction.amount) > expense * 0.3) {
    insights.push(`Một giao dịch lớn chiếm ${((highestTransaction.amount / expense) * 100).toFixed(1)}% tổng chi tiêu: ${highestTransaction.note || 'Không có ghi chú'}`);
  }

  if (momComparison) {
    if (momComparison.expenseChangePercent > 20) {
      insights.push(`Chi tiêu tăng ${momComparison.expenseChangePercent.toFixed(1)}% so với tháng trước. Cần kiểm soát.`);
    } else if (momComparison.expenseChangePercent < -20) {
      insights.push(`Chi tiêu giảm ${Math.abs(momComparison.expenseChangePercent).toFixed(1)}% so với tháng trước. Tuyệt vời!`);
    }
  }

  return {
    period: { type: 'month', year, month },
    summary: {
      income,
      expense,
      netSavings,
      savingsRate: Number(savingsRate),
      dailyAverage,
    },
    categoryBreakdown,
    topCategories,
    savingsBreakdown,
    momComparison,
    yoyComparison,
    heatmapData,
    highestTransaction: highestTransaction ? {
      amount: highestTransaction.amount,
      note: highestTransaction.note,
      categoryName: categoryMap.get(highestTransaction.categoryId) || 'Unknown',
      date: highestTransaction.date,
    } : null,
    insights,
  };
}

export function analyzeSpendingPatterns(userId, year, month) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'expense' && date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const byDay = {};
  for (let i = 1; i <= daysInMonth; i++) {
    byDay[i] = { amount: 0, count: 0 };
  }

  filtered.forEach((t) => {
    const day = new Date(t.date).getDate();
    byDay[day].amount += Number(t.amount);
    byDay[day].count += 1;
  });

  const dailyData = Object.entries(byDay).map(([day, data]) => ({
    day: Number(day),
    amount: data.amount,
    count: data.count,
  }));

  const byDayOfWeek = {};
  filtered.forEach((t) => {
    const dayOfWeek = new Date(t.date).getDay();
    if (!byDayOfWeek[dayOfWeek]) {
      byDayOfWeek[dayOfWeek] = { amount: 0, count: 0 };
    }
    byDayOfWeek[dayOfWeek].amount += Number(t.amount);
    byDayOfWeek[dayOfWeek].count += 1;
  });

  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weeklyPattern = Object.entries(byDayOfWeek).map(([day, data]) => ({
    day: dayNames[Number(day)],
    amount: data.amount,
    count: data.count,
    avgPerTransaction: data.count > 0 ? data.amount / data.count : 0,
  }));

  const firstHalf = dailyData.slice(0, 15).reduce((sum, d) => sum + d.amount, 0);
  const secondHalf = dailyData.slice(15).reduce((sum, d) => sum + d.amount, 0);
  const monthHalfComparison = {
    firstHalf,
    secondHalf,
    difference: secondHalf - firstHalf,
    percentage: firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0,
  };

  const patterns = [];
  if (monthHalfComparison.percentage > 30) {
    patterns.push('Bạn chi tiêu nhiều hơn vào nửa sau tháng. Hãy lập kế hoạch chi tiêu tốt hơn cho cuối tháng.');
  } else if (monthHalfComparison.percentage < -30) {
    patterns.push('Bạn chi tiêu nhiều hơn vào nửa đầu tháng. Hãy cân nhắc phân bổ chi tiêu đều hơn.');
  }

  const highestSpendingDay = dailyData.sort((a, b) => b.amount - a.amount)[0];
  if (highestSpendingDay && highestSpendingDay.amount > 0) {
    patterns.push(`Ngày chi tiêu nhiều nhất là ngày ${highestSpendingDay.day} với ${highestSpendingDay.amount.toLocaleString('vi-VN')}đ`);
  }

  return {
    period: { type: 'month', year, month },
    dailyData,
    weeklyPattern,
    monthHalfComparison,
    patterns,
  };
}

export function trackGoals(userId, year, month) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSavings = income - expense;
  const savingsRate = income > 0 ? ((netSavings / income) * 100) : 0;

  // Get previous months data for trend analysis
  const previousMonthsData = [];
  for (let i = 1; i <= 6; i++) {
    const prevDate = new Date(year, month - i - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    const prevFiltered = rows.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth;
    });
    const prevIncome = prevFiltered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const prevExpense = prevFiltered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : 0;
    previousMonthsData.push({ month: prevMonth, year: prevYear, savingsRate: prevSavingsRate, income: prevIncome, expense: prevExpense });
  }

  // Calculate average savings rate from previous months
  const avgSavingsRate = previousMonthsData.length > 0
    ? previousMonthsData.reduce((sum, d) => sum + d.savingsRate, 0) / previousMonthsData.length
    : 0;

  // Financial Habits/KPIs (reframed from "goals")
  const habits = [
    {
      name: 'Tỷ lệ tiết kiệm',
      description: 'Phần trăm thu nhập được tiết kiệm',
      target: 20,
      current: Number(savingsRate),
      unit: '%',
      achieved: Number(savingsRate) >= 20,
      progress: Math.min(Number(savingsRate) / 20 * 100, 100),
      trend: avgSavingsRate >= 20 ? 'Tốt' : avgSavingsRate >= 10 ? 'Trung bình' : 'Cần cải thiện',
      advice: avgSavingsRate < 20 ? 'Cố gắng tiết kiệm ít nhất 20% thu nhập mỗi tháng' : 'Duy trì thói quen tiết kiệm tốt',
      icon: '💰',
    },
    {
      name: 'Chi tiêu hàng ngày',
      description: 'Chi tiêu trung bình mỗi ngày',
      target: 2000000,
      current: expense / new Date(year, month, 0).getDate(),
      unit: 'đ/ngày',
      achieved: expense / new Date(year, month, 0).getDate() <= 2000000,
      progress: Math.min((2000000 / (expense / new Date(year, month, 0).getDate())) * 100, 100),
      trend: expense / new Date(year, month, 0).getDate() <= 2000000 ? 'Trong tầm kiểm soát' : 'Vượt ngân sách',
      advice: expense / new Date(year, month, 0).getDate() > 2000000 ? 'Giảm chi tiêu hàng ngày xuống dưới 2 triệu' : 'Duy trì mức chi tiêu hiện tại',
      icon: '📅',
    },
    {
      name: 'Ghi chú giao dịch',
      description: 'Tỷ lệ giao dịch có ghi chú',
      target: 80,
      current: filtered.filter((t) => t.type === 'expense' && t.note && t.note.trim() !== '').length / filtered.filter((t) => t.type === 'expense').length * 100,
      unit: '%',
      achieved: filtered.filter((t) => t.type === 'expense' && t.note && t.note.trim() !== '').length / filtered.filter((t) => t.type === 'expense').length * 100 >= 80,
      progress: Math.min((filtered.filter((t) => t.type === 'expense' && t.note && t.note.trim() !== '').length / filtered.filter((t) => t.type === 'expense').length * 100 / 80) * 100, 100),
      trend: filtered.filter((t) => t.type === 'expense' && t.note && t.note.trim() !== '').length / filtered.filter((t) => t.type === 'expense').length * 100 >= 80 ? 'Tốt' : 'Cần cải thiện',
      advice: filtered.filter((t) => t.type === 'expense' && t.note && t.note.trim() !== '').length / filtered.filter((t) => t.type === 'expense').length * 100 < 80 ? 'Thêm ghi chú cho giao dịch để theo dõi tốt hơn' : 'Tiếp tục ghi chú cho giao dịch',
      icon: '📝',
    },
  ];

  const achievedCount = habits.filter((h) => h.achieved).length;
  const overallProgress = (achievedCount / habits.length) * 100;
  const achievementRate = (achievedCount / habits.length) * 100;

  return {
    period: { type: 'month', year, month },
    summary: {
      income,
      expense,
      netSavings,
      savingsRate: Number(savingsRate),
    },
    habits,
    overallProgress,
    achievedCount,
    totalHabits: habits.length,
    achievementRate,
    previousMonthsData,
  };
}

export function detectAnomalies(userId, year, month) {
  const { rows } = transactionRepository.listForUser(userId, {}, { page: 1, limit: 10000 });
  const filtered = rows.filter((t) => {
    const date = new Date(t.date);
    return t.type === 'expense' && date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const categories = categoryRepository.listAll(userId).filter((c) => c.type === 'expense');
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const byCategory = {};
  filtered.forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { amount: 0, count: 0, transactions: [] };
    }
    byCategory[t.categoryId].amount += Number(t.amount);
    byCategory[t.categoryId].count += 1;
    byCategory[t.categoryId].transactions.push(t);
  });

  const anomalies = [];

  Object.entries(byCategory).forEach(([catId, data]) => {
    const avgPerTransaction = data.count > 0 ? data.amount / data.count : 0;
    const categoryName = categoryMap.get(Number(catId)) || 'Unknown';

    if (avgPerTransaction > 5000000) {
      anomalies.push({
        type: 'high_average_transaction',
        severity: 'high',
        categoryId: Number(catId),
        categoryName,
        value: avgPerTransaction,
        message: `Trung bình giao dịch trong "${categoryName}" rất cao: ${avgPerTransaction.toLocaleString('vi-VN')}đ`,
      });
    }

    data.transactions.forEach((t) => {
      if (Number(t.amount) > avgPerTransaction * 3 && avgPerTransaction > 0) {
        anomalies.push({
          type: 'unusually_large_transaction',
          severity: 'medium',
          categoryId: Number(catId),
          categoryName,
          transactionId: t.id,
          amount: t.amount,
          note: t.note,
          date: t.date,
          message: `Giao dịch bất thường: ${t.amount.toLocaleString('vi-VN')}đ trong "${categoryName}"`,
        });
      }
    });
  });

  const totalExpense = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  const dailyAverage = totalExpense / new Date(year, month, 0).getDate();

  filtered.forEach((t) => {
    if (Number(t.amount) > dailyAverage * 5) {
      anomalies.push({
        type: 'extreme_daily_spend',
        severity: 'high',
        transactionId: t.id,
        amount: t.amount,
        note: t.note,
        date: t.date,
        categoryName: categoryMap.get(t.categoryId) || 'Unknown',
        message: `Giao dịch cực lớn: ${t.amount.toLocaleString('vi-VN')}đ (gấp ${ (t.amount / dailyAverage).toFixed(1) } lần trung bình ngày)`,
      });
    }
  });

  const anomaliesBySeverity = {
    high: anomalies.filter((a) => a.severity === 'high'),
    medium: anomalies.filter((a) => a.severity === 'medium'),
    low: anomalies.filter((a) => a.severity === 'low'),
  };

  return {
    period: { type: 'month', year, month },
    anomalies,
    anomaliesBySeverity,
    totalAnomalies: anomalies.length,
    highSeverityCount: anomaliesBySeverity.high.length,
  };
}
