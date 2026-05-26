import * as historyRepository from '../repositories/historyRepository.js';
import * as budgetRepository from '../repositories/budgetRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import * as transactionRepository from '../repositories/transactionRepository.js';
import * as categoryRepository from '../repositories/categoryRepository.js';
import * as savingsRepository from '../repositories/savingsRepository.js';
import { getDb } from '../database/db.js';

function toMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function previousMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function parseKey(key) {
  const [y, m] = String(key).split('-').map(Number);
  return { year: y, month: m };
}

function nextMonth({ year, month }) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function compareKeys(a, b) {
  const ak = toMonthKey(a.year, a.month);
  const bk = toMonthKey(b.year, b.month);
  return ak.localeCompare(bk);
}

function monthBefore({ year, month }) {
  const m = Number(month);
  const y = Number(year);
  if (m <= 1) return { year: y - 1, month: 12 };
  return { year: y, month: m - 1 };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getOrCreateRefundCategory() {
  const existing = categoryRepository.findByNameAndType('Tiền hoàn', 'income');
  if (existing) return existing;
  return categoryRepository.create({ name: 'Tiền hoàn', type: 'income' });
}

function processBudgetRefundForMonth(userId, year, month) {
  const db = getDb();
  const run = db.transaction(() => {
    // Mô hình hiện đại: không hoàn tiền về ví khi monthly rollover
    // Ngân sách chỉ là kế hoạch, không trừ tiền từ ví
    const budgets = budgetRepository.listByUserMonthYear(userId, month, year);

    budgets.forEach((budget) => {
      const planned = Number(budget.amount || 0);
      if (planned <= 0 || !budget.walletId) return;

      const spent = Number(
        transactionRepository.sumExpenseForBudget(
          userId,
          Number(budget.categoryId),
          Number(month),
          Number(year)
        ) || 0
      );
      const remaining = roundMoney(planned - spent);
      if (remaining <= 0) return;

      // Mô hình hiện đại: không hoàn tiền, chỉ ghi log
      historyRepository.createActivity({
        userId,
        actionType: 'budget_rollover',
        entityType: 'budget',
        entityId: budget.id,
        title: `Chốt ngân sách tháng ${month}/${year}`,
        details: `Ngân sách "${budget.categoryName || budget.id}" - Còn dư: ${remaining}`,
        amount: remaining,
        occurredAt: new Date().toISOString(),
      });
    });
  });

  run();
}

function buildDateRange(query) {
  const mode = query.mode || 'all';
  if (mode === 'day' && query.day) {
    return { dateFrom: query.day, dateTo: query.day };
  }
  if (mode === 'month') {
    const year = Number(query.year);
    const month = Number(query.month);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { dateFrom: from, dateTo: to };
  }
  if (mode === 'year') {
    const year = Number(query.year);
    return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
  }
  return { dateFrom: undefined, dateTo: undefined };
}

function matchesActivityType(row, activityType) {
  if (!activityType || activityType === 'all') return true;
  if (activityType === 'transaction') return row.entityType === 'transaction';
  if (activityType === 'budget') return row.entityType === 'budget';
  if (activityType === 'wallet') return row.entityType === 'wallet';
  if (activityType === 'profile') return row.entityType === 'profile';
  if (activityType === 'category') return row.entityType === 'category';
  if (activityType === 'admin') return row.entityType === 'admin_user';
  if (activityType === 'system') return row.entityType === 'system';
  if (activityType === 'savings') {
    return row.entityType === 'savings' || row.entityType === 'savings_account' || row.entityType === 'savings_transfer';
  }
  return true;
}

function buildHistoryAnalytics(userId, range) {
  const filter = { dateFrom: range.dateFrom, dateTo: range.dateTo };
  const totalIncome = Number(
    transactionRepository.sumByType(userId, { ...filter, type: 'income', excludeRefundCategory: true }) || 0
  );
  const totalExpense = Number(
    transactionRepository.sumByType(userId, { ...filter, type: 'expense' }) || 0
  );
  const incomeByCategory = transactionRepository.incomeByCategory(userId, { ...filter, excludeRefundCategory: true });
  const expenseByCategory = transactionRepository.expenseByCategory(userId, filter);
  const savingsRows = savingsRepository.sumTransfersByDirectionInRange(userId, filter);
  let savingsDeposit = 0;
  let savingsWithdraw = 0;
  savingsRows.forEach((r) => {
    if (r.direction === 'deposit') savingsDeposit = Number(r.total || 0);
    if (r.direction === 'withdraw') savingsWithdraw = Number(r.total || 0);
  });

  const db = getDb();
  let countSql = `SELECT COUNT(*) AS c FROM transactions t WHERE t.userId = ?`;
  const params = [userId];
  if (range.dateFrom) {
    countSql += ' AND date(t.date) >= date(?)';
    params.push(range.dateFrom);
  }
  if (range.dateTo) {
    countSql += ' AND date(t.date) <= date(?)';
    params.push(range.dateTo);
  }
  const transactionCount = db.prepare(countSql).get(...params).c;

  const flowTotal = totalIncome + totalExpense;
  const incomeSharePct =
    flowTotal > 0 ? Math.round((totalIncome / flowTotal) * 1000) / 10 : 0;
  const expenseSharePct =
    flowTotal > 0 ? Math.round((totalExpense / flowTotal) * 1000) / 10 : 0;
  const incomeToExpenseRatio =
    totalExpense > 0 ? Math.round((totalIncome / totalExpense) * 100) / 100 : null;

  let timeSeries = [];
  let seriesGranularity = 'month';
  if (range.dateFrom && range.dateTo) {
    const d1 = new Date(`${range.dateFrom}T12:00:00`);
    const d2 = new Date(`${range.dateTo}T12:00:00`);
    const daySpan = Math.ceil((d2 - d1) / 86400000) + 1;
    if (daySpan <= 90) {
      seriesGranularity = 'day';
      const byDay = transactionRepository.incomeExpenseByDay(
        userId,
        range.dateFrom,
        range.dateTo
      );
      timeSeries = byDay.map((row) => ({
        label: row.day,
        income: Number(row.income || 0),
        expense: Number(row.expense || 0),
      }));
    } else {
      const byMonth = transactionRepository.incomeExpenseByMonthInRange(userId, filter);
      timeSeries = byMonth.map((row) => ({
        label: `T${row.month}/${row.year}`,
        income: Number(row.income || 0),
        expense: Number(row.expense || 0),
      }));
    }
  } else {
    const byMonth = transactionRepository.incomeExpenseByMonthRecent(userId, 36);
    timeSeries = byMonth.map((row) => ({
      label: `T${row.month}/${row.year}`,
      income: Number(row.income || 0),
      expense: Number(row.expense || 0),
    }));
  }

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount,
    incomeByCategory: incomeByCategory.slice(0, 10),
    expenseByCategory: expenseByCategory.slice(0, 10),
    savings: {
      deposit: savingsDeposit,
      withdraw: savingsWithdraw,
      netFlow: savingsDeposit - savingsWithdraw,
    },
    incomeSharePct,
    expenseSharePct,
    incomeToExpenseRatio,
    seriesGranularity,
    timeSeries,
  };
}

