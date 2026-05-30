import { useEffect, useMemo, useState } from 'react';
import { Plus, AlertCircle, Lock, Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import {
  formatNumberInput,
  formatVND,
  nowLocalDateTime,
  unformatNumberInput,
} from '../utils/format.js';

const CATEGORY_EMOJI = {
  'Ăn uống': '🍽️',
  'Chi tiêu hằng ngày': '🛒',
  'Quần áo': '👕',
  'Mỹ phẩm': '💄',
  'Giáo dục': '📚',
  'Phí giao lưu': '🎉',
  'Y tế': '💊',
  'Tiền điện': '💡',
  'Đi lại': '🚆',
  'Phí liên lạc': '📱',
  'Tiền nhà': '🏠',
  Lương: '💼',
  Thưởng: '🎁',
  'Tiền hoàn': '↩️',
};
const EXPENSE_CATEGORY_ORDER = [
  'Ăn uống',
  'Chi tiêu hằng ngày',
  'Quần áo',
  'Mỹ phẩm',
  'Giáo dục',
  'Phí giao lưu',
  'Y tế',
  'Tiền điện',
  'Đi lại',
  'Phí liên lạc',
  'Tiền nhà',
];
const INCOME_CATEGORY_ORDER = [
  'Tiền lương',
  'Tiền phụ cấp',
  'Tiền thưởng',
  'Thu nhập thêm',
  'Đầu tư',
  'Thu nhập khác',
  'Tiền hoàn',
];

function toLocalDateKey(value) {
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialTransactionForm = {
  walletId: '',
  categoryId: '',
  type: 'expense',
  amount: '',
  note: '',
  date: nowLocalDateTime(),
};

export function Transactions() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [monthTransactions, setMonthTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [open, setOpen] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(initialTransactionForm);
  const [err, setErr] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const load = async (p = page) => {
    const [monthYear, monthPart] = calendarMonth.split('-');
    const dateFrom = `${monthYear}-${monthPart}-01`;
    const dateTo = `${monthYear}-${monthPart}-${new Date(
      Number(monthYear),
      Number(monthPart),
      0
    )
      .getDate()
      .toString()
      .padStart(2, '0')}`;
    const params = {
      page: Number(p),
      limit: Number(15),
      dateFrom,
      dateTo,
    };
    console.log("TRANSACTIONS - LOAD PARAMS:", params);
    const { data } = await api.get('/transactions', { params });
    setRows(data.rows || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
  };

  const loadMonthTransactions = async () => {
    const [yearPart, monthPart] = calendarMonth.split('-');
    const monthStart = `${yearPart}-${monthPart}-01`;
    const monthEnd = `${yearPart}-${monthPart}-${new Date(
      Number(yearPart),
      Number(monthPart),
      0
    )
      .getDate()
      .toString()
      .padStart(2, '0')}`;

    let currentPage = 1;
    let fetched = [];
    let totalRows = 0;
    do {
      const params = {
        page: Number(currentPage),
        limit: Number(100),
        dateFrom: monthStart,
        dateTo: monthEnd,
      };
      console.log(`TRANSACTIONS - LOAD MONTH PARAMS (page ${currentPage}):`, params);
      const { data } = await api.get('/transactions', { params });
      const rows = data.rows || [];
      totalRows = data.total || 0;
      fetched = fetched.concat(rows);
      currentPage += 1;
    } while (fetched.length < totalRows && currentPage <= 20);

    setMonthTransactions(fetched);
  };

  useEffect(() => {
    (async () => {
      const [cats, w, b] = await Promise.all([
        api.get('/categories'),
        api.get('/wallets'),
        api.get('/budgets'),
      ]);
      setCategories(cats.data || []);
      setWallets(w.data || []);
      setBudgets(b.data || []);
    })();
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth]);

  useEffect(() => {
    loadMonthTransactions();
    const [yearPart, monthPart] = calendarMonth.split('-');
    const day = selectedDate.split('-')[2] || '01';
    const maxDay = new Date(Number(yearPart), Number(monthPart), 0).getDate();
    const safeDay = String(Math.min(Number(day), maxDay)).padStart(2, '0');
    setSelectedDate(`${yearPart}-${monthPart}-${safeDay}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth]);

  const handleDelete = async (tx) => {
    setDeleteConfirm(tx);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/transactions/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      const [w, b] = await Promise.all([api.get('/wallets'), api.get('/budgets')]);
      setWallets(w.data || []);
      setBudgets(b.data || []);
      load(page);
      loadMonthTransactions();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể xóa giao dịch');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const amount = Number(unformatNumberInput(form.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr('Số tiền phải lớn hơn 0');
      return;
    }
    if (!form.categoryId) {
      setErr('Vui lòng chọn danh mục');
      return;
    }
    if (!form.date) {
      setErr('Vui lòng chọn ngày giao dịch');
      return;
    }
    try {
      const walletIdToUse = Number(form.walletId);
      if (!walletIdToUse) {
        setErr('Vui lòng chọn ví cho giao dịch này.');
        return;
      }
      
      await api.post('/transactions', {
        walletId: walletIdToUse,
        categoryId: Number(form.categoryId),
        type: form.type,
        amount,
        note: form.note || undefined,
        date: form.date ? new Date(form.date).toISOString() : undefined,
      });
      
      setOpen(false);
      setShowAllCategories(false);
      setCategoryFilter('');
      setForm({
        ...initialTransactionForm,
        date: nowLocalDateTime(),
      });
      const [w, b] = await Promise.all([api.get('/wallets'), api.get('/budgets')]);
      setWallets(w.data || []);
      setBudgets(b.data || []);
      load(page);
      loadMonthTransactions();
    } catch (ex) {
      setErr(
        ex.response?.data?.message ||
          ex.response?.data?.details?.join?.(', ') ||
          'Không thể tạo giao dịch'
      );
    }
  };

  const txDate = form.date ? new Date(form.date) : new Date();
  const txMonth = txDate.getMonth() + 1;
  const txYear = txDate.getFullYear();

  // Tìm ngân sách cho category được chọn
  const selectedBudget =
    form.type === 'expense' && form.categoryId
      ? budgets.find(
          (b) =>
            Number(b.categoryId) === Number(form.categoryId) &&
            Number(b.month) === txMonth &&
            Number(b.year) === txYear &&
            Number(b.amount) > 0
        )
      : null;

  // Tự động chọn ví từ ngân sách nếu có
  useEffect(() => {
    if (form.type === 'expense' && selectedBudget && !form.walletId) {
      setForm((f) => ({ ...f, walletId: String(selectedBudget.walletId) }));
    }
  }, [form.categoryId, form.type, selectedBudget]);

  const categoryCards = useMemo(
    () =>
      categories
        .filter((c) => {
          if (c.type !== form.type) return false;

          // For expense type, only show categories with budget
          if (form.type === 'expense') {
            const txDate = new Date(form.date || nowLocalDateTime());
            const txMonth = txDate.getMonth() + 1;
            const txYear = txDate.getFullYear();

            const hasBudget = budgets.some(
              (b) =>
                Number(b.categoryId) === c.id &&
                Number(b.month) === txMonth &&
                Number(b.year) === txYear &&
                Number(b.amount) > 0
            );
            return hasBudget;
          }

          // For income type, show all income categories
          return true;
        })
        .sort((a, b) => {
          const order = form.type === 'expense' ? EXPENSE_CATEGORY_ORDER : INCOME_CATEGORY_ORDER;
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);
          const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
          const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
          if (safeA !== safeB) return safeA - safeB;
          return a.name.localeCompare(b.name, 'vi');
        }),
    [categories, form.type, budgets, form.date]
  );

  const filteredCategoryCards = useMemo(() => {
    const q = categoryFilter.trim().toLowerCase();
    if (!q) return categoryCards;
    return categoryCards.filter((c) => c.name.toLowerCase().includes(q));
  }, [categoryCards, categoryFilter]);
  const calendarCells = useMemo(() => {
    const [yearPart, monthPart] = calendarMonth.split('-');
    const year = Number(yearPart);
    const month = Number(monthPart);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const key = `${yearPart}-${monthPart}-${String(d).padStart(2, '0')}`;
      const dayTx = monthTransactions.filter(
        (tx) => toLocalDateKey(tx.date) === key
      );
      const income = dayTx
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      const expense = dayTx
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      cells.push({
        day: d,
        key,
        income,
        expense,
        count: dayTx.length,
      });
    }
    return cells;
  }, [calendarMonth, monthTransactions]);

  const selectedDayTransactions = useMemo(
    () =>
      monthTransactions.filter(
        (tx) => toLocalDateKey(tx.date) === selectedDate
      ),
    [monthTransactions, selectedDate]
  );
  const selectedIncome = selectedDayTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const selectedExpense = selectedDayTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const selectedNet = selectedIncome - selectedExpense;

  const getTypeMeta = (tx) => {
    if (tx.type === 'income' && tx.categoryName === 'Tiền hoàn') {
      return {
        label: 'Tiền hoàn',
        badgeClass: 'bg-sky-50 text-sky-700',
        amountClass: 'text-sky-600',
        sign: '+',
      };
    }
    if (tx.type === 'income') {
      return {
        label: 'Thu',
        badgeClass: 'bg-emerald-50 text-emerald-700',
        amountClass: 'text-emerald-600',
        sign: '+',
      };
    }
    return {
      label: 'Chi',
      badgeClass: 'bg-rose-50 text-rose-700',
      amountClass: 'text-rose-600',
      sign: '-',
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Giao dịch</h1>
        <button
          type="button"
          onClick={() => {
            setCategoryFilter('');
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:shadow-xl"
        >
          <Plus className="h-4 w-4" />
          Thêm giao dịch
        </button>
      </div>

      <Card>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex justify-end">
            <input
              type="month"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={calendarMonth}
              onChange={(e) => setCalendarMonth(e.target.value)}
            />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Lịch giao dịch tháng {calendarMonth.split('-')[1]}/{calendarMonth.split('-')[0]}
          </p>
          <div className="mt-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 sm:gap-2">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, idx) =>
              !cell ? (
                <div key={`empty-${idx}`} className="h-12 rounded-md bg-transparent sm:h-14" />
              ) : (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDate(cell.key)}
                  className={`h-12 rounded-md border px-1 py-0.5 text-left transition sm:h-14 ${
                    selectedDate === cell.key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-700">{cell.day}</p>
                  {cell.count > 0 && (
                    <>
                      <p className="truncate text-[9px] leading-3 font-semibold text-emerald-600">
                        +{formatVND(cell.income)}
                      </p>
                      <p className="truncate text-[9px] leading-3 font-semibold text-rose-600">
                        -{formatVND(cell.expense)}
                      </p>
                    </>
                  )}
                </button>
              )
            )}
          </div>
          <div className="mt-4 rounded-lg bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <p className="text-sm text-slate-600">
                Thu nhập: <span className="font-semibold text-emerald-600">{formatVND(selectedIncome)}</span>
              </p>
              <p className="text-sm text-slate-600">
                Chi tiêu: <span className="font-semibold text-rose-600">{formatVND(selectedExpense)}</span>
              </p>
              <p className="text-sm text-slate-600">
                Tổng: <span className={`font-semibold ${selectedNet >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>{formatVND(selectedNet)}</span>
              </p>
            </div>
            <div className="mt-3 space-y-2">
              {selectedDayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {tx.categoryName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{tx.note || 'Không ghi chú'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatVND(tx.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      title="Xóa giao dịch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {selectedDayTransactions.length === 0 && (
                <p className="text-sm text-slate-500">Không có giao dịch trong ngày đã chọn.</p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Ngày</th>
                <th className="px-4 py-3 font-semibold">Ví</th>
                <th className="px-4 py-3 font-semibold">Danh mục</th>
                <th className="px-4 py-3 font-semibold">Loại</th>
                <th className="px-4 py-3 font-semibold text-right">Số tiền</th>
                <th className="px-4 py-3 font-semibold">Ghi chú</th>
                <th className="px-4 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const typeMeta = getTypeMeta(r);
                return (
                <tr
                  key={r.id}
                  className={`border-t border-slate-100 transition hover:bg-indigo-50/50 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(r.date).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">{r.walletName}</td>
                  <td className="px-4 py-3">{r.categoryName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeMeta.badgeClass}`}
                    >
                      {typeMeta.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${typeMeta.amountClass}`}>
                    {typeMeta.sign}
                    {formatVND(r.amount)}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                    {r.note || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      title="Xóa giao dịch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="p-6 text-center text-slate-500">Chưa có giao dịch.</p>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
          <span>Tổng: {total} bản ghi</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-40 active:scale-95 transition"
            >
              Trước
            </button>
            <span className="flex items-center">Trang {page}</span>
            <button
              type="button"
              disabled={page * 15 >= total}
              onClick={() => load(page + 1)}
              className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-40 active:scale-95 transition"
            >
              Sau
            </button>
          </div>
        </div>
      </Card>

      {/* Transaction Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 p-6 pb-2 shrink-0">
              Thêm giao dịch
            </h3>
            <div className="p-6 pt-2 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <form onSubmit={submit} className="space-y-4">
                {err && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    {err}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700">Loại</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500/20 transition focus:ring-2"
                    value={form.type}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        type: e.target.value,
                        categoryId: '',
                      }));
                      setShowAllCategories(false);
                      setCategoryFilter('');
                    }}
                  >
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi tiêu</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Ví</label>
                  <select
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500/20 transition focus:ring-2"
                    value={form.walletId}
                    onChange={(e) => setForm((f) => ({ ...f, walletId: e.target.value }))}
                  >
                    <option value="">Chọn ví</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} — {formatVND(w.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Ngày giao dịch</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500/20 transition focus:ring-2"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Số tiền</label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-semibold tabular-nums outline-none ring-indigo-500/20 transition focus:ring-2"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          amount: formatNumberInput(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <label className="text-sm font-medium text-slate-700">Danh mục</label>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      Tháng áp dụng: {txMonth}/{txYear}
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      autoComplete="off"
                      placeholder="Tìm nhanh danh mục…"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-indigo-500/20 transition focus:ring-2"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(showAllCategories ? filteredCategoryCards : filteredCategoryCards.slice(0, 6)).map((c) => {
                      const active = String(form.categoryId) === String(c.id);
                      // Tìm ngân sách cho category này khi là chi tiêu
                      const categoryBudget = form.type === 'expense' ? budgets.find(
                        (b) =>
                          Number(b.categoryId) === c.id &&
                          Number(b.month) === txMonth &&
                          Number(b.year) === txYear
                      ) : null;
                      // Tính số tiền đã chi cho category này trong tháng
                      const categorySpent = form.type === 'expense' ? monthTransactions
                        .filter((tx) => tx.type === 'expense' && Number(tx.categoryId) === c.id)
                        .reduce((sum, tx) => sum + Number(tx.amount), 0) : 0;
                      // Tính số dư còn lại
                      const remainingBudget = categoryBudget ? Math.max(0, Number(categoryBudget.amount) - categorySpent) : 0;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={c.name}
                          onClick={() => setForm((f) => ({ ...f, categoryId: String(c.id) }))}
                          className={`relative flex flex-col rounded-xl border px-2 py-2 text-left text-xs transition ${
                            active
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-950 shadow-sm ring-2 ring-indigo-200'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:bg-white'
                          }`}
                        >
                          <span className="text-lg leading-none">{CATEGORY_EMOJI[c.name] || '💰'}</span>
                          <span className="mt-1 line-clamp-2 font-medium leading-snug">{c.name}</span>
                          {active && form.type === 'expense' && categoryBudget && (
                            <span className="mt-1 text-[10px] text-slate-600">
                              Còn: {formatVND(remainingBudget)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {filteredCategoryCards.length > 6 && !categoryFilter && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                    >
                      {showAllCategories ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Xem thêm ({filteredCategoryCards.length - 6})
                        </>
                      )}
                    </button>
                  )}

                  {!form.categoryId && (
                    <p className="text-xs text-slate-500">Chọn một danh mục để tiếp tục.</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500/20 transition focus:ring-2"
                    placeholder="Tùy chọn"
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setErr('');
                      setCategoryFilter('');
                      setShowAllCategories(false);
                      setOpen(false);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 font-semibold text-white shadow-lg hover:scale-105 transition"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Xóa giao dịch</h3>
                  <p className="text-sm text-slate-600">
                    Bạn có chắc chắn muốn xóa giao dịch này?
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Danh mục:</span> {deleteConfirm.categoryName}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Số tiền:</span>{' '}
                  {deleteConfirm.type === 'income' ? '+' : '-'}
                  {formatVND(deleteConfirm.amount)}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Ngày:</span>{' '}
                  {new Date(deleteConfirm.date).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
