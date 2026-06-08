import { getDb } from '../database/db.js';

export function listForUser(userId, status = null) {
  const db = getDb();
  let query = `
    SELECT g.*, w.name as walletName
    FROM saving_goals g
    LEFT JOIN wallets w ON g.walletId = w.id
    WHERE g.userId = ?
  `;
  const params = [userId];
  
  if (status === 'active') {
    query += ` AND g.status IN ('active', 'overdue')`;
  } else if (status) {
    query += ` AND g.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY g.targetDate ASC`;
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getById(id, userId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT g.*, w.name as walletName
    FROM saving_goals g
    LEFT JOIN wallets w ON g.walletId = w.id
    WHERE g.id = ? AND g.userId = ?
  `);
  return stmt.get(id, userId);
}

export function create(goal) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO saving_goals (userId, walletId, name, targetAmount, currentAmount, targetDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    Number(goal.userId),
    Number(goal.walletId),
    String(goal.name),
    Number(goal.targetAmount),
    Number(goal.currentAmount || 0),
    String(goal.targetDate),
    String(goal.status || 'active')
  );
  return getById(result.lastInsertRowid, goal.userId);
}

export function update(id, userId, updates) {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(String(updates.name));
  }
  if (updates.targetAmount !== undefined) {
    fields.push('targetAmount = ?');
    values.push(Number(updates.targetAmount));
  }
  if (updates.currentAmount !== undefined) {
    fields.push('currentAmount = ?');
    values.push(Number(updates.currentAmount));
  }
  if (updates.targetDate !== undefined) {
    fields.push('targetDate = ?');
    values.push(String(updates.targetDate));
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(String(updates.status));
  }
  
  fields.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(id, userId);
  
  const stmt = db.prepare(`
    UPDATE saving_goals
    SET ${fields.join(', ')}
    WHERE id = ? AND userId = ?
  `);
  stmt.run(...values);
  return getById(id, userId);
}

export function remove(id, userId) {
  const db = getDb();
  // Delete transactions first to avoid foreign key constraint
  const deleteTransactions = db.prepare(`
    DELETE FROM saving_transactions
    WHERE goalId = ? AND userId = ?
  `);
  deleteTransactions.run(id, userId);
  
  // Then delete the goal
  const stmt = db.prepare(`
    DELETE FROM saving_goals
    WHERE id = ? AND userId = ?
  `);
  return stmt.run(id, userId);
}

export function updateCurrentAmount(id, userId, amount) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE saving_goals
    SET currentAmount = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND userId = ?
  `);
  stmt.run(amount, id, userId);
  return getById(id, userId);
}

export function listTransactions(goalId, userId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT t.*, w.name as walletName
    FROM saving_transactions t
    LEFT JOIN wallets w ON t.walletId = w.id
    WHERE t.goalId = ? AND t.userId = ?
    ORDER BY t.date DESC
  `);
  return stmt.all(goalId, userId);
}

export function createTransaction(transaction) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO saving_transactions (goalId, userId, walletId, amount, type, note, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    Number(transaction.goalId),
    Number(transaction.userId),
    Number(transaction.walletId),
    Number(transaction.amount),
    String(transaction.type),
    transaction.note ? String(transaction.note) : null,
    String(transaction.date || new Date().toISOString())
  );
  return result.lastInsertRowid;
}

export function getDashboard(userId) {
  const db = getDb();
  const goals = listForUser(userId);
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalSavings = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;
  
  return {
    totalGoals,
    completedGoals,
    totalSavings,
    overallProgress
  };
}

export function sumCurrentAmountByUser(userId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(currentAmount), 0) AS total
    FROM saving_goals
    WHERE userId = ?
  `);
  const result = stmt.get(userId);
  return result.total;
}