export function logActivity(payload) {
  return historyRepository.createActivity(payload);
}

export function ensureMonthlyRollover(userId) {
  const latest = historyRepository.getLatestRollover(userId);
  const prev = previousMonth();

  let cursor;
  if (!latest) {
    const earliest = budgetRepository.getEarliestBudgetPeriod(userId);
    if (!earliest) {
      historyRepository.upsertRollover(userId, prev.year, prev.month);
      return false;
    }
    cursor = monthBefore({
      year: Number(earliest.year),
      month: Number(earliest.month),
    });
  } else {
    cursor = parseKey(toMonthKey(Number(latest.year), Number(latest.month)));
  }

  const db = getDb();
  let rolled = false;
  while (compareKeys(cursor, prev) < 0) {
    const target = nextMonth(cursor);
    db.transaction(() => {
      processBudgetRefundForMonth(userId, target.year, target.month);
      historyRepository.upsertRollover(userId, target.year, target.month);
      historyRepository.createActivity({
        userId,
        actionType: 'monthly_rollover',
        entityType: 'system',
        title: `Đã chốt dữ liệu tháng ${target.month}/${target.year}`,
        details: 'Dữ liệu tháng đã được lưu vào lịch sử.',
      });
    })();
    cursor = target;
    rolled = true;
  }
  return rolled;
}

export function listHistory(userId, query) {
  const {
    page = 1,
    limit = 20,
    activityType = 'all',
    txPage = 1,
    txLimit = 30,
    savingsPage = 1,
    savingsLimit = 15,
  } = query;
  const rolled = ensureMonthlyRollover(userId);
  const range = buildDateRange(query);
  const analytics = buildHistoryAnalytics(userId, range);
  const transactions = transactionRepository.listForUser(
    userId,
    { dateFrom: range.dateFrom, dateTo: range.dateTo },
    { page: Number(txPage), limit: Number(txLimit) }
  );
  const savingsTransfers = savingsRepository.listTransfersInRange(
    userId,
    range,
    { page: Number(savingsPage), limit: Number(savingsLimit) }
  );
  const activityRows = historyRepository.listActivities(userId, range);
  const txRows = historyRepository.listTransactionsAsHistory(userId, range);
  const savingsHistoryRows = historyRepository.listSavingsTransfersAsHistory(userId, range);
  const goalHistoryRows = historyRepository.listGoalTransactionsAsHistory(userId, range);

  const merged = [...activityRows, ...txRows, ...savingsHistoryRows, ...goalHistoryRows]
    .filter((row) => matchesActivityType(row, activityType))
    .sort((a, b) => {
    const av = new Date(a.occurredAt).getTime();
    const bv = new Date(b.occurredAt).getTime();
    if (av !== bv) return bv - av;
    return Number(b.id) - Number(a.id);
    });
  const start = (Number(page) - 1) * Number(limit);
  const rows = merged.slice(start, start + Number(limit));
  return {
    rows,
    total: merged.length,
    page: Number(page),
    limit: Number(limit),
    didMonthlyRollover: rolled,
    range: {
      dateFrom: range.dateFrom ?? null,
      dateTo: range.dateTo ?? null,
    },
    analytics,
    transactions,
    savingsTransfers,
  };
}
