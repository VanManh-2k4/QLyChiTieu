import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Download,
  Filter,
  Target,
  AlertCircle,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import api from '../services/api.js';
import { formatVND } from '../utils/format.js';

import { Card } from '../components/Card.jsx';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#22c55e', '#eab308', '#06b6d4'];

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
      <div className="h-8 w-32 bg-slate-200 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
      <div className="h-64 bg-slate-200 rounded" />
    </div>
  );
}

export function Reports() {
  const [activeTab, setActiveTab] = useState('trends');
  const [trendPeriodType, setTrendPeriodType] = useState('month');
  const [trendPeriodCount, setTrendPeriodCount] = useState(6);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(1);
  const [trendData, setTrendData] = useState(null);
  const [savingsData, setSavingsData] = useState(null);
  const [budgetCompareData, setBudgetCompareData] = useState(null);
  const [monthlySummaryData, setMonthlySummaryData] = useState(null);
  const [goalsData, setGoalsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Lock body scroll when detail modal is open
  useEffect(() => {
    if (detailModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailModalOpen]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const periods = [];
      for (let i = trendPeriodCount - 1; i >= 0; i--) {
        if (trendPeriodType === 'month') {
          const d = new Date(year, month - 1 - i, 1);
          periods.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        } else if (trendPeriodType === 'quarter') {
          const q = Math.ceil((month - i * 3) / 3);
          periods.push({ year: year - Math.floor(i / 4), quarter: q > 0 ? q : 1 });
        } else {
          periods.push({ year: year - i });
        }
      }
      console.log('Loading trends:', { trendPeriodType, trendPeriodCount, periods });
      const res = await api.post('/reports/trends', { periodType: trendPeriodType, periods });
      console.log('Trends response:', res.data);
      setTrendData(res.data);
    } catch (err) {
      console.error('Error loading trends:', err);
      setTrendData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSavings = async () => {
    setLoading(true);
    try {
      const period = { year, month, quarter };
      console.log('Loading savings:', { period });
      const res = await api.post('/reports/savings', { periodType: 'month', period });
      console.log('Savings response:', res.data);
      setSavingsData(res.data);
    } catch (err) {
      console.error('Error loading savings:', err);
      setSavingsData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetCompare = async () => {
    setLoading(true);
    try {
      console.log('Loading budget compare:', { year, month });
      const res = await api.get('/reports/budget-compare', { params: { year, month } });
      console.log('Budget compare response:', res.data);
      setBudgetCompareData(res.data);
    } catch (err) {
      console.error('Error loading budget compare:', err);
      setBudgetCompareData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlySummary = async () => {
    setLoading(true);
    try {
      console.log('Loading monthly summary:', { year, month });
      const res = await api.get('/reports/monthly-summary', { params: { year, month } });
      console.log('Monthly summary response:', res.data);
      setMonthlySummaryData(res.data);
    } catch (err) {
      console.error('Error loading monthly summary:', err);
      setMonthlySummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    setLoading(true);
    try {
      console.log('Loading goal analysis');
      const res = await api.get('/reports/goal-analysis');
      console.log('Goal analysis response:', res.data);
      setGoalsData(res.data);
    } catch (err) {
      console.error('Error loading goal analysis:', err);
      setGoalsData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryTransactions = async (categoryId) => {
    setLoadingTransactions(true);
    try {
      const res = await api.get('/transactions', {
        params: { categoryId, year, month }
      });
      setCategoryTransactions(res.data.rows || []);
    } catch (err) {
      console.error('Error loading category transactions:', err);
      setCategoryTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSuggestionAction = async (suggestion) => {
    if (suggestion.action === 'review_category' || suggestion.action === 'review_transactions') {
      setDetailModalData(suggestion);
      setDetailModalOpen(true);
      await loadCategoryTransactions(suggestion.categoryId);
    } else if (suggestion.action === 'adjust_budget') {
      // Navigate to Budget page
      window.location.href = '/budget';
    } else if (suggestion.action === 'review_subscription') {
      setDetailModalData(suggestion);
      setDetailModalOpen(true);
      await loadCategoryTransactions(suggestion.categoryId);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends') loadTrends();
    else if (activeTab === 'savings') loadSavings();
    else if (activeTab === 'budget') loadBudgetCompare();
    else if (activeTab === 'summary') loadMonthlySummary();
    else if (activeTab === 'goals') loadGoals();
  }, [activeTab, trendPeriodType, trendPeriodCount, year, month, quarter]);

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl">
        <div>
          <label className="text-sm font-medium">Loại kỳ</label>
          <select
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2"
            value={trendPeriodType}
            onChange={(e) => setTrendPeriodType(e.target.value)}
          >
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
            <option value="year">Năm</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Số kỳ</label>
          <select
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2"
            value={trendPeriodCount}
            onChange={(e) => setTrendPeriodCount(Number(e.target.value))}
          >
            <option value="3">3 kỳ</option>
            <option value="6">6 kỳ</option>
            <option value="12">12 kỳ</option>
            <option value="24">24 kỳ</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : trendData ? (
        <div className="space-y-6">
          {/* Health Score Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Điểm tài chính</h3>
                <p className="text-sm text-slate-600">Đánh giá tổng quan tình hình tài chính của bạn</p>
              </div>
              <div className={`rounded-2xl p-4 ${
                trendData.healthScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                trendData.healthScore >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                <p className="text-3xl font-bold">{trendData.healthScore}</p>
                <p className="text-xs font-medium">/ 100</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {trendData.scoreFactors?.map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{factor.factor}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${factor.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {factor.points >= 0 ? '+' : ''}{factor.points}
                    </span>
                    <span className="text-xs text-slate-500">({factor.reason})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Thu nhập TB</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{formatVND(trendData.avgIncome)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Chi tiêu TB</p>
              <p className="mt-2 text-2xl font-bold text-rose-600">{formatVND(trendData.avgExpense)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Tỷ lệ tiết kiệm TB</p>
              <p className={`mt-2 text-2xl font-bold ${trendData.avgSavingsRate >= 20 ? 'text-emerald-600' : trendData.avgSavingsRate >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                {trendData.avgSavingsRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Xu hướng chi tiêu</p>
              <div className={`mt-2 flex items-center gap-2 ${trendData.trendDirection === 'increasing' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {trendData.trendDirection === 'increasing' ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                <span className="text-xl font-bold capitalize">{trendData.trendDirection === 'increasing' ? 'Tăng' : trendData.trendDirection === 'decreasing' ? 'Giảm' : 'Ổn định'}</span>
              </div>
            </div>
          </div>

          {trendData.insights && trendData.insights.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Insights</h3>
                  <div className="mt-2 space-y-1">
                    {trendData.insights.map((insight, index) => (
                      <p key={index} className="text-sm text-slate-600">
                        • {insight}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Trend Chart - Income vs Expense */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-semibold">Xu hướng Thu nhập - Chi tiêu</h3>
              <p className="text-sm text-slate-600">So sánh thu nhập và chi tiêu qua các kỳ</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData.trendData.map((item) => ({
                  ...item,
                  periodLabel: item.period.month ? `T${item.period.month}/${item.period.year}` : 
                              item.period.quarter ? `Q${item.period.quarter}/${item.period.year}` :
                              `${item.period.year}`,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="periodLabel" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip 
                    formatter={(value) => formatVND(value)}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    fill="#22c55e"
                    fillOpacity={0.1}
                    name="Thu nhập"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fill="#ef4444"
                    fillOpacity={0.1}
                    name="Chi tiêu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Trend Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-semibold">Xu hướng Tiết kiệm</h3>
              <p className="text-sm text-slate-600">Theo dõi số tiền tiết kiệm qua các kỳ</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData.trendData.map((item) => ({
                  ...item,
                  periodLabel: item.period.month ? `T${item.period.month}/${item.period.year}` : 
                              item.period.quarter ? `Q${item.period.quarter}/${item.period.year}` :
                              `${item.period.year}`,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="periodLabel"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip 
                    formatter={(value) => formatVND(value)}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Tiết kiệm"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget vs Actual Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-semibold">Tuân thủ Ngân sách</h3>
              <p className="text-sm text-slate-600">So sánh ngân sách kế hoạch với chi tiêu thực tế</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData.trendData.map((item) => ({
                  ...item,
                  periodLabel: item.period.month ? `T${item.period.month}/${item.period.year}` : 
                              item.period.quarter ? `Q${item.period.quarter}/${item.period.year}` :
                              `${item.period.year}`,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="periodLabel"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip 
                    formatter={(value) => formatVND(value)}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalBudget" 
                    fill="#6366f1" 
                    name="Ngân sách"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="#ef4444" 
                    name="Thực tế"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* YoY Comparison */}
          {trendData.yoyComparison && trendData.yoyComparison.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">So sánh cùng kỳ năm trước (YoY)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {trendData.yoyComparison.map((yoy, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-600">Kỳ: {yoy.period}</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Chi tiêu năm trước:</span>
                        <span className="font-semibold">{formatVND(yoy.expense)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Thay đổi chi tiêu:</span>
                        <span className={`font-semibold ${yoy.expenseChangePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {yoy.expenseChangePercent >= 0 ? '+' : ''}{yoy.expenseChangePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Thay đổi thu nhập:</span>
                        <span className={`font-semibold ${yoy.incomeChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {yoy.incomeChangePercent >= 0 ? '+' : ''}{yoy.incomeChangePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Xu hướng theo danh mục</h3>
            <div className="space-y-3">
              {trendData.categoryTrendAnalysis.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{cat.categoryName}</p>
                    <p className="text-sm text-slate-600">
                      {formatVND(cat.firstAmount)} → {formatVND(cat.lastAmount)} (TB: {formatVND(cat.avgAmount)})
                    </p>
                  </div>
                  <div
                    className={`ml-4 flex items-center gap-1 ${
                      cat.trend === 'increasing' ? 'text-rose-600' : cat.trend === 'decreasing' ? 'text-emerald-600' : 'text-slate-600'
                    }`}
                  >
                    {cat.trend === 'increasing' && <TrendingUp className="h-4 w-4" />}
                    {cat.trend === 'decreasing' && <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold capitalize">{cat.trend === 'increasing' ? 'Tăng' : cat.trend === 'decreasing' ? 'Giảm' : 'Ổn định'}</span>
                    <span className="text-xs">({Math.abs(cat.changePercent).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderSavingsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl">
        <div>
          <label className="text-sm font-medium">Năm</label>
          <input
            type="number"
            className="mt-1 block w-24 rounded-lg border border-slate-200 px-3 py-2"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tháng</label>
          <input
            type="number"
            className="mt-1 block w-20 rounded-lg border border-slate-200 px-3 py-2"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            min="1"
            max="12"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonChart />
        </div>
      ) : savingsData ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Tiết Kiệm Tiềm Năng</h3>
                <p className="text-sm text-slate-600">
                  Có thể tiết kiệm được {formatVND(savingsData.totalPotentialSavings)} ({savingsData.savingsPercentage}%)
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">
                  {formatVND(savingsData.totalPotentialSavings)}
                </p>
              </div>
            </div>
          </div>

          {/* Insights */}
          {(savingsData.insights || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Insights</h3>
                  <p className="text-sm text-slate-600">Phân tích và gợi ý tổng quan</p>
                </div>
              </div>
              <div className="space-y-2">
                {savingsData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 rounded-lg p-3 ${
                      insight.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                      insight.type === 'error' ? 'bg-rose-50 text-rose-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <span className="text-lg">
                      {insight.type === 'warning' ? '⚠️' : insight.type === 'error' ? '🚨' : 'ℹ️'}
                    </span>
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Chi Tiết Gợi Ý</h3>
                <p className="text-sm text-slate-600">{savingsData.suggestions.length} gợi ý tiết kiệm</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                  {savingsData.suggestions.filter((s) => s.priority === 'high').length} Ưu tiên
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {savingsData.suggestions.filter((s) => s.priority === 'medium').length} Trung bình
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {savingsData.suggestions.map((suggestion, index) => (
                <div key={index} className={`rounded-lg border p-4 ${
                  suggestion.priority === 'high' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          suggestion.type === 'high_spending' ? 'bg-indigo-100 text-indigo-700' :
                          suggestion.type === 'large_transactions' ? 'bg-violet-100 text-violet-700' :
                          suggestion.type === 'budget_exceeded' ? 'bg-rose-100 text-rose-700' :
                          suggestion.type === 'subscription' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {suggestion.type === 'high_spending' ? 'Chi tiêu cao' :
                           suggestion.type === 'large_transactions' ? 'Giao dịch lớn' :
                           suggestion.type === 'budget_exceeded' ? 'Vượt ngân sách' :
                           suggestion.type === 'subscription' ? 'Định kỳ' :
                           'Khác'}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          suggestion.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {suggestion.priority === 'high' ? 'Ưu tiên' : 'Trung bình'}
                        </span>
                        <span className="font-semibold">{suggestion.categoryName}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{suggestion.suggestion}</p>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-medium text-emerald-600">
                          Tiết kiệm tiềm năng: {formatVND(suggestion.potentialSavings)}
                        </p>
                        {suggestion.type === 'budget_exceeded' && (
                          <p className="text-sm text-rose-600">
                            Vượt: {formatVND(suggestion.overspent)}
                          </p>
                        )}
                        {suggestion.type === 'subscription' && (
                          <p className="text-sm text-slate-600">
                            {suggestion.count} lần × {formatVND(suggestion.avgAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                    {suggestion.actionLabel && (
                      <button 
                        onClick={() => handleSuggestionAction(suggestion)}
                        className="ml-4 shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                      >
                        {suggestion.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {savingsData.suggestions.length === 0 && (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Không có gợi ý tiết kiệm nào cho kỳ này.</p>
                  <p className="text-sm text-slate-400 mt-1">Chi tiêu của bạn đang rất tốt!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderBudgetCompareTab = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl">
        <div>
          <label className="text-sm font-medium">Năm</label>
          <input
            type="number"
            className="mt-1 block w-24 rounded-lg border border-slate-200 px-3 py-2"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tháng</label>
          <input
            type="number"
            className="mt-1 block w-20 rounded-lg border border-slate-200 px-3 py-2"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            min="1"
            max="12"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonChart />
        </div>
      ) : budgetCompareData ? (
        <div className="space-y-6">
          {/* Budget Health Score Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-3 ${
                budgetCompareData.healthScore >= 80 ? 'bg-emerald-100 text-emerald-600' :
                budgetCompareData.healthScore >= 60 ? 'bg-amber-100 text-amber-600' :
                'bg-rose-100 text-rose-600'
              }`}>
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Điểm Tuân Thủ Ngân Sách</h3>
                <p className="text-sm text-slate-600">
                  Tổng chi tiêu: {formatVND(budgetCompareData.totalExpense)} / {formatVND(budgetCompareData.totalBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${
                  budgetCompareData.healthScore >= 80 ? 'text-emerald-600' :
                  budgetCompareData.healthScore >= 60 ? 'text-amber-600' :
                  'text-rose-600'
                }`}>
                  {budgetCompareData.healthScore.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">/ 100</p>
              </div>
            </div>
            
            {/* Score Factors */}
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {budgetCompareData.scoreFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{factor.factor}:</span>
                  <span className={`font-semibold ${factor.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {factor.points >= 0 ? '+' : ''}{factor.points} ({factor.reason})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining Budget */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Ngân Sách Còn Lại</h3>
                <p className="text-sm text-slate-600">
                  Đã sử dụng {budgetCompareData.totalPercentUsed.toFixed(1)}% ngân sách
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${budgetCompareData.totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatVND(budgetCompareData.totalRemaining)}
                </p>
              </div>
            </div>
            <div className="mt-4 h-4 rounded-full bg-slate-100">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  budgetCompareData.totalPercentUsed <= 100 ? 'bg-emerald-600' :
                  budgetCompareData.totalPercentUsed <= 110 ? 'bg-amber-600' :
                  'bg-rose-600'
                }`}
                style={{ width: `${Math.min(budgetCompareData.totalPercentUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Overspending Alerts */}
          {(budgetCompareData.overspendingAlerts || []).length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-rose-100 p-3 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-rose-900">Cảnh Báo Vượt Ngân Sách</h3>
                  <p className="text-sm text-rose-700">
                    {budgetCompareData.overspendingAlerts.length} danh mục vượt ngân sách
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {budgetCompareData.overspendingAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-rose-200 bg-white p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-rose-900">{alert.categoryName}</p>
                      <p className="text-sm text-rose-700">
                        Vượt {formatVND(alert.overspent)} ({alert.overspentPercent.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget vs Actual Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-violet-100 p-3 text-violet-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Ngân Sách vs Thực Tế</h3>
                <p className="text-sm text-slate-600">So sánh ngân sách và chi tiêu theo danh mục</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetCompareData.categoryBreakdown.filter(c => c.budget > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="categoryName" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip 
                    formatter={(value) => formatVND(value)}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="budget" name="Ngân sách" fill="#8b5cf6" />
                  <Bar dataKey="amount" name="Thực tế" fill={(d) => d.exceeded ? '#f43f5e' : '#10b981'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget History Chart */}
          {(budgetCompareData.budgetHistory || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-cyan-100 p-3 text-cyan-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Lịch Sử Tuân Thủ Ngân Sách</h3>
                  <p className="text-sm text-slate-600">6 tháng gần nhất</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={budgetCompareData.budgetHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip 
                      formatter={(value) => `${value.toFixed(1)}%`}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="percentUsed" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="% Đã sử dụng"
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Insights */}
          {(budgetCompareData.insights || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Insights</h3>
                  <p className="text-sm text-slate-600">Phân tích và gợi ý cho ngân sách</p>
                </div>
              </div>
              <div className="space-y-2">
                {budgetCompareData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 rounded-lg p-3 ${
                      insight.type === 'error' ? 'bg-rose-50 text-rose-700' :
                      insight.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                      insight.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <span className="text-lg">
                      {insight.type === 'error' ? '🚨' : insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✓' : 'ℹ️'}
                    </span>
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown with Remaining */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Chi Tiết Theo Danh Mục</h3>
            <div className="space-y-3">
              {budgetCompareData.categoryBreakdown.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div className="flex-1">
                    <p className="font-medium">{cat.categoryName}</p>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          cat.exceeded ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className={`font-semibold ${cat.exceeded ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatVND(cat.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{cat.count} giao dịch</p>
                    {cat.budget > 0 && (
                      <p className={`text-xs ${cat.exceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {cat.exceeded ? 'Vượt ' : 'Còn '}{formatVND(Math.abs(cat.remaining))} ({cat.percentUsed.toFixed(0)}%)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderMonthlySummaryTab = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl">
        <div>
          <label className="text-sm font-medium">Năm</label>
          <input
            type="number"
            className="mt-1 block w-24 rounded-lg border border-slate-200 px-3 py-2"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tháng</label>
          <input
            type="number"
            className="mt-1 block w-20 rounded-lg border border-slate-200 px-3 py-2"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            min="1"
            max="12"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : monthlySummaryData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Thu nhập</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{formatVND(monthlySummaryData.summary.income)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Chi tiêu</p>
              <p className="mt-2 text-2xl font-bold text-rose-600">{formatVND(monthlySummaryData.summary.expense)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Tiết kiệm</p>
              <p className={`mt-2 text-2xl font-bold ${monthlySummaryData.summary.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatVND(monthlySummaryData.summary.netSavings)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Tỷ lệ tiết kiệm</p>
              <p className={`mt-2 text-2xl font-bold ${monthlySummaryData.summary.savingsRate >= 20 ? 'text-emerald-600' : monthlySummaryData.summary.savingsRate >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                {monthlySummaryData.summary.savingsRate}%
              </p>
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Insights</h3>
                <div className="mt-2 space-y-1">
                  {monthlySummaryData.insights.map((insight, index) => (
                    <p key={index} className="text-sm text-slate-600">
                      • {insight}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MoM Comparison */}
          {monthlySummaryData.momComparison && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">So sánh với tháng trước (MoM)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">Kỳ: {monthlySummaryData.momComparison.period}</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Thu nhập:</span>
                      <span className="font-semibold">{formatVND(monthlySummaryData.momComparison.income)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Chi tiêu:</span>
                      <span className="font-semibold">{formatVND(monthlySummaryData.momComparison.expense)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Thay đổi thu nhập:</span>
                      <span className={`font-semibold ${monthlySummaryData.momComparison.incomeChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {monthlySummaryData.momComparison.incomeChangePercent >= 0 ? '+' : ''}{monthlySummaryData.momComparison.incomeChangePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Thay đổi chi tiêu:</span>
                      <span className={`font-semibold ${monthlySummaryData.momComparison.expenseChangePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {monthlySummaryData.momComparison.expenseChangePercent >= 0 ? '+' : ''}{monthlySummaryData.momComparison.expenseChangePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* YoY Comparison */}
          {monthlySummaryData.yoyComparison && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">So sánh cùng kỳ năm trước (YoY)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">Kỳ: {monthlySummaryData.yoyComparison.period}</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Thu nhập năm trước:</span>
                      <span className="font-semibold">{formatVND(monthlySummaryData.yoyComparison.income)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Chi tiêu năm trước:</span>
                      <span className="font-semibold">{formatVND(monthlySummaryData.yoyComparison.expense)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Thay đổi thu nhập:</span>
                      <span className={`font-semibold ${monthlySummaryData.yoyComparison.incomeChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {monthlySummaryData.yoyComparison.incomeChangePercent >= 0 ? '+' : ''}{monthlySummaryData.yoyComparison.incomeChangePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Thay đổi chi tiêu:</span>
                      <span className={`font-semibold ${monthlySummaryData.yoyComparison.expenseChangePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {monthlySummaryData.yoyComparison.expenseChangePercent >= 0 ? '+' : ''}{monthlySummaryData.yoyComparison.expenseChangePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Categories */}
          {monthlySummaryData.topCategories && monthlySummaryData.topCategories.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Top 3 Danh mục chi tiêu nhiều nhất</h3>
              <div className="space-y-3">
                {monthlySummaryData.topCategories.map((cat) => (
                  <div key={cat.categoryId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="flex-1">
                      <p className="font-medium">{cat.categoryName}</p>
                      <p className="text-sm text-slate-600">{cat.count} giao dịch</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold text-rose-600">{formatVND(cat.amount)}</p>
                      <p className="text-xs text-slate-500">{cat.percentage.toFixed(1)}% tổng chi</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Chi tiêu theo danh mục</h3>
            <div className="space-y-3">
              {monthlySummaryData.categoryBreakdown.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{cat.categoryName}</p>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-600"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold">{formatVND(cat.amount)}</p>
                    <p className="text-xs text-slate-500">{cat.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap - Spending by Day */}
          {monthlySummaryData.heatmapData && monthlySummaryData.heatmapData.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Chi tiêu theo ngày trong tháng</h3>
              <div className="grid gap-2 grid-cols-7">
                {monthlySummaryData.heatmapData.map((day) => {
                  const maxAmount = Math.max(...monthlySummaryData.heatmapData.map((d) => d.amount));
                  const intensity = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                  let bgColor = 'bg-slate-100';
                  if (intensity > 0) bgColor = 'bg-emerald-100';
                  if (intensity > 25) bgColor = 'bg-emerald-200';
                  if (intensity > 50) bgColor = 'bg-emerald-300';
                  if (intensity > 75) bgColor = 'bg-emerald-400';
                  if (intensity > 90) bgColor = 'bg-emerald-500';
                  
                  return (
                    <div
                      key={day.day}
                      className={`${bgColor} rounded p-2 text-center transition hover:opacity-80`}
                      title={`Ngày ${day.day}: ${formatVND(day.amount)} (${day.count} giao dịch)`}
                    >
                      <p className="text-xs font-semibold text-slate-700">{day.day}</p>
                      <p className="text-[10px] text-slate-600">{day.amount > 0 ? formatVND(day.amount) : '-'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonChart />
        </div>
      ) : goalsData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Tổng mục tiêu</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{goalsData.summary.totalGoals}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Đã hoàn thành</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{goalsData.summary.completedGoals}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Đang thực hiện</p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{goalsData.summary.activeGoals}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Cần chú ý</p>
              <p className={`mt-2 text-2xl font-bold ${goalsData.summary.offTrackGoals > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {goalsData.summary.offTrackGoals}
              </p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Tổng tiến độ mục tiêu</h3>
                <p className="text-sm text-slate-600">
                  {formatVND(goalsData.summary.totalCurrentAmount)} / {formatVND(goalsData.summary.totalTargetAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4 h-4 rounded-full bg-slate-100">
              <div
                className="h-4 rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(goalsData.summary.overallProgress, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-600">{goalsData.summary.overallProgress.toFixed(1)}%</p>
          </div>

          {/* Goal Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {goalsData.goals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{goal.name}</h4>
                    <p className="text-sm text-slate-600">{goal.walletName}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    goal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    goal.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {goal.status === 'completed' ? 'Đã hoàn thành' :
                     goal.status === 'active' ? 'Đang thực hiện' : 'Quá hạn'}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-slate-800">{formatVND(goal.currentAmount)}</p>
                  <p className="text-sm text-slate-600">/ {formatVND(goal.targetAmount)}</p>
                </div>
                
                <div className="mb-4">
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        goal.progress >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{goal.progress.toFixed(1)}%</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Còn thiếu:</span>
                    <span className="font-semibold text-rose-600">{formatVND(goal.remainingAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Ngày còn lại:</span>
                    <span className="font-semibold">{goal.daysUntilTarget} ngày</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Tốc độ tiết kiệm:</span>
                    <span className="font-semibold">{formatVND(goal.dailySavingsRate)}/ngày</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Cần tiết kiệm:</span>
                    <span className={`font-semibold ${goal.onTrack ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatVND(goal.requiredDailyRate)}/ngày
                    </span>
                  </div>
                  {goal.estimatedCompletionDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Dự kiến hoàn thành:</span>
                      <span className={`font-semibold ${goal.onTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {new Date(goal.estimatedCompletionDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>

                {!goal.onTrack && goal.status === 'active' && (
                  <div className="mt-4 rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">
                      ⚠️ Cần tăng tốc độ tiết kiệm để đạt mục tiêu
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {goalsData.goals.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Chưa có mục tiêu tiết kiệm nào.</p>
            </div>
          )}

          {/* Insights Section */}
          {(goalsData.insights || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Insights</h3>
                  <p className="text-sm text-slate-600">Phân tích và gợi ý cho mục tiêu của bạn</p>
                </div>
              </div>
              <div className="space-y-2">
                {goalsData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 rounded-lg p-3 ${
                      insight.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                      insight.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <span className="text-lg">
                      {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✓' : 'ℹ️'}
                    </span>
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {(goalsData.recommendations || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Gợi ý ưu tiên</h3>
                  <p className="text-sm text-slate-600">Các mục tiêu cần chú ý nhất</p>
                </div>
              </div>
              <div className="space-y-2">
                {goalsData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-indigo-900">{rec.goalName}</p>
                      <p className="text-sm text-indigo-700">{rec.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress History Chart */}
          {goalsData.goals.some(g => g.historicalProgress && g.historicalProgress.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-violet-100 p-3 text-violet-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Lịch sử tiến độ</h3>
                  <p className="text-sm text-slate-600">Tiến độ tiết kiệm 6 tháng gần nhất</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={goalsData.goals
                    .filter(g => g.historicalProgress && g.historicalProgress.length > 0)
                    .flatMap(g => g.historicalProgress.map(hp => ({ ...hp, goalName: g.name })))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}k` : String(v)}
                    />
                    <Tooltip 
                      formatter={(value) => formatVND(value)}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Legend />
                    {goalsData.goals.map((goal, index) => (
                      <Line 
                        key={goal.id}
                        type="monotone" 
                        dataKey={(item) => item.goalName === goal.name ? item.amount : null}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        name={goal.name}
                        dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  // Detail Modal for Category Transactions
  const renderDetailModal = () => {
    if (!detailModalOpen || !detailModalData) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-6 shrink-0">
            <div>
              <h3 className="text-lg font-semibold">Chi Tiết Danh Mục</h3>
              <p className="text-sm text-slate-600">{detailModalData.categoryName}</p>
            </div>
            <button
              onClick={() => {
                setDetailModalOpen(false);
                setDetailModalData(null);
                setCategoryTransactions(null);
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {detailModalData.type === 'budget_exceeded' && (
              <div className="mb-4 rounded-lg bg-rose-50 p-4 shrink-0">
                <p className="text-sm text-rose-700">
                  <span className="font-semibold">Ngân sách:</span> {formatVND(detailModalData.budget)}
                </p>
                <p className="text-sm text-rose-700">
                  <span className="font-semibold">Đã chi:</span> {formatVND(detailModalData.spent)}
                </p>
                <p className="text-sm text-rose-700">
                  <span className="font-semibold">Vượt:</span> {formatVND(detailModalData.overspent)}
                </p>
              </div>
            )}
            {detailModalData.type === 'subscription' && (
              <div className="mb-4 rounded-lg bg-amber-50 p-4 shrink-0">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Ghi chú:</span> {detailModalData.note}
                </p>
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Số lần:</span> {detailModalData.count}
                </p>
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Trung bình:</span> {formatVND(detailModalData.avgAmount)}/lần
                </p>
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Tổng:</span> {formatVND(detailModalData.totalAmount)}
                </p>
              </div>
            )}
            <h4 className="mb-3 font-semibold shrink-0">Giao dịch trong tháng {month}/{year}</h4>
            {loadingTransactions ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : categoryTransactions && categoryTransactions.length > 0 ? (
              <div className="space-y-2">
                {categoryTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="flex-1">
                      <p className="font-medium">{t.note || t.description || 'Không có ghi chú'}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <p className="font-semibold text-rose-600">{formatVND(t.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Không có giao dịch nào trong danh mục này.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phân Tích Chi Tiêu</h1>
          <p className="text-sm text-slate-600">So sánh, phân tích xu hướng và gợi ý tiết kiệm</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'trends', label: 'Xu hướng', icon: TrendingUp },
            { id: 'summary', label: 'Tổng kết', icon: BarChart3 },
            { id: 'goals', label: 'Mục tiêu', icon: Target },
            { id: 'budget', label: 'Ngân sách', icon: Target },
            { id: 'savings', label: 'Gợi ý tiết kiệm', icon: Lightbulb },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {activeTab === 'trends' && renderTrendsTab()}
      {activeTab === 'summary' && renderMonthlySummaryTab()}
      {activeTab === 'goals' && renderGoalsTab()}
      {activeTab === 'budget' && renderBudgetCompareTab()}
      {activeTab === 'savings' && renderSavingsTab()}
      {renderDetailModal()}
    </div>
  );
}
