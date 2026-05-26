import * as transactionRepository from '../repositories/transactionRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import * as savingsRepository from '../repositories/savingsRepository.js';
import * as budgetRepository from '../repositories/budgetRepository.js';
import * as goalRepository from '../repositories/goalRepository.js';
import { toSqlDate } from '../utils/date.js';

export function summary(userId, { dateFrom, dateTo }) {
  const df = toSqlDate(dateFrom);
  const dt = toSqlDate(dateTo);
  const income = transactionRepository.sumByType(userId, {
    dateFrom: df,
    dateTo: dt,
    type: 'income',
    excludeRefundCategory: true,
  });
  const expense = transactionRepository.sumByType(userId, {
    dateFrom: df,
    dateTo: dt,
    type: 'expense',
  });
  const balance = walletRepository.sumBalanceByUser(userId);
  const savingsBalance = savingsRepository.sumSavingsBalanceByUser(userId) + goalRepository.sumCurrentAmountByUser(userId);
  const budgetTotal = budgetRepository.sumAmountByUserCurrentMonth(userId);
  return {
    income,
    expense,
    balance,
    savingsBalance,
    budgetTotal,
    netWorth: balance + savingsBalance,
    period: { dateFrom: df || null, dateTo: dt || null },
  };
}

export function chartCategory(userId, { dateFrom, dateTo }) {
  const items = transactionRepository.expenseByCategory(userId, {
    dateFrom: toSqlDate(dateFrom),
    dateTo: toSqlDate(dateTo),
  });
  return { items };
}

export function monthly(userId, { year }) {
  const y = year != null ? Number(year) : new Date().getFullYear();
  const raw = transactionRepository.monthlyTotals(userId, y);
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const row = raw.find((r) => r.month === m);
    return {
      month: m,
      income: row ? row.income : 0,
      expense: row ? row.expense : 0,
    };
  });
  return { year: y, months };
}

export function budgetInsights(userId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeftIncludingToday = Math.max(daysInMonth - dayOfMonth + 1, 1);
  const daysLeftAfterToday = Math.max(daysInMonth - dayOfMonth, 1);

  const budgets = budgetRepository
    .listByUser(userId)
    .filter((b) => Number(b.month) === month && Number(b.year) === year && Number(b.amount) > 0)
    .map((b) => {
      const spent = Number(
        transactionRepository.sumExpenseForBudget(userId, b.categoryId, month, year) || 0
      );
      const amount = Number(b.amount || 0);
      const remaining = Math.max(amount - spent, 0);
      const percentUsed = amount > 0 ? (spent / amount) * 100 : 0;
      const plannedPerDay = Math.floor(amount / daysInMonth);
      const avgSpentPerDay = Math.floor(spent / Math.max(dayOfMonth, 1));
      const suggestedPerDayFromNow = Math.floor(remaining / daysLeftIncludingToday);
      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        walletName: b.walletName,
        amount,
        spent,
        remaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
        dailyPlan: {
          plannedPerDay,
          avgSpentPerDay,
          suggestedPerDayFromNow,
        },
      };
    });

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = Math.max(totalBudget - totalSpent, 0);
  const overallPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const warningItems = budgets
    .filter((b) => b.percentUsed >= 80)
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .map((b) => ({
      ...b,
      level: b.percentUsed >= 100 ? 'critical' : b.percentUsed >= 95 ? 'critical' : 'warning',
      message:
        b.percentUsed >= 100
          ? `Danh mục ${b.categoryName} đã vượt quá kế hoạch chi tiêu`
          : b.percentUsed >= 95
            ? `Danh mục ${b.categoryName} gần chạm trần kế hoạch chi tiêu`
            : `Danh mục ${b.categoryName} đã dùng hơn 80% kế hoạch chi tiêu`,
    }));

  const suggestedToday = Math.floor(totalRemaining / daysLeftIncludingToday);
  const suggestedTomorrow = Math.floor(
    Math.max(totalRemaining - suggestedToday, 0) / daysLeftAfterToday
  );

  let economyAssessment = {
    level: 'good',
    title: 'Kiểm soát tốt',
    message: 'Tốc độ chi tiêu hiện tại đang an toàn so với kế hoạch chi tiêu tháng.',
  };
  if (overallPercentUsed >= 90) {
    economyAssessment = {
      level: 'risk',
      title: 'Cảnh báo cao',
      message: 'Bạn đã dùng phần lớn kế hoạch chi tiêu tháng. Nên hạn chế chi tiêu không thiết yếu.',
    };
  } else if (overallPercentUsed >= 75) {
    economyAssessment = {
      level: 'warning',
      title: 'Cần thận trọng',
      message: 'Mức chi đang tăng nhanh. Nên bám sát hạn mức gợi ý mỗi ngày.',
    };
  }

  return {
    month,
    year,
    dayOfMonth,
    daysInMonth,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentUsed: Math.round(overallPercentUsed * 100) / 100,
    suggestedDailySpend: {
      today: suggestedToday,
      tomorrow: suggestedTomorrow,
    },
    economyAssessment,
    warnings: warningItems,
    categories: budgets.sort((a, b) => b.percentUsed - a.percentUsed),
  };
}
