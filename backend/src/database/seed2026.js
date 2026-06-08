/**
 * Seed data cho tháng 1-6 năm 2026 theo yêu cầu:
 * - Thu nhập: 14-16 triệu/tháng
 * - Ngân sách: ăn uống, tiền nhà, đi lại, chi tiêu hàng ngày, mua sắm, giáo dục, y tế
 * - Tháng nào cũng có tiết kiệm
 * - Tháng nào cũng có vượt ngân sách
 *
 * Usage:
 *   node src/database/seed2026.js                # seed cho user đầu tiên
 *   node src/database/seed2026.js --force        # xóa data cũ trước khi seed
 *   node src/database/seed2026.js --user=user@test.com
 */
import Database from 'better-sqlite3';
import path from 'path';
import { config } from '../config/index.js';

const ARGS = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { force: false, user: null };
  for (const a of argv) {
    if (a === '--force') out.force = true;
    else if (a.startsWith('--user=')) out.user = a.slice(7).trim().toLowerCase();
  }
  return out;
}

// Deterministic PRNG
function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function roundMoney(v) {
  return Math.round(v / 1000) * 1000;
}

function formatMoney(v) {
  return v.toLocaleString('vi-VN');
}

function isoAt(year, month, day, hour = 9, minute = 0) {
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return d.toISOString();
}

// Kế hoạch chi tiêu theo yêu cầu - điều chỉnh hợp lý hơn
const EXPENSE_PLAN = [
  { name: 'Ăn uống', monthly: 2_000_000, txCount: [6, 12], noteSamples: ['Cơm trưa văn phòng', 'Cà phê', 'Đi siêu thị', 'Cơm tối', 'Ăn sáng', 'Mua thực phẩm'] },
  { name: 'Tiền nhà', monthly: 2_500_000, txCount: [1, 1], noteSamples: ['Tiền thuê nhà'] },
  { name: 'Đi lại', monthly: 600_000, txCount: [3, 6], noteSamples: ['Đổ xăng', 'Vé xe buýt', 'Gửi xe', 'Bảo trì xe'] },
  { name: 'Chi tiêu hằng ngày', monthly: 800_000, txCount: [8, 15], noteSamples: ['Chi tiêu vặt', 'Đồ dùng cá nhân', 'Lặt vặt', 'Tiền lẻ'] },
  { name: 'Mua sắm', monthly: 700_000, txCount: [1, 3], noteSamples: ['Đồ gia dụng', 'Mua đồ dùng', 'Phụ kiện'] },
  { name: 'Giáo dục', monthly: 400_000, txCount: [1, 2], noteSamples: ['Mua sách', 'Khóa học', 'Tài liệu'] },
  { name: 'Y tế', monthly: 200_000, txCount: [0, 1], noteSamples: ['Mua thuốc', 'Dược phẩm'] },
];

// Kế hoạch thu nhập 14-16 triệu
const INCOME_PLAN = {
  salary: { name: 'Tiền lương', base: 12_000_000, day: 5, note: 'Lương tháng' },
  allowance: { name: 'Tiền phụ cấp', base: 800_000, day: 6, note: 'Phụ cấp' },
  bonus: { name: 'Tiền thưởng', range: [1_000_000, 2_000_000], note: 'Thưởng' },
  extra: { name: 'Thu nhập thêm', range: [500_000, 1_500_000], note: 'Việc làm thêm' },
};

