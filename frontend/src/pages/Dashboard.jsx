import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet2,
  PiggyBank,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  Target,
  CalendarDays,
} from 'lucide-react';
import api from '../services/api.js';
import { formatVND } from '../utils/format.js';

const PIE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#22c55e',
  '#eab308',
];

const KPI_TONES = {
  emerald: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
  rose: { bar: 'bg-rose-500', iconBg: 'bg-rose-50', iconText: 'text-rose-600' },
  sky: { bar: 'bg-sky-500', iconBg: 'bg-sky-50', iconText: 'text-sky-600' },
  indigo: { bar: 'bg-indigo-500', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
  amber: { bar: 'bg-amber-500', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
};

function KpiCard({ tone = 'indigo', label, value, icon: Icon, footer }) {
  const t = KPI_TONES[tone] || KPI_TONES.indigo;
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900 break-words leading-tight">
              {value}
            </p>
          </div>
          <div className={`shrink-0 rounded-lg p-2 ${t.iconBg} ${t.iconText}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {footer && <p className="text-xs text-slate-500">{footer}</p>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [pie, setPie] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [budgetInsights, setBudgetInsights] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, c, bi] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/chart-category'),
          api.get('/dashboard/budget-insights'),
        ]);
        if (!cancelled) {
          setSummary(s.data);
          setPie(
            (c.data.items || []).map((x) => ({
              name: x.name,
              value: x.value,
            }))
          );
          setBudgetInsights(bi.data || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await api.get('/dashboard/monthly', { params: { year } });
        if (!cancelled) setMonthly(m.data.months || []);
      } catch {
        if (!cancelled) setMonthly([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  if (loading && !summary) {
    return <div className="text-slate-500">Đang tải dashboard…</div>;
  }

  const barData = monthly.map((row) => ({
    name: `T${row.month}`,
    Thu: row.income,
    Chi: row.expense,
  }));

  const today = new Date();
  const todayLabel = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const overallPct = Number(budgetInsights?.overallPercentUsed ?? 0);
  const overallBarColor =
    overallPct < 60
      ? 'bg-emerald-500'
      : overallPct < 90
        ? 'bg-amber-500'
        : 'bg-rose-500';

  return (
    <div className="space-y-6">
      {/* === PAGE HEADER === */}
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Tổng quan tài chính
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Bảng điều khiển
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tóm tắt số dư, ngân sách và biến động dòng tiền của tài khoản.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Hôm nay
            </p>
            <p className="text-sm font-semibold capitalize text-slate-800">{todayLabel}</p>
          </div>
        </div>
      </header>

      {/* === KPI GRID === */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          tone="emerald"
          label="Thu nhập"
          icon={TrendingUp}
          value={formatVND(summary?.income)}
          footer="Tháng hiện tại"
        />
        <KpiCard
          tone="rose"
          label="Chi tiêu"
          icon={TrendingDown}
          value={formatVND(summary?.expense)}
          footer="Tháng hiện tại"
        />
        <KpiCard
          tone="sky"
          label="Tổng số dư ví"
          icon={Wallet2}
          value={formatVND(summary?.balance)}
          footer="Tổng các ví đang hoạt động"
        />
        <KpiCard
          tone="indigo"
          label="Tổng tiết kiệm"
          icon={PiggyBank}
          value={formatVND(summary?.savingsBalance)}
          footer={`Net worth: ${formatVND(summary?.netWorth)}`}
        />
      </section>

      {/* === BUDGET INSIGHTS === */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-amber-50 p-1.5 text-amber-600">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Nhắc nhở ngân sách & gợi ý chi tiêu
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

        {/* Sub KPIs */}
        <div className="grid divide-slate-100 sm:grid-cols-3 sm:divide-x">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              % ngân sách đã dùng
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
              {overallPct}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${overallBarColor}`}
                style={{ width: `${Math.min(overallPct, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Đã chi{' '}
              <span className="font-semibold tabular-nums text-rose-600">
                {formatVND(budgetInsights?.totalSpent)}
              </span>{' '}
              /{' '}
              <span className="font-semibold tabular-nums text-slate-700">
                {formatVND(budgetInsights?.totalBudget)}
              </span>
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Nên chi hôm nay
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-emerald-600">
              {formatVND(budgetInsights?.suggestedDailySpend?.today)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Mức gợi ý dựa trên ngân sách còn lại
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Nên chi ngày mai
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-indigo-600">
              {formatVND(budgetInsights?.suggestedDailySpend?.tomorrow)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Phân bổ trung bình các ngày còn lại
            </p>
          </div>
        </div>

        {/* Economy Assessment + Warnings */}
        <div className="grid gap-3 border-t border-slate-100 px-5 py-4 lg:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Phân tích kinh tế
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {budgetInsights?.economyAssessment?.title || 'Chưa có dữ liệu'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {budgetInsights?.economyAssessment?.message ||
                'Bạn chưa tạo ngân sách cho tháng này.'}
            </p>
          </div>
          <div className="space-y-2 lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Cảnh báo ngân sách
            </p>
            {(budgetInsights?.warnings || []).length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-3 text-sm text-slate-500">
                Hiện chưa có danh mục nào gần dùng hết ngân sách.
              </div>
            ) : (
              (budgetInsights?.warnings || []).map((w) => (
                <div
                  key={w.id}
                  className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ring-1 ${
                    w.level === 'critical'
                      ? 'bg-rose-50 text-rose-700 ring-rose-200'
                      : 'bg-amber-50 text-amber-700 ring-amber-200'
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span>{w.message}</span>
                    <span className="ml-2 rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                      {w.percentUsed}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* === CHARTS === */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
            <div className="rounded-md bg-violet-50 p-1.5 text-violet-600">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Chi tiêu theo danh mục</h2>
              <p className="text-xs text-slate-500">Phân bổ chi tiêu của tháng hiện tại</p>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="h-80">
              {pie.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Chưa có dữ liệu chi tiêu.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {pie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatVND(v)}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Thu / chi theo tháng</h2>
                <p className="text-xs text-slate-500">Biến động dòng tiền theo từng tháng</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Năm
              </label>
              <select
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[0, 1, 2].map((d) => {
                  const y = new Date().getFullYear() - d;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) =>
                      v >= 1e6
                        ? `${(v / 1e6).toFixed(1)}M`
                        : v >= 1e3
                          ? `${(v / 1e3).toFixed(0)}k`
                          : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(v) => formatVND(v)}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Bar
                    dataKey="Thu"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    name="Thu nhập"
                  />
                  <Bar
                    dataKey="Chi"
                    fill="#f43f5e"
                    radius={[3, 3, 0, 0]}
                    name="Chi tiêu"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