export function getGoalAnalysis(userId) {
  const db = getDb();
  const goals = listForUser(userId);
  const now = new Date();
  
  const analysis = goals.map(g => {
    const targetDate = new Date(g.targetDate);
    const daysUntilTarget = Math.max(Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)), 0);
    const daysSinceCreation = Math.max(Math.ceil((now - new Date(g.createdAt)) / (1000 * 60 * 60 * 24)), 1);
    const remainingAmount = g.targetAmount - g.currentAmount;
    const dailySavingsRate = daysSinceCreation > 0 ? g.currentAmount / daysSinceCreation : 0;
    const requiredDailyRate = daysUntilTarget > 0 ? remainingAmount / daysUntilTarget : 0;
    const onTrack = dailySavingsRate >= requiredDailyRate || remainingAmount <= 0;
    
    // Estimated completion date based on current rate
    let estimatedCompletionDate = null;
    if (dailySavingsRate > 0 && remainingAmount > 0) {
      const daysToComplete = Math.ceil(remainingAmount / dailySavingsRate);
      const estDate = new Date(now);
      estDate.setDate(estDate.getDate() + daysToComplete);
      estimatedCompletionDate = estDate.toISOString().split('T')[0];
    }
    
    // Get transaction history for this goal
    const transactions = listTransactions(g.id, userId);
    const depositTransactions = transactions.filter(t => t.type === 'deposit');
    const withdrawTransactions = transactions.filter(t => t.type === 'withdraw');
    const totalDeposits = depositTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Historical progress data (last 6 months)
    const historicalProgress = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Calculate progress at end of month
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate >= monthStart && tDate <= monthEnd;
      });
      
      const monthDeposits = monthTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const monthWithdrawals = monthTransactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0);
      
      historicalProgress.push({
        month: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        label: `T${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`,
        amount: g.currentAmount - (totalDeposits - monthDeposits) + (totalWithdrawals - monthWithdrawals),
        deposits: monthDeposits,
        withdrawals: monthWithdrawals
      });
    }
    
    return {
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate,
      status: g.status,
      walletName: g.walletName,
      progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
      remainingAmount,
      daysUntilTarget,
      daysSinceCreation,
      dailySavingsRate,
      requiredDailyRate,
      onTrack,
      estimatedCompletionDate,
      totalDeposits,
      totalWithdrawals,
      transactionCount: transactions.length,
      historicalProgress
    };
  });
  
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const offTrackGoals = analysis.filter(g => !g.onTrack && g.status === 'active').length;
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
  
  // Generate insights
  const insights = [];
  if (offTrackGoals > 0) {
    insights.push({
      type: 'warning',
      message: `${offTrackGoals} mục tiêu đang chậm tiến độ. Cần tăng tốc độ tiết kiệm để đạt mục tiêu.`
    });
  }
  if (completedGoals > 0) {
    insights.push({
      type: 'success',
      message: `Chúc mừng! Bạn đã hoàn thành ${completedGoals} mục tiêu.`
    });
  }
  if (activeGoals > 0) {
    const avgProgress = analysis.filter(g => g.status === 'active').reduce((sum, g) => sum + g.progress, 0) / activeGoals;
    if (avgProgress > 50) {
      insights.push({
        type: 'info',
        message: `Tiến độ trung bình các mục tiêu đang tốt (${avgProgress.toFixed(0)}%). Tiếp tục duy trì!`
      });
    }
  }
  
  // Priority recommendations
  const recommendations = analysis
    .filter(g => g.status === 'active' && !g.onTrack)
    .sort((a, b) => (b.requiredDailyRate - b.dailySavingsRate) - (a.requiredDailyRate - a.dailySavingsRate))
    .slice(0, 3)
    .map(g => ({
      goalName: g.name,
      message: `Cần tăng tiết kiệm thêm ${formatVND(g.requiredDailyRate - g.dailySavingsRate)}/ngày để đạt mục tiêu`,
      priority: 'high'
    }));
  
  return {
    summary: {
      totalGoals,
      completedGoals,
      activeGoals,
      offTrackGoals,
      totalCurrentAmount,
      totalTargetAmount,
      overallProgress
    },
    goals: analysis,
    insights,
    recommendations
  };
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
