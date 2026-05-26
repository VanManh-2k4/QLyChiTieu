import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Target, X } from 'lucide-react';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import { formatNumberInput, formatVND, unformatNumberInput } from '../utils/format.js';
import { useConfirm } from '../hooks/useConfirm.jsx';

export function Budget() {
  const { confirm, confirmModal } = useConfirm();
  const defaultMonth = String(new Date().getMonth() + 1);
  const defaultYear = String(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [budgetInsights, setBudgetInsights] = useState(null);
  const [form, setForm] = useState({
    categoryId: '',
    walletId: '',
    amount: '',
    month: defaultMonth,
    year: defaultYear,
  });
  const [err, setErr] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Lock body scroll when detail modal is open
  useEffect(() => {
    if (detailOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailOpen]);

  const load = async () => {
    const { data } = await api.get('/budgets');
    setRows(data || []);
  };

  const loadBudgetInsights = async () => {
    try {
      const { data } = await api.get('/dashboard/budget-insights');
      setBudgetInsights(data || null);
    } catch (ex) {
      console.error('Error loading budget insights:', ex);
    }
  };

  useEffect(() => {
    (async () => {
      const [catRes, walletRes] = await Promise.all([api.get('/categories'), api.get('/wallets')]);
      setCategories((catRes.data || []).filter((c) => c.type === 'expense'));
      setWallets(walletRes.data || []);
    })();
    load();
    loadBudgetInsights();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const amount = Number(unformatNumberInput(form.amount));
    const month = Number(form.month);
    const year = Number(form.year);
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr('Số tiền ngân sách phải lớn hơn 0');
      return;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setErr('Tháng không hợp lệ');
      return;
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setErr('Năm phải nằm trong khoảng 2000 - 2100');
      return;
    }
    try {
      await api.post('/budgets', {
        categoryId: Number(form.categoryId),
        walletId: Number(form.walletId),
        amount,
        month,
        year,
      });
      setForm({
        categoryId: '',
        walletId: '',
        amount: '',
        month: defaultMonth,
        year: defaultYear,
      });
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể tạo ngân sách');
    }
  };

  const remove = async (id) => {
    const ok = await confirm({
      title: 'Xác nhận xóa ngân sách',
      message: 'Bạn có muốn xóa ngân sách này không?',
      confirmText: 'Xóa ngân sách',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/budgets/${id}`);
      await load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể xóa ngân sách');
    }
  };

  const openDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/budgets/${id}/details`);
      setDetailData(data);
    } catch (ex) {
      setDetailData(null);
      setErr(ex.response?.data?.message || 'Không tải được chi tiết ngân sách');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Ngân sách</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Tạo ngân sách theo danh mục</h2>
        {err && (
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {err}
          </div>
        )}
        <form
          onSubmit={submit}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:items-end"
        >
          <div>
            <label className="text-sm font-medium">Danh mục chi</label>
            <select
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              <option value="">Chọn</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Ví liên kết</label>
            <select
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.walletId}
              onChange={(e) =>
                setForm((f) => ({ ...f, walletId: e.target.value }))
              }
            >
              <option value="">Chọn</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} - {formatVND(w.balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Số tiền</label>
            <input
              required
              type="text"
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  amount: formatNumberInput(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tháng</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.month}
              onChange={(e) =>
                setForm((f) => ({ ...f, month: e.target.value }))
              }
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Năm</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.year}
              onChange={(e) =>
                setForm((f) => ({ ...f, year: e.target.value }))
              }
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:scale-105"
          >
            Lưu
          </button>
        </form>
      </Card>

      <div className="grid gap-6">
        {rows.map((b) => {
          const pct = Math.min(b.percentUsed || 0, 150);
          const barColor =
            pct < 60
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
              : pct < 90
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                : 'bg-gradient-to-r from-rose-500 to-red-600';
          return (
            <Card
              key={b.id}
              className={`transition hover:shadow-xl ${
                b.exceeded ? 'ring-2 ring-amber-300' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {b.categoryName} · Tháng {b.month}/{b.year}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ví: {b.walletName || 'Không xác định'}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    Ngân sách: {formatVND(b.amount)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Đã chi: {formatVND(b.spent)} · Còn:{' '}
                    <span
                      className={
                        b.exceeded ? 'font-bold text-rose-600' : 'text-emerald-600'
                      }
                    >
                      {formatVND(b.remaining)}
                    </span>
                  </p>
                  {b.warning && (
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      {b.warning}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openDetail(b.id)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 active:scale-95 transition"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {b.percentUsed}% ngân sách đã dùng
              </p>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <p className="text-slate-500">Chưa có ngân sách nào.</p>
        )}
      </div>

      {/* Budget Insights Section */}
      {budgetInsights && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-amber-50 p-1.5 text-amber-600">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Gợi ý chi tiêu theo từng khoản ngân sách
                </h2>
                <p className="text-xs text-slate-500">
                  Phân tích tiến độ sử dụng ngân sách của tháng hiện tại
                </p>
              </div>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Kỳ ngân sách: Tháng {budgetInsights?.month}/{budgetInsights?.year}
            </span>
          </div>

          {/* Budget Categories Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Danh mục</th>
                  <th className="px-5 py-3 text-right">Kế hoạch</th>
                  <th className="px-5 py-3 text-right">Đã chi</th>
                  <th className="px-5 py-3 text-right">Còn lại</th>
                  <th className="px-5 py-3 text-right">% đã dùng</th>
                  <th className="px-5 py-3 text-right">TB/ngày thực tế</th>
                  <th className="px-5 py-3 text-right text-indigo-700">Nên chi từ hôm nay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(budgetInsights?.categories || []).map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.categoryName}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-800">
                      {formatVND(c.amount)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-rose-600">
                      {formatVND(c.spent)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-emerald-600">
                      {formatVND(c.remaining)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                      {c.percentUsed?.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                      {formatVND(c.dailyPlan?.avgSpentPerDay || 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-indigo-700">
                      {formatVND(c.dailyPlan?.suggestedPerDayFromNow || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(budgetInsights?.categories || []).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Chưa có khoản ngân sách nào trong tháng này.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Budget Detail Modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Chi tiết ngân sách</h3>
                {detailData?.budget && (
                  <p className="text-sm text-slate-600">
                    {detailData.budget.categoryName} · Tháng {detailData.budget.month}/{detailData.budget.year}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 pt-2 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              {detailLoading ? (
                <p className="text-sm text-slate-500">Đang tải...</p>
              ) : detailData?.budget ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      {detailData.budget.categoryName} · Tháng {detailData.budget.month}/
                      {detailData.budget.year}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Ngân sách: <span className="font-semibold">{formatVND(detailData.budget.amount)}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Ví: <span className="font-semibold">{detailData.budget.walletName || 'Không xác định'}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Đã chi: <span className="font-semibold text-rose-600">{formatVND(detailData.budget.spent)}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Còn lại: <span className="font-semibold text-emerald-600">{formatVND(detailData.budget.remaining)}</span>
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-900">Giao dịch</h4>
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Ngày</th>
                            <th className="px-3 py-2 font-semibold">Ví</th>
                            <th className="px-3 py-2 font-semibold">Ghi chú</th>
                            <th className="px-3 py-2 text-right font-semibold">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.transactions?.map((t, idx) => (
                            <tr
                              key={t.id}
                              className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                            >
                              <td className="px-3 py-2 text-slate-700">
                                {new Date(t.date).toLocaleString('vi-VN')}
                              </td>
                              <td className="px-3 py-2">{t.walletName}</td>
                              <td className="px-3 py-2 text-slate-600">{t.note || '—'}</td>
                              <td className="px-3 py-2 text-right font-semibold text-rose-600">
                                {formatVND(t.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!detailData.transactions?.length && (
                        <p className="p-4 text-center text-sm text-slate-500">
                          Chưa có khoản chi nào trong ngân sách này.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Không có dữ liệu.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal}
    </div>
  );
}
