import * as goalRepository from '../repositories/goalRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import { goalCreateSchema, goalUpdateSchema, goalTransactionSchema } from '../utils/validators.js';
import { logActivity } from './historyService.js';
import { getDb } from '../database/db.js';
import * as notificationService from './notificationService.js';

export function listGoals(userId, status = null) {
  const goals = goalRepository.listForUser(userId, status);
  
  // Add calculated stats to each goal
  return goals.map(goal => {
    const stats = calculateGoalStats(goal);
    return {
      ...goal,
      stats
    };
  });
}

export function getGoalById(id, userId) {
  const goal = goalRepository.getById(id, userId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  const stats = calculateGoalStats(goal);
  return {
    ...goal,
    stats
  };
}

export function createGoal(userId, goalData) {
  const { error, value } = goalCreateSchema.validate(goalData);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  // Kiểm tra ví có tồn tại
  const wallet = walletRepository.findByIdForUser(value.walletId, userId);
  if (!wallet) {
    const err = new Error('Ví không tồn tại. Vui lòng chọn ví khác.');
    err.status = 404;
    throw err;
  }
  
  // Kiểm tra số dư ví so với mục tiêu
  const walletBalance = Number(wallet.balance);
  const targetAmount = Number(value.targetAmount);
  if (walletBalance <= 0) {
    const err = new Error(`Ví "${wallet.name}" không có tiền. Không thể tạo mục tiêu tiết kiệm.`);
    err.status = 400;
    throw err;
  }
  if (walletBalance < targetAmount) {
    const err = new Error(`Ví "${wallet.name}" chỉ có ${walletBalance.toLocaleString('vi-VN')}đ, không đủ để đặt mục tiêu ${targetAmount.toLocaleString('vi-VN')}đ. Hãy chọn mức mục tiêu thấp hơn.`);
    err.status = 400;
    throw err;
  }
  
  const goal = goalRepository.create({
    userId,
    ...value
  });
  
  const stats = calculateGoalStats(goal);
  
  // Log activity
  logActivity({
    userId,
    actionType: 'goal_created',
    entityType: 'goal',
    entityId: goal.id,
    title: 'Tạo mục tiêu tiết kiệm',
    details: `Mục tiêu: ${goal.name} | Số tiền mục tiêu: ${value.targetAmount} | Ngày hoàn thành: ${value.targetDate}`,
  });
  
  return {
    ...goal,
    stats
  };
}

export function updateGoal(id, userId, updates) {
  const { error, value } = goalUpdateSchema.validate(updates);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  const goal = goalRepository.update(id, userId, value);
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  // Update status based on progress
  const stats = calculateGoalStats(goal);
  const newStatus = determineStatus(goal, stats);
  if (newStatus !== goal.status) {
    goalRepository.update(id, userId, { status: newStatus });
  }
  
  const finalGoal = goalRepository.getById(id, userId);
  
  // Log activity
  logActivity({
    userId,
    actionType: 'goal_updated',
    entityType: 'goal',
    entityId: id,
    title: 'Cập nhật mục tiêu tiết kiệm',
    details: `Mục tiêu: ${goal.name} | Thay đổi: ${Object.keys(value).join(', ')}`,
  });
  
  return {
    ...finalGoal,
    stats
  };
}

export function deleteGoal(id, userId) {
  const goal = goalRepository.getById(id, userId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  const db = getDb();
  const run = db.transaction(() => {
    // Refund remaining balance to wallet
    if (goal.currentAmount > 0) {
      const wallet = walletRepository.findByIdForUser(goal.walletId, userId);
      if (wallet) {
        walletRepository.update(goal.walletId, userId, {
          balance: wallet.balance + goal.currentAmount
        });
      }
    }
    
    goalRepository.remove(id, userId);
  });
  run();
  
  // Log activity
  logActivity({
    userId,
    actionType: 'goal_deleted',
    entityType: 'goal',
    entityId: id,
    title: 'Xóa mục tiêu tiết kiệm',
    details: `Mục tiêu: ${goal.name} | Số tiền mục tiêu: ${goal.targetAmount} | Hoàn về ví: ${goal.currentAmount}`,
    amount: goal.currentAmount,
  });
  
  return { message: 'Goal deleted successfully', refundedAmount: goal.currentAmount };
}

export function addFunds(id, userId, transactionData) {
  const { error, value } = goalTransactionSchema.validate(transactionData);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  const goal = goalRepository.getById(id, userId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  const db = getDb();
  const result = db.transaction(() => {
    // Check wallet balance
    const wallet = walletRepository.findByIdForUser(goal.walletId, userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    if (wallet.balance < value.amount) {
      const err = new Error(`Ví "${wallet.name}" chỉ có ${wallet.balance.toLocaleString('vi-VN')}đ, không đủ để thêm ${value.amount.toLocaleString('vi-VN')}đ vào mục tiêu.`);
      err.status = 400;
      throw err;
    }
    
    // Deduct from wallet
    walletRepository.update(goal.walletId, userId, {
      balance: wallet.balance - value.amount
    });
    
    // Add to goal
    const newAmount = goal.currentAmount + value.amount;
    goalRepository.updateCurrentAmount(id, userId, newAmount);
    
    // Record transaction
    goalRepository.createTransaction({
      goalId: id,
      userId,
      walletId: goal.walletId,
      amount: value.amount,
      type: 'deposit',
      note: value.note
    });
    
    // Log activity inside transaction
    logActivity({
      userId,
      actionType: 'goal_deposit',
      entityType: 'goal',
      entityId: id,
      title: 'Thêm tiền vào mục tiêu tiết kiệm',
      details: `Mục tiêu: ${goal.name} | Số tiền: ${value.amount}${value.note ? ' | Ghi chú: ' + value.note : ''}`,
      amount: value.amount,
    });
    
    // Update status inside transaction
    const updatedGoal = goalRepository.getById(id, userId);
    const stats = calculateGoalStats(updatedGoal);
    const newStatus = determineStatus(updatedGoal, stats);
    goalRepository.update(id, userId, { status: newStatus });
    
    return { wallet, goal, updatedGoal, stats };
  })();

  // Check for progress milestones and create notifications (outside transaction as it's optional)
  checkGoalProgressNotifications(userId, result.updatedGoal, result.stats);
  
  const finalGoal = goalRepository.getById(id, userId);
  const finalStats = calculateGoalStats(finalGoal);
  return {
    ...finalGoal,
    stats: finalStats
  };
}

export function withdrawFunds(id, userId, transactionData) {
  const { error, value } = goalTransactionSchema.validate(transactionData);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  const goal = goalRepository.getById(id, userId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  if (goal.currentAmount < value.amount) {
    throw new Error('Insufficient goal balance');
  }
  
  const db = getDb();
  const result = db.transaction(() => {
    // Add to wallet
    const wallet = walletRepository.findByIdForUser(goal.walletId, userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    walletRepository.update(goal.walletId, userId, {
      balance: wallet.balance + value.amount
    });
    
    // Deduct from goal
    const newAmount = goal.currentAmount - value.amount;
    goalRepository.updateCurrentAmount(id, userId, newAmount);
    
    // Record transaction
    goalRepository.createTransaction({
      goalId: id,
      userId,
      walletId: goal.walletId,
      amount: value.amount,
      type: 'withdraw',
      note: value.note
    });
    
    // Log activity inside transaction
    logActivity({
      userId,
      actionType: 'goal_withdraw',
      entityType: 'goal',
      entityId: id,
      title: 'Rút tiền từ mục tiêu tiết kiệm',
      details: `Mục tiêu: ${goal.name} | Số tiền: ${value.amount}${value.note ? ' | Ghi chú: ' + value.note : ''}`,
      amount: value.amount,
    });
    
    // Update status inside transaction
    const updatedGoal = goalRepository.getById(id, userId);
    const stats = calculateGoalStats(updatedGoal);
    const newStatus = determineStatus(updatedGoal, stats);
    goalRepository.update(id, userId, { status: newStatus });
    
    return { wallet, goal, updatedGoal, stats };
  })();
  
  const finalGoal = goalRepository.getById(id, userId);
  const finalStats = calculateGoalStats(finalGoal);
  return {
    ...finalGoal,
    stats: finalStats
  };
}

export function getGoalTransactions(id, userId) {
  const goal = goalRepository.getById(id, userId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  
  return goalRepository.listTransactions(id, userId);
}

export function getDashboard(userId) {
  return goalRepository.getDashboard(userId);
}

export function getGoalAnalysis(userId) {
  return goalRepository.getGoalAnalysis(userId);
}

// Helper functions
function calculateGoalStats(goal) {
  const progress = goal.targetAmount > 0 
    ? (goal.currentAmount / goal.targetAmount) * 100 
    : 0;
  
  const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  
  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
  
  // Calculate required daily/monthly savings
  let dailyRequired = 0;
  let monthlyRequired = 0;
  
  if (daysRemaining > 0 && amountRemaining > 0) {
    dailyRequired = amountRemaining / daysRemaining;
    monthlyRequired = dailyRequired * 30;
  }
  
  return {
    progress: Math.min(progress, 100),
    amountRemaining,
    daysRemaining,
    dailyRequired,
    monthlyRequired
  };
}

function determineStatus(goal, stats) {
  // Chỉ báo completed khi currentAmount thực sự >= targetAmount
  if (goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0) {
    return 'completed';
  }
  
  // Chỉ báo overdue khi chưa hoàn thành và deadline đã qua
  if (stats.daysRemaining < 0) {
    return 'overdue';
  }
  
  return 'active';
}

function checkGoalProgressNotifications(userId, goal, stats) {
  const progress = stats.progress;
  const milestones = [25, 50, 75, 100];
  
  // Check each milestone individually
  for (const milestone of milestones) {
    // Check if we've just reached this milestone (within the milestone range)
    // For example, if milestone is 50%, we want to notify when progress goes from <50% to >=50%
    const milestoneRange = milestone - 5; // 5% range before the milestone
    const justReachedMilestone = progress >= milestone && progress < milestone + 5;
    
    if (justReachedMilestone) {
      // Check if we've already sent a notification for this specific milestone
      const db = getDb();
      const existingNotification = db.prepare(`
        SELECT * FROM notifications 
        WHERE userId = ? 
        AND type IN ('savings_progress', 'savings_completed')
        AND message LIKE ?
        ORDER BY createdAt DESC LIMIT 1
      `).get(userId, `%chạm mốc ${milestone}%${goal.name}%`);

      // Also check for completion notification
      const completionNotification = milestone === 100 ? db.prepare(`
        SELECT * FROM notifications 
        WHERE userId = ? 
        AND type = 'savings_completed'
        AND message LIKE ?
        ORDER BY createdAt DESC LIMIT 1
      `).get(userId, `%hoàn thành mục tiêu ${goal.name}%`) : null;

      // Only create notification if we haven't sent one for this milestone yet
      if (!existingNotification && !completionNotification) {
        if (milestone === 100) {
          notificationService.createNotification({
            userId,
            type: 'savings_completed',
            title: 'Chúc mừng!',
            message: `Bạn đã hoàn thành mục tiêu ${goal.name} (đã đạt ${Math.round(progress)}%)!`,
          });
        } else {
          notificationService.createNotification({
            userId,
            type: 'savings_progress',
            title: 'Tiến độ mục tiêu',
            message: `Bạn đã chạm mốc ${milestone}% của mục tiêu ${goal.name} (đã đạt ${Math.round(progress)}%).`,
          });
        }
      }
    }
  }
}
