/**
 * Seed historical demo data (transactions, budgets, savings) for the past ~24 months.
 *
 * Usage:
 *   node src/database/seedHistorical.js                # seed all eligible users (skip if data exists)
 *   node src/database/seedHistorical.js --force        # clear existing tx/budgets/savings first
 *   node src/database/seedHistorical.js --user=user@test.com
 *   node src/database/seedHistorical.js --months=24
 *
 * Notes:
 *  - Uses modern financial model: budgets are plans only, don't deduct from wallet
 *  - Expenses deduct directly from wallet
 *  - No refund transactions when budgets are deleted/rolled over
 *  - Wallet balance = income - expense - net savings deposits
 */
import Database from 'better-sqlite3';
import path from 'path';
import { config } from '../config/index.js';

const ARGS = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { force: false, user: null, months: 24 };
  for (const a of argv) {
    if (a === '--force') out.force = true;
    else if (a.startsWith('--user=')) out.user = a.slice(7).trim().toLowerCase();
    else if (a.startsWith('--months=')) out.months = Math.max(1, Number(a.slice(9)) || 24);
  }
  return out;
}

// Deterministic PRNG so reruns produce the same dataset.
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
  return Math.round(v / 1000) * 1000; // round to nearest 1,000 VND
}

function isoAt(year, month, day, hour = 9, minute = 0) {
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return d.toISOString();
}