function openDb() {
  const db = new Database(config.dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

function findCategoryByName(db, name, type, userId) {
  return db
    .prepare(
      `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND userId = ? LIMIT 1`
    )
    .get(name, type, userId);
}

function pickMainWallet(db, userId) {
  const wallets = db
    .prepare(
      'SELECT id, name, balance FROM wallets WHERE userId = ? AND isDeleted = 0 ORDER BY (LOWER(name) = LOWER(?)) DESC, id ASC'
    )
    .all(userId, 'Ví chính');
  return wallets[0] || null;
}

function userHasData(db, userId) {
  const tx = db.prepare('SELECT COUNT(*) c FROM transactions WHERE userId = ?').get(userId).c;
  const bg = db.prepare('SELECT COUNT(*) c FROM budgets WHERE userId = ?').get(userId).c;
  const sv = db
    .prepare('SELECT COUNT(*) c FROM savings_accounts WHERE userId = ? AND isDeleted = 0')
    .get(userId).c;
  return tx > 0 || bg > 0 || sv > 0;
}

function clearUserData(db, userId) {
  db.prepare('DELETE FROM transactions WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM budgets WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM savings_transfers WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM savings_accounts WHERE userId = ?').run(userId);
  db.prepare(
    "DELETE FROM activity_logs WHERE userId = ? AND entityType IN ('transaction','budget','savings','savings_account','savings_transfer','system')"
  ).run(userId);
  db.prepare('DELETE FROM monthly_rollovers WHERE userId = ?').run(userId);
  db.prepare(
    'UPDATE wallets SET balance = 0 WHERE userId = ? AND isDeleted = 0'
  ).run(userId);
}

function seedUser(db, user, options) {
  const rng = makeRng((user.id + 1) * 9973 + 17);
  const mainWallet = pickMainWallet(db, user.id);
  if (!mainWallet) {
    console.log(`  -> [skip] user ${user.email}: no active wallet`);
    return null;
  }

  if (options.force) {
    clearUserData(db, user.id);
  } else if (userHasData(db, user.id)) {
    console.log(`  -> [skip] user ${user.email}: already has data (use --force to overwrite)`);
    return null;
  }

  const expenseCategories = EXPENSE_PLAN.map((p) => {
    const row = findCategoryByName(db, p.name, 'expense', user.id);
    return row ? { ...p, id: row.id } : null;
  }).filter(Boolean);

  const incomeIds = {
    salary: findCategoryByName(db, INCOME_PLAN.salary.name, 'income', user.id)?.id,
    allowance: findCategoryByName(db, INCOME_PLAN.allowance.name, 'income', user.id)?.id,
    bonus: findCategoryByName(db, INCOME_PLAN.bonus.name, 'income', user.id)?.id,
    extra: findCategoryByName(db, INCOME_PLAN.extra.name, 'income', user.id)?.id,
  };

  const fallbackIncome = db
    .prepare("SELECT id FROM categories WHERE type = 'income' AND userId = ? ORDER BY id LIMIT 1")
    .get(user.id);
  Object.keys(incomeIds).forEach((k) => {
    if (!incomeIds[k] && fallbackIncome) incomeIds[k] = fallbackIncome.id;
  });

  // Create savings account
  const savingsRow = db
    .prepare('INSERT INTO savings_accounts (userId, name, balance, createdAt) VALUES (?, ?, ?, ?)')
    .run(user.id, 'Quỹ tiết kiệm', 0, isoAt(2026, 1, 1, 8));
  const savingsId = savingsRow.lastInsertRowid;

  const insertTx = db.prepare(
    `INSERT INTO transactions (userId, walletId, categoryId, type, amount, note, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertBudget = db.prepare(
    `INSERT INTO budgets (userId, categoryId, walletId, amount, month, year) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertTransfer = db.prepare(
    `INSERT INTO savings_transfers (userId, walletId, savingsId, direction, amount, note, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertActivity = db.prepare(
    `INSERT INTO activity_logs (userId, actionType, entityType, entityId, title, details, amount, occurredAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertNotification = db.prepare(
    `INSERT INTO notifications (userId, type, title, message, isRead) VALUES (?, ?, ?, ?, 0)`
  );

  const today = new Date();
  const year = 2026;
  const months = [1, 2, 3, 4, 5];
  if (today.getFullYear() === 2026 && today.getMonth() + 1 >= 6) {
    months.push(6);
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavingsDeposit = 0;
  let txCount = 0;
  let budgetCount = 0;
  let transferCount = 0;

  const run = db.transaction(() => {
    for (const month of months) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
      const lastUsableDay = isCurrentMonth ? today.getDate() : daysInMonth;

      // 1) Tạo ngân sách cho từng danh mục
      const monthlyBudgets = [];
      for (const cat of expenseCategories) {
        const variation = 1 + (rng() * 0.2 - 0.1); // +/- 10%
        const amount = roundMoney(cat.monthly * variation);
        if (amount <= 0) continue;
        insertBudget.run(user.id, cat.id, mainWallet.id, amount, month, year);
        budgetCount += 1;
        monthlyBudgets.push({ ...cat, plannedAmount: amount });
      }

      // 2) Thu nhập: 14-16 triệu
      const targetIncome = 14_000_000 + Math.floor(rng() * 2_000_001); // 14M-16M
      let monthIncome = 0;

      // Lương cơ bản
      const salaryDay = Math.min(INCOME_PLAN.salary.day, lastUsableDay);
      if (salaryDay >= 1) {
        const salaryAmount = roundMoney(INCOME_PLAN.salary.base * (1 + (rng() * 0.1 - 0.05)));
        insertTx.run(
          user.id,
          mainWallet.id,
          incomeIds.salary,
          'income',
          salaryAmount,
          INCOME_PLAN.salary.note + ` ${month}/${year}`,
          isoAt(year, month, salaryDay, 9, 0)
        );
        totalIncome += salaryAmount;
        monthIncome += salaryAmount;
        txCount += 1;
      }

      // Phụ cấp
      const allowanceDay = Math.min(INCOME_PLAN.allowance.day, lastUsableDay);
      if (allowanceDay >= 1) {
        const allowanceAmount = roundMoney(INCOME_PLAN.allowance.base * (1 + (rng() * 0.2 - 0.1)));
        insertTx.run(
          user.id,
          mainWallet.id,
          incomeIds.allowance,
          'income',
          allowanceAmount,
          INCOME_PLAN.allowance.note,
          isoAt(year, month, allowanceDay, 10, 0)
        );
        totalIncome += allowanceAmount;
        monthIncome += allowanceAmount;
        txCount += 1;
      }

      // Thêm thu nhập phụ để đạt 14-16 triệu
      const deficit = targetIncome - monthIncome;
      if (deficit > 0 && lastUsableDay >= 10) {
        const extraAmount = roundMoney(Math.min(deficit, randInt(rng, INCOME_PLAN.extra.range[0], INCOME_PLAN.extra.range[1])));
        if (extraAmount > 0) {
          insertTx.run(
            user.id,
            mainWallet.id,
            incomeIds.extra,
            'income',
            extraAmount,
            INCOME_PLAN.extra.note,
            isoAt(year, month, 15, 11, 0)
          );
          totalIncome += extraAmount;
          monthIncome += extraAmount;
          txCount += 1;
        }
      }

      // Thưởng ngẫu nhiên (30% các tháng)
      if (rng() < 0.3 && lastUsableDay >= 20) {
        const bonusAmount = roundMoney(randInt(rng, INCOME_PLAN.bonus.range[0], INCOME_PLAN.bonus.range[1]));
        insertTx.run(
          user.id,
          mainWallet.id,
          incomeIds.bonus,
          'income',
          bonusAmount,
          INCOME_PLAN.bonus.note,
          isoAt(year, month, 20, 14, 0)
        );
        totalIncome += bonusAmount;
        monthIncome += bonusAmount;
        txCount += 1;
      }

      // 3) Chi tiêu - Điều chỉnh hợp lý hơn
      const dailyExpenses = new Map();
      
      // Tháng 6 chỉ tiêu 35-40% ngân sách (vì mới 8 ngày)
      const isJune = month === 6;
      const juneMultiplier = isJune ? 0.35 + rng() * 0.05 : 1.0; // 35-40% cho tháng 6
      
      // Chỉ vượt ngân sách ở 1-2 danh mục, và không vượt quá 120%
      const categoriesToExceed = pick(rng, monthlyBudgets.slice(0, 2));

      for (const b of monthlyBudgets) {
        const shouldExceed = categoriesToExceed.id === b.id;
        // Vượt ngân sách: 105-120%, bình thường: 60-90%
        let usagePct = shouldExceed 
          ? 1.05 + rng() * 0.15 
          : 0.6 + rng() * 0.3;
        
        // Áp dụng multiplier cho tháng 6
        usagePct *= juneMultiplier;
        
        const target = roundMoney(b.plannedAmount * usagePct);
        const minCount = b.txCount[0];
        const maxCount = b.txCount[1];
        let txN = randInt(rng, minCount, maxCount);
        if (txN <= 0) continue;

        if (isCurrentMonth && lastUsableDay < daysInMonth) {
          txN = Math.max(1, Math.round(txN * (lastUsableDay / daysInMonth)));
        }

        let spent = 0;
        for (let k = 0; k < txN; k += 1) {
          const remainingSlots = txN - k;
          const remainingBudget = target - spent;
          if (remainingBudget <= 0) break;
          let amt;
          if (k === txN - 1) {
            amt = remainingBudget;
          } else {
            const avg = remainingBudget / remainingSlots;
            amt = avg * (0.6 + rng() * 0.8);
          }
          amt = roundMoney(amt);
          if (amt <= 0) amt = 1000;
          if (spent + amt > target) amt = target - spent;
          if (amt <= 0) break;

          const day = randInt(rng, 1, lastUsableDay);
          const hour = randInt(rng, 7, 21);
          const minute = randInt(rng, 0, 59);
          const note = pick(rng, b.noteSamples);

          if (!dailyExpenses.has(day)) {
            dailyExpenses.set(day, []);
          }
          dailyExpenses.get(day).push({
            categoryId: b.id,
            amount: amt,
            note,
            day,
            hour,
            minute,
          });

          spent += amt;
          totalExpense += amt;
          txCount += 1;
        }
      }

      // Insert transactions theo ngày
      for (let day = 1; day <= lastUsableDay; day++) {
        if (!dailyExpenses.has(day) || dailyExpenses.get(day).length === 0) {
          // Tạo giao dịch nhỏ cho ngày không có
          const randomCategory = pick(rng, expenseCategories);
          const amount = roundMoney(50000 + rng() * 100000);
          const hour = randInt(rng, 9, 18);
          const minute = randInt(rng, 0, 59);
          const note = 'Chi tiêu vặt';

          insertTx.run(
            user.id,
            mainWallet.id,
            randomCategory.id,
            'expense',
            amount,
            note,
            isoAt(year, month, day, hour, minute)
          );
          totalExpense += amount;
          txCount += 1;
        } else {
          for (const tx of dailyExpenses.get(day)) {
            insertTx.run(
              user.id,
              mainWallet.id,
              tx.categoryId,
              'expense',
              tx.amount,
              tx.note,
              isoAt(year, month, tx.day, tx.hour, tx.minute)
            );
          }
        }
      }

      // 4) Tạo notifications cho cảnh báo ngân sách
      for (const b of monthlyBudgets) {
        const spent = db
          .prepare(
            `SELECT COALESCE(SUM(amount), 0) AS s FROM transactions
             WHERE userId = ? AND categoryId = ? AND type = 'expense'
               AND CAST(strftime('%m', date) AS INTEGER) = ?
               AND CAST(strftime('%Y', date) AS INTEGER) = ?`
          )
          .get(user.id, b.id, month, year).s;
        const spentAmount = Number(spent || 0);
        const usagePct = (spentAmount / b.plannedAmount) * 100;

        // Cảnh báo khi vượt ngân sách
        if (usagePct > 100) {
          insertNotification.run(
            user.id,
            'budget_exceeded',
            `Vượt ngân sách: ${b.name}`,
            `Bạn đã tiêu ${usagePct.toFixed(0)}% ngân sách ${b.name} (${formatMoney(spentAmount)} / ${formatMoney(b.plannedAmount)})`
          );
        }
        // Cảnh báo khi gần vượt ngân sách (>80%)
        else if (usagePct > 80) {
          insertNotification.run(
            user.id,
            'budget_warning',
            `Gần hết ngân sách: ${b.name}`,
            `Bạn đã tiêu ${usagePct.toFixed(0)}% ngân sách ${b.name} (${formatMoney(spentAmount)} / ${formatMoney(b.plannedAmount)})`
          );
        }
      }

      // 5) Tiết kiệm hàng tháng (20-30% thu nhập)
      if (lastUsableDay >= 7) {
        const savingsRatio = 0.2 + rng() * 0.1; // 20-30%
        const depositAmount = roundMoney(monthIncome * savingsRatio);
        if (depositAmount >= 300_000) {
          const depositDay = Math.min(7 + randInt(rng, 0, 5), lastUsableDay);
          insertTransfer.run(
            user.id,
            mainWallet.id,
            savingsId,
            'deposit',
            depositAmount,
            'Gửi tiết kiệm hàng tháng',
            isoAt(year, month, depositDay, 17, 0)
          );
          totalSavingsDeposit += depositAmount;
          transferCount += 1;

          // Tạo notification cho tiến độ tiết kiệm
          insertNotification.run(
            user.id,
            'savings_progress',
            'Tiết kiệm tháng này',
            `Bạn đã gửi ${formatMoney(depositAmount)} vào quỹ tiết kiệm (${Math.round(savingsRatio * 100)}% thu nhập)`
          );
        }
      }

      // 5) Chốt tháng (chỉ tháng đã kết thúc)
      if (!isCurrentMonth) {
        insertActivity.run(
          user.id,
          'monthly_rollover',
          'system',
          null,
          `Đã chốt dữ liệu tháng ${month}/${year}`,
          'Dữ liệu tháng đã được lưu vào lịch sử.',
          null,
          isoAt(year, month, daysInMonth, 23, 59)
        );
        db.prepare(
          `INSERT OR IGNORE INTO monthly_rollovers (userId, year, month, rolledAt) VALUES (?, ?, ?, ?)`
        ).run(user.id, year, month, isoAt(year, month, daysInMonth, 23, 59));
      }
    }

    // Cập nhật số dư
    const netCash = totalIncome - totalExpense - totalSavingsDeposit;
    db.prepare('UPDATE wallets SET balance = ? WHERE id = ? AND userId = ?').run(
      Math.max(0, roundMoney(netCash)),
      mainWallet.id,
      user.id
    );

    db.prepare(
      'UPDATE savings_accounts SET balance = ? WHERE id = ? AND userId = ?'
    ).run(Math.max(0, totalSavingsDeposit), savingsId, user.id);
  });

  run();

  return {
    email: user.email,
    txCount,
    budgetCount,
    transferCount,
    totalIncome,
    totalExpense,
    totalSavings: totalSavingsDeposit,
    walletId: mainWallet.id,
  };
}

function listTargetUsers(db) {
  if (ARGS.user) {
    const u = db
      .prepare(
        'SELECT id, name, email FROM users WHERE LOWER(email) = ? AND isDeleted = 0'
      )
      .get(ARGS.user);
    return u ? [u] : [];
  }
  return db
    .prepare(
      `SELECT id, name, email FROM users
       WHERE isDeleted = 0
       ORDER BY id ASC`
    )
    .all();
}

export function runSeed() {
  console.log('--- Seeding 2026 data (months 1-6) ---');
  console.log(`DB: ${config.dbPath}`);
  console.log(`Force: ${ARGS.force}, User: ${ARGS.user || '(all)'}`);

  const db = openDb();
  const users = listTargetUsers(db);

  if (users.length === 0) {
    console.log('No matching users found.');
    db.close();
    return;
  }

  const results = [];
  for (const u of users) {
    console.log(`Processing user #${u.id} <${u.email}>`);
    try {
      const summary = seedUser(db, u, { force: ARGS.force });
      if (summary) results.push(summary);
    } catch (err) {
      console.error(`  -> ERROR for ${u.email}:`, err.message);
    }
  }

  db.close();

  console.log('\n--- Summary ---');
  if (results.length === 0) {
    console.log('No users were seeded.');
    return;
  }
  for (const r of results) {
    console.log(
      `${r.email}: ${r.txCount} tx, ${r.budgetCount} budgets, ${r.transferCount} transfers | thu nhập=${r.totalIncome.toLocaleString()} VND, chi=${r.totalExpense.toLocaleString()} VND, tiết kiệm=${r.totalSavings.toLocaleString()} VND`
    );
  }
  console.log('Done.');
}

const invokedPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
if (invokedPath && import.meta.url.endsWith(invokedPath.split('/').pop())) {
  runSeed();
}

export default runSeed;