function monthsBetween(start, end) {
  const list = [];
  let y = start.getFullYear();
  let m = start.getMonth() + 1;
  const endY = end.getFullYear();
  const endM = end.getMonth() + 1;
  while (y < endY || (y === endY && m <= endM)) {
    list.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return list;
}

// Category ids must match the seeded preset categories in db.js.
// We resolve them by name at runtime to stay robust.
// Persona: thu nhập tổng 15–20 triệu/tháng, chi tiêu dè xẻn, ưu tiên tiết kiệm.
// Lương cơ bản 12–14tr, phụ cấp ~600k, side income 1–2tr xuất hiện ~40% số tháng,
// thưởng nhỏ 2–3tr mỗi 6 tháng. Tổng chi mục tiêu ~9–10tr (≈55% thu nhập), phần còn lại gửi tiết kiệm.
const EXPENSE_PLAN = [
  { name: 'Ăn uống', monthly: 2_400_000, txCount: [6, 12], noteSamples: ['Cơm trưa văn phòng', 'Cà phê tự pha', 'Đi siêu thị', 'Cơm tối ở nhà', 'Ăn sáng đơn giản', 'Mua thực phẩm', 'Ăn cùng đồng nghiệp'] },
  { name: 'Đi lại', monthly: 750_000, txCount: [3, 7], noteSamples: ['Đổ xăng', 'Vé xe buýt', 'Gửi xe', 'Bảo trì xe nhỏ'] },
  { name: 'Tiền nhà', monthly: 2_500_000, txCount: [1, 1], noteSamples: ['Tiền thuê phòng trọ'] },
  { name: 'Tiền điện', monthly: 500_000, txCount: [1, 2], noteSamples: ['Hoá đơn điện', 'Hoá đơn nước'] },
  { name: 'Phí liên lạc', monthly: 250_000, txCount: [1, 2], noteSamples: ['Cước điện thoại', 'Gói cước internet'] },
  { name: 'Mua sắm', monthly: 500_000, txCount: [1, 3], noteSamples: ['Đồ gia dụng cơ bản', 'Mua đồ dùng', 'Phụ kiện nhỏ'] },
  { name: 'Quần áo', monthly: 220_000, txCount: [0, 1], noteSamples: ['Mua áo cơ bản', 'Đồ mặc nhà'] },
  { name: 'Giải trí', monthly: 380_000, txCount: [1, 3], noteSamples: ['Netflix chia sẻ', 'Cà phê cuối tuần', 'Đi dạo, xem phim'] },
  { name: 'Y tế', monthly: 180_000, txCount: [0, 1], noteSamples: ['Mua thuốc cơ bản', 'Khám sức khoẻ định kỳ'] },
  { name: 'Giáo dục', monthly: 280_000, txCount: [0, 2], noteSamples: ['Mua sách', 'Tài liệu học tập'] },
  { name: 'Chi tiêu hằng ngày', monthly: 650_000, txCount: [4, 10], noteSamples: ['Chi tiêu vặt', 'Đồ dùng cá nhân', 'Lặt vặt', 'Tiền lẻ'] },
  { name: 'Hóa đơn', monthly: 280_000, txCount: [1, 2], noteSamples: ['Hoá đơn dịch vụ', 'Phí quản lý chung cư'] },
];

const INCOME_PLAN = {
  salary: { name: 'Tiền lương', monthly: 13_000_000, day: 5, note: 'Lương tháng' },
  allowance: { name: 'Tiền phụ cấp', monthly: 600_000, day: 6, note: 'Phụ cấp ăn trưa' },
  // Bonus và side income chỉ xuất hiện một số tháng
  bonus: { name: 'Tiền thưởng', amountRange: [1_800_000, 3_000_000], note: 'Thưởng quý' },
  side: { name: 'Thu nhập thêm', amountRange: [800_000, 1_800_000], note: 'Việc làm thêm cuối tuần' },
  invest: { name: 'Đầu tư', amountRange: [200_000, 700_000], note: 'Lãi tiết kiệm/đầu tư nhỏ' },
};

function openDb() {
  const db = new Database(config.dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

function findCategoryByName(db, name, type) {
  return db
    .prepare(
      `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? LIMIT 1`
    )
    .get(name, type);
}

function ensureRefundCategory(db) {
  let row = findCategoryByName(db, 'Tiền hoàn', 'income');
  if (!row) {
    const r = db
      .prepare('INSERT INTO categories (name, type) VALUES (?, ?)')
      .run('Tiền hoàn', 'income');
    row = { id: r.lastInsertRowid };
  }
  return row.id;
}

function refundLastDayIso(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  return isoAt(year, month, lastDay, 23, 55);
}

function pickMainWallet(db, userId) {
  const wallets = db
    .prepare(
      'SELECT id, name, balance FROM wallets WHERE userId = ? AND isDeleted = 0 ORDER BY (LOWER(name) = LOWER(?)) DESC, id ASC'
    )
    .all(userId, 'Ví chính');
  return wallets[0] || null;
}

function pickCashWallet(db, userId, excludeId) {
  return (
    db
      .prepare(
        `SELECT id, name, balance FROM wallets
         WHERE userId = ? AND isDeleted = 0 AND id != ?
         ORDER BY (LOWER(name) = LOWER(?)) DESC, id ASC`
      )
      .get(userId, excludeId, 'Ví tiền mặt') || null
  );
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
  const cashWallet = pickCashWallet(db, user.id, mainWallet.id);

  if (options.force) {
    clearUserData(db, user.id);
  } else if (userHasData(db, user.id)) {
    console.log(`  -> [skip] user ${user.email}: already has data (use --force to overwrite)`);
    return null;
  }

  const expenseCategories = EXPENSE_PLAN.map((p) => {
    const row = findCategoryByName(db, p.name, 'expense');
    return row ? { ...p, id: row.id } : null;
  }).filter(Boolean);

  const incomeIds = {
    salary: findCategoryByName(db, INCOME_PLAN.salary.name, 'income')?.id,
    allowance: findCategoryByName(db, INCOME_PLAN.allowance.name, 'income')?.id,
    bonus: findCategoryByName(db, INCOME_PLAN.bonus.name, 'income')?.id,
    side: findCategoryByName(db, INCOME_PLAN.side.name, 'income')?.id,
    invest: findCategoryByName(db, INCOME_PLAN.invest.name, 'income')?.id,
  };

  // Make sure essential income categories exist (fallback to whatever income category is available).
  const fallbackIncome = db
    .prepare("SELECT id FROM categories WHERE type = 'income' ORDER BY id LIMIT 1")
    .get();
  Object.keys(incomeIds).forEach((k) => {
    if (!incomeIds[k] && fallbackIncome) incomeIds[k] = fallbackIncome.id;
  });

  const refundCategoryId = ensureRefundCategory(db);

  // Create one savings account per user.
  const savingsRow = db
    .prepare('INSERT INTO savings_accounts (userId, name, balance, createdAt) VALUES (?, ?, ?, ?)')
    .run(user.id, 'Quỹ tiết kiệm', 0, isoAt(2024, 1, 1, 8));
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

  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1); // Đầu năm hiện tại
  const monthList = monthsBetween(startDate, today);

  let totalIncome = 0; // tổng toàn bộ income transactions (bao gồm cả refund)
  let totalRefund = 0; // tách riêng refund để tính số dư ví cuối cùng cho chính xác
  let totalExpense = 0;
  let totalSavingsDeposit = 0;
  let totalSavingsWithdraw = 0;
  let txCount = 0;
  let budgetCount = 0;
  let transferCount = 0;
  let refundCount = 0;

  const run = db.transaction(() => {
    for (let mi = 0; mi < monthList.length; mi += 1) {
      const { year, month } = monthList[mi];
      const daysInMonth = new Date(year, month, 0).getDate();
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
      const lastUsableDay = isCurrentMonth ? today.getDate() : daysInMonth;

      // 1) Budgets for this month/year on the main wallet (modern model: plans only, no wallet deduction)
      const monthlyBudgets = [];
      for (const cat of expenseCategories) {
        const variation = 1 + (rng() * 0.3 - 0.15); // +/- 15%
        const amount = roundMoney(cat.monthly * variation);
        if (amount <= 0) continue;
        insertBudget.run(user.id, cat.id, mainWallet.id, amount, month, year);
        budgetCount += 1;
        monthlyBudgets.push({ ...cat, plannedAmount: amount });
      }

      // 2) Income transactions.
      // Mục tiêu tổng thu tháng: 15–20 triệu (bao gồm các khoản phụ).
      const targetMonthIncome = 15_000_000 + Math.floor(rng() * 5_000_001); // 15M..20M
      let monthIncome = 0;

      const salaryDay = Math.min(INCOME_PLAN.salary.day, lastUsableDay);
      if (salaryDay >= 1) {
        // Lương cơ bản dao động nhẹ quanh 13tr (±10%) — chừa dư địa cho thu nhập phụ.
        const salaryAmount = roundMoney(
          INCOME_PLAN.salary.monthly * (1 + (rng() * 0.2 - 0.1))
        );
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

      const allowanceDay = Math.min(INCOME_PLAN.allowance.day, lastUsableDay);
      if (allowanceDay >= 1 && rng() < 0.9) {
        const allowanceAmount = roundMoney(
          INCOME_PLAN.allowance.monthly * (1 + (rng() * 0.3 - 0.15))
        );
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

      // Thưởng quý: tháng 3,6,9,12 (xác suất 60%) với khoản nhỏ phù hợp mức lương trung bình.
      if ([3, 6, 9, 12].includes(month) && rng() < 0.6 && lastUsableDay >= 20) {
        const bonusAmount = roundMoney(
          randInt(rng, INCOME_PLAN.bonus.amountRange[0], INCOME_PLAN.bonus.amountRange[1])
        );
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

      // Bổ sung thu nhập phụ để đưa tổng tháng vào dải 15–20 triệu.
      // - Bước 1 (bắt buộc): nếu chưa đạt sàn 15tr, ép buộc thêm side income đến khi đạt.
      // - Bước 2 (tùy ý): có thể thêm 1 khoản nữa hướng tới mục tiêu, không vượt 20tr.
      const MIN_FLOOR = 15_000_000;
      const MAX_CEIL = 20_000_000;
      let sidePayouts = 0;

      const addSide = (amount) => {
        const rounded = roundMoney(amount);
        if (rounded <= 0) return 0;
        const baseDay = lastUsableDay >= 12 ? 12 : 7;
        const day = Math.min(baseDay + sidePayouts * 4 + randInt(rng, 0, 4), lastUsableDay);
        insertTx.run(
          user.id,
          mainWallet.id,
          incomeIds.side,
          'income',
          rounded,
          INCOME_PLAN.side.note,
          isoAt(year, month, day, 11, 0)
        );
        totalIncome += rounded;
        monthIncome += rounded;
        sidePayouts += 1;
        txCount += 1;
        return rounded;
      };

      // Bước 1: đảm bảo đạt 15tr (đủ cả với tháng hiện tại đang dở nếu đã qua ngày 7).
      while (monthIncome < MIN_FLOOR && sidePayouts < 3 && lastUsableDay >= 7) {
        const deficit = MIN_FLOOR - monthIncome;
        // Mỗi khoản 800k–1.8tr; nếu thiếu nhiều hơn 1 khoản tối đa thì cứ chia nhỏ.
        const minPay = Math.min(INCOME_PLAN.side.amountRange[0], deficit);
        const maxPay = Math.min(
          INCOME_PLAN.side.amountRange[1],
          Math.max(deficit, INCOME_PLAN.side.amountRange[0])
        );
        addSide(randInt(rng, minPay, maxPay));
      }

      // Bước 2: tùy ý thêm khoản nữa hướng tới target, không vượt 20tr.
      const headroomToCeil = MAX_CEIL - monthIncome;
      if (
        sidePayouts < 2 &&
        monthIncome < targetMonthIncome &&
        headroomToCeil >= INCOME_PLAN.side.amountRange[0] &&
        lastUsableDay >= 14 &&
        rng() < 0.55
      ) {
        const maxPay = Math.min(
          INCOME_PLAN.side.amountRange[1],
          headroomToCeil,
          targetMonthIncome - monthIncome
        );
        const minPay = Math.min(INCOME_PLAN.side.amountRange[0], maxPay);
        if (maxPay >= minPay && maxPay > 0) addSide(randInt(rng, minPay, maxPay));
      }

      // Đôi khi có lãi tiết kiệm/đầu tư nhỏ (~20% số tháng).
      if (rng() < 0.2 && lastUsableDay >= 25) {
        const investAmount = roundMoney(
          randInt(rng, INCOME_PLAN.invest.amountRange[0], INCOME_PLAN.invest.amountRange[1])
        );
        insertTx.run(
          user.id,
          mainWallet.id,
          incomeIds.invest,
          'income',
          investAmount,
          INCOME_PLAN.invest.note,
          isoAt(year, month, Math.min(25, lastUsableDay), 16, 0)
        );
        totalIncome += investAmount;
        monthIncome += investAmount;
        txCount += 1;
      }

      // 3) Expense transactions per category, staying within budget.
      // Đảm bảo mỗi ngày đều có ít nhất một giao dịch
      const dailyExpenses = new Map(); // Map ngày -> danh sách giao dịch
      for (const b of monthlyBudgets) {
        const usagePct = b.name === 'Tiền nhà'
          ? 0.95 + rng() * 0.05
          : 0.45 + rng() * 0.3;
        const target = roundMoney(b.plannedAmount * usagePct);
        const minCount = b.txCount[0];
        const maxCount = b.txCount[1];
        let txN = randInt(rng, minCount, maxCount);
        if (txN <= 0) continue;
        // Tighten count if current month not finished.
        if (isCurrentMonth && lastUsableDay < daysInMonth) {
          txN = Math.max(1, Math.round(txN * (lastUsableDay / daysInMonth)));
        }

        let spent = 0;
        const wallet = pickWalletForExpense(rng, mainWallet, cashWallet, b);
        for (let k = 0; k < txN; k += 1) {
          // Random share weights
          const remainingSlots = txN - k;
          const remainingBudget = target - spent;
          if (remainingBudget <= 0) break;
          let amt;
          if (k === txN - 1) {
            amt = remainingBudget;
          } else {
            // share between 60% and 140% of equal split
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

          // Thêm vào danh sách giao dịch theo ngày
          if (!dailyExpenses.has(day)) {
            dailyExpenses.set(day, []);
          }
          dailyExpenses.get(day).push({
            walletId: wallet.id,
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

      // Đảm bảo mỗi ngày đều có ít nhất một giao dịch
      for (let day = 1; day <= lastUsableDay; day++) {
        if (!dailyExpenses.has(day) || dailyExpenses.get(day).length === 0) {
          // Tạo một giao dịch nhỏ cho ngày không có giao dịch
          const randomCategory = pick(rng, expenseCategories);
          const wallet = pickWalletForExpense(rng, mainWallet, cashWallet, randomCategory);
          const amount = roundMoney(50000 + rng() * 100000); // 50k - 150k
          const hour = randInt(rng, 9, 18);
          const minute = randInt(rng, 0, 59);
          const note = 'Chi tiêu hàng ngày';

          insertTx.run(
            user.id,
            wallet.id,
            randomCategory.id,
            'expense',
            amount,
            note,
            isoAt(year, month, day, hour, minute)
          );
          totalExpense += amount;
          txCount += 1;
        } else {
          // Insert các giao dịch đã tạo cho ngày này
          for (const tx of dailyExpenses.get(day)) {
            insertTx.run(
              user.id,
              tx.walletId,
              tx.categoryId,
              'expense',
              tx.amount,
              tx.note,
              isoAt(year, month, tx.day, tx.hour, tx.minute)
            );
          }
        }
      }

      // 3b) Theo dõi đã chi của từng ngân sách (dùng để refund cuối tháng).
      const monthlyBudgetSpent = new Map();
      for (const b of monthlyBudgets) {
        const spent = db
          .prepare(
            `SELECT COALESCE(SUM(amount), 0) AS s FROM transactions
             WHERE userId = ? AND categoryId = ? AND type = 'expense'
               AND CAST(strftime('%m', date) AS INTEGER) = ?
               AND CAST(strftime('%Y', date) AS INTEGER) = ?`
          )
          .get(user.id, b.id, month, year).s;
        monthlyBudgetSpent.set(b.id, Number(spent || 0));
      }

      // 4) Tiết kiệm: gửi đều mỗi tháng một phần đáng kể của số dư sau chi tiêu.
      // Mục tiêu giữ tiết kiệm chiếm 35–50% thu nhập tháng.
      if (lastUsableDay >= 7) {
        const targetRatio = 0.35 + rng() * 0.15; // 35–50%
        const depositAmount = roundMoney(monthIncome * targetRatio);
        if (depositAmount >= 500_000) {
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
        }
      }
      // Hiếm khi rút tiết kiệm và số tiền rút nhỏ — phản ánh thói quen dè xẻn.
      if (rng() < 0.08 && lastUsableDay >= 20) {
        const withdrawAmount = roundMoney(400_000 + rng() * 1_000_000);
        insertTransfer.run(
          user.id,
          mainWallet.id,
          savingsId,
          'withdraw',
          withdrawAmount,
          'Rút tiết kiệm cho nhu cầu phát sinh',
          isoAt(year, month, Math.min(22 + randInt(rng, 0, 5), lastUsableDay), 15, 0)
        );
        totalSavingsWithdraw += withdrawAmount;
        transferCount += 1;
      }

      // 5) Cuối tháng (chỉ áp dụng cho tháng đã kết thúc): modern model - no refund, just log
      if (!isCurrentMonth) {
        // Activity log: chốt tháng + đánh dấu monthly_rollover
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

    // Số dư ví cuối cùng = thu nhập - chi tiêu - tiết kiệm thuần (modern financial model)
    const netCash =
      totalIncome - totalExpense - (totalSavingsDeposit - totalSavingsWithdraw);
    db.prepare('UPDATE wallets SET balance = ? WHERE id = ? AND userId = ?').run(
      Math.max(0, roundMoney(netCash)),
      mainWallet.id,
      user.id
    );

    // Savings account balance reflects net deposits.
    db.prepare(
      'UPDATE savings_accounts SET balance = ? WHERE id = ? AND userId = ?'
    ).run(Math.max(0, totalSavingsDeposit - totalSavingsWithdraw), savingsId, user.id);
  });

  run();

  return {
    email: user.email,
    txCount,
    budgetCount,
    transferCount,
    refundCount,
    totalIncome,
    totalRefund,
    totalExpense,
    netSavings: totalSavingsDeposit - totalSavingsWithdraw,
    walletId: mainWallet.id,
  };
}

function pickWalletForExpense(rng, mainWallet, cashWallet, budget) {
  // Budget is linked to mainWallet, so all expenses must use that wallet for consistency
  // with how the dashboard/budget service checks (transaction.walletId === budget.walletId).
  return mainWallet;
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
  console.log('--- Seeding historical data ---');
  console.log(`DB: ${config.dbPath}`);
  console.log(`Months: ${ARGS.months}, Force: ${ARGS.force}, User: ${ARGS.user || '(all)'}`);

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
      const summary = seedUser(db, u, { force: ARGS.force, months: ARGS.months });
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
      `${r.email}: ${r.txCount} tx, ${r.budgetCount} budgets, ${r.transferCount} transfers | thu nhập=${r.totalIncome.toLocaleString()} VND, chi=${r.totalExpense.toLocaleString()} VND, tiết kiệm=${r.netSavings.toLocaleString()} VND`
    );
  }
  console.log('Done.');
}

const invokedPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
if (invokedPath && import.meta.url.endsWith(invokedPath.split('/').pop())) {
  runSeed();
}

export default runSeed;
