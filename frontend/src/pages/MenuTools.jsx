import { useEffect, useMemo, useState } from 'react';
import {
  User,
  ListTree,
  Palette,
  History,
  Database,
  Filter,
  TrendingUp,
  TrendingDown,
  Scale,
  PieChart as PieIcon,
  BarChart3,
  PiggyBank,
  ReceiptText,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '../components/Card.jsx';
import api from '../services/api.js';
import { useConfirm } from '../hooks/useConfirm.jsx';
import { APP_THEMES, applyTheme, getStoredThemeId } from '../utils/theme.js';
import { formatVND } from '../utils/format.js';
import useExport from '../hooks/useExport.js';
import ExportModal from '../components/export/ExportModal.jsx';
import { useToast, ToastContainer } from '../components/Toast.jsx';

const CHART_COLORS = { income: '#10b981', expense: '#f43f5e' };

function HistoryChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="mt-0.5" style={{ color: p.color }}>
          {p.name === 'income' ? 'Thu' : p.name === 'expense' ? 'Chi' : p.name}: {formatVND(p.value)}
        </p>
      ))}
    </div>
  );
}

const MENU_ITEMS = [
  { key: 'profile', label: 'Hồ sơ', icon: User },
  { key: 'categories', label: 'Danh mục', icon: ListTree },
  { key: 'theme', label: 'Theme', icon: Palette },
  { key: 'history', label: 'Lịch sử', icon: History },
  { key: 'data', label: 'Dữ liệu', icon: Database },
];

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả hoạt động' },
  { value: 'transaction', label: 'Giao dịch' },
  { value: 'budget', label: 'Ngân sách' },
  { value: 'wallet', label: 'Ví' },
  { value: 'profile', label: 'Hồ sơ' },
  { value: 'category', label: 'Danh mục' },
  { value: 'savings', label: 'Tiết kiệm' },
  { value: 'goal', label: 'Mục tiêu tiết kiệm' },
  { value: 'admin', label: 'Quản trị' },
  { value: 'system', label: 'Hệ thống' },
];

const ENTITY_TYPE_LABELS = {
  transaction: 'Giao dịch',
  budget: 'Ngân sách',
  wallet: 'Ví',
  profile: 'Hồ sơ',
  category: 'Danh mục',
  savings: 'Tiết kiệm',
  savings_account: 'Tiết kiệm',
  savings_transfer: 'Tiết kiệm',
  goal: 'Mục tiêu tiết kiệm',
  admin_user: 'Quản trị',
  system: 'Hệ thống',
};

const ENTITY_TYPE_STYLES = {
  transaction: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  budget: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  wallet: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  profile: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  category: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  savings: 'bg-pink-50 text-pink-700 ring-1 ring-pink-100',
  savings_account: 'bg-pink-50 text-pink-700 ring-1 ring-pink-100',
  savings_transfer: 'bg-pink-50 text-pink-700 ring-1 ring-pink-100',
  goal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100',
  admin_user: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  system: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
};

const CONTENT = {
  profile: { title: 'Hồ sơ' },
  categories: { title: 'Danh mục' },
  theme: { title: 'Theme' },
  history: { title: 'Lịch sử' },
  data: { title: 'Dữ liệu' },
};

function getStoredProfile() {
  try {
    const raw = localStorage.getItem('user_profile');
    if (!raw) return { name: '', occupation: '' };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed?.name === 'string' ? parsed.name : '',
      occupation: typeof parsed?.occupation === 'string' ? parsed.occupation : '',
    };
  } catch {
    return { name: '', occupation: '' };
  }
}

export function MenuTools() {
  const { confirm, confirmModal } = useConfirm();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const { isExporting, error: exportError, exportCsv, exportExcel, exportBackup, clearError: clearExportError } = useExport({
    onSuccess: (format, filename) => {
      showSuccess(`Đã xuất ${format} thành công: ${filename}`);
    },
    onError: (format, errorMessage) => {
      showError(`Không thể xuất ${format}: ${errorMessage}`);
    },
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('expense');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryType, setEditingCategoryType] = useState('expense');
  const [categoryError, setCategoryError] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(() => getStoredThemeId());
  const currentDate = new Date();
  const [historyMode, setHistoryMode] = useState('all');
  const [historyActivityType, setHistoryActivityType] = useState('all');
  const [historyDay, setHistoryDay] = useState(currentDate.toISOString().slice(0, 10));
  const [historyMonth, setHistoryMonth] = useState(currentDate.getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(currentDate.getFullYear());
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(20);
  const [historyTxPage, setHistoryTxPage] = useState(1);
  const [historyTxLimit] = useState(25);
  const [historySavingsPage, setHistorySavingsPage] = useState(1);
  const [historySavingsLimit] = useState(10);
  const [historyAnalytics, setHistoryAnalytics] = useState(null);
  const [historyRange, setHistoryRange] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState({ rows: [], total: 0, page: 1, limit: 25 });
  const [historySavingsTransfers, setHistorySavingsTransfers] = useState({
    rows: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [chartYear, setChartYear] = useState(currentDate.getFullYear());
  const [chartSeries, setChartSeries] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState('');
  
  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    mode: 'all',
    day: currentDate.toISOString().slice(0, 10),
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  const formatAmount = (value) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('vi-VN');
  };

  const handleProfileChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const ok = await confirm({
      title: 'Xác nhận sửa hồ sơ',
      message: 'Bạn chắc chắn sửa không?',
      confirmText: 'Chắc chắn sửa',
      variant: 'primary',
    });
    if (!ok) return;
    const nextProfile = {
      name: profile.name.trim(),
      occupation: profile.occupation.trim(),
    };
    localStorage.setItem('user_profile', JSON.stringify(nextProfile));
    window.dispatchEvent(new Event('user-profile-updated'));
  };

  const loadCategories = async () => {
    setCategoryLoading(true);
    setCategoryError('');
    try {
      const { data } = await api.get('/categories');
      setCategories(data || []);
    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Không tải được danh mục');
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'categories') return;
    loadCategories();
  }, [activeTab]);

  const buildHistoryParams = (
    nextPage = historyPage,
    nextLimit = historyLimit,
    txPage = historyTxPage,
    savingsPage = historySavingsPage
  ) => {
    const params = {
      mode: historyMode,
      activityType: historyActivityType,
      page: Number(nextPage),
      limit: Number(nextLimit),
      txPage: Number(txPage),
      txLimit: Number(historyTxLimit),
      savingsPage: Number(savingsPage),
      savingsLimit: Number(historySavingsLimit),
    };
    if (historyMode === 'day') {
      params.day = historyDay;
    } else if (historyMode === 'month') {
      params.month = Number(historyMonth);
      params.year = Number(historyYear);
    } else if (historyMode === 'year') {
      params.year = Number(historyYear);
    }
    return params;
  };

  const loadHistory = async (nextTimelinePage = 1, nextTxPage = historyTxPage, nextSavingsPage = historySavingsPage) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const params = buildHistoryParams(nextTimelinePage, historyLimit, nextTxPage, nextSavingsPage);
      console.log("MENUTOOLS - HISTORY PARAMS:", params);
      const { data } = await api.get('/history', { params });
      setHistoryRows(data.rows || []);
      setHistoryTotal(data.total || 0);
      setHistoryPage(data.page || nextTimelinePage);
      setHistoryAnalytics(data.analytics || null);
      setHistoryRange(data.range || null);
      if (data.transactions) {
        setHistoryTransactions({
          rows: data.transactions.rows || [],
          total: data.transactions.total || 0,
          page: data.transactions.page || nextTxPage,
          limit: data.transactions.limit || historyTxLimit,
        });
        setHistoryTxPage(data.transactions.page || nextTxPage);
      }
      if (data.savingsTransfers) {
        setHistorySavingsTransfers({
          rows: data.savingsTransfers.rows || [],
          total: data.savingsTransfers.total || 0,
          page: data.savingsTransfers.page || nextSavingsPage,
          limit: data.savingsTransfers.limit || historySavingsLimit,
        });
        setHistorySavingsPage(data.savingsTransfers.page || nextSavingsPage);
      }
    } catch (error) {
      setHistoryError(error.response?.data?.message || 'Không tải được lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'history') return;
    setHistoryPage(1);
    setHistoryTxPage(1);
    setHistorySavingsPage(1);
    loadHistory(1, 1, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, historyMode, historyActivityType, historyDay, historyMonth, historyYear]);

  const loadChartSeries = async (yearValue) => {
    setChartLoading(true);
    setChartError('');
    try {
      const params = {
        mode: 'year',
        year: Number(yearValue),
        activityType: 'all',
        page: 1,
        limit: 1,
        txPage: 1,
        txLimit: 1,
        savingsPage: 1,
        savingsLimit: 1,
      };
      console.log("MENUTOOLS - CHART SERIES PARAMS:", params);
      const { data } = await api.get('/history', { params });
      const raw = data?.analytics?.timeSeries || [];
      const map = new Map();
      raw.forEach((row) => {
        const m = /^T(\d{1,2})\/(\d{4})$/.exec(row.label || '');
        if (m) {
          map.set(Number(m[1]), {
            income: Number(row.income || 0),
            expense: Number(row.expense || 0),
          });
        }
      });
      const full = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const found = map.get(month);
        return {
          label: `T${month}`,
          income: found?.income || 0,
          expense: found?.expense || 0,
        };
      });
      setChartSeries(full);
    } catch (error) {
      setChartError(error.response?.data?.message || 'Không tải được biểu đồ thu chi');
      setChartSeries([]);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'history') return;
    loadChartSeries(chartYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, chartYear]);

  const chartYearOptions = useMemo(() => {
    const thisYear = currentDate.getFullYear();
    const years = new Set([thisYear, thisYear - 1, thisYear - 2, thisYear + 1, Number(chartYear)]);
    return Array.from(years)
      .filter((y) => Number.isFinite(y))
      .sort((a, b) => b - a);
  }, [chartYear, currentDate]);

  const chartTotals = useMemo(() => {
    return chartSeries.reduce(
      (acc, row) => {
        acc.income += Number(row.income || 0);
        acc.expense += Number(row.expense || 0);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [chartSeries]);

  const scopeLabel = useMemo(() => {
    if (historyMode === 'day') return `Ngày ${historyDay}`;
    if (historyMode === 'month') return `Tháng ${historyMonth}/${historyYear}`;
    if (historyMode === 'year') return `Năm ${historyYear}`;
    return 'Tất cả thời gian';
  }, [historyMode, historyDay, historyMonth, historyYear]);

  // Export handlers
  const handleExportCsv = async () => {
    try {
      await exportCsv(exportFilters);
      setIsExportModalOpen(false);
    } catch (error) {
      // Error is handled by useExport hook
    }
  };


  const handleExportExcel = async () => {
    try {
      await exportExcel(exportFilters);
      setIsExportModalOpen(false);
    } catch (error) {
      // Error is handled by useExport hook
    }
  };

  const handleExportBackup = async () => {
    try {
      await exportBackup(exportFilters);
      setIsExportModalOpen(false);
    } catch (error) {
      // Error is handled by useExport hook
    }
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();
    setCategoryError('');
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await api.post('/categories', { name, type: newCategoryType });
      setNewCategoryName('');
      await loadCategories();
    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Không thể thêm danh mục');
    }
  };

  const handleDeleteCategory = async (id) => {
    const ok = await confirm({
      title: 'Xác nhận xóa danh mục',
      message: 'Bạn có muốn xóa không?',
      confirmText: 'Xóa danh mục',
      variant: 'danger',
    });
    if (!ok) return;
    setCategoryError('');
    try {
      await api.delete(`/categories/${id}`);
      if (editingCategoryId === id) {
        setEditingCategoryId('');
        setEditingCategoryName('');
        setEditingCategoryType('expense');
      }
      await loadCategories();
    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  const startEditCategory = (item) => {
    setEditingCategoryId(item.id);
    setEditingCategoryName(item.name);
    setEditingCategoryType(item.type);
  };

  const handleSaveCategoryEdit = async (event) => {
    event.preventDefault();
    const ok = await confirm({
      title: 'Xác nhận sửa danh mục',
      message: 'Bạn chắc chắn sửa không?',
      confirmText: 'Chắc chắn sửa',
      variant: 'primary',
    });
    if (!ok) return;
    setCategoryError('');
    const name = editingCategoryName.trim();
    if (!name || !editingCategoryId) return;
    try {
      await api.put(`/categories/${editingCategoryId}`, {
        name,
        type: editingCategoryType,
      });
      setEditingCategoryId('');
      setEditingCategoryName('');
      setEditingCategoryType('expense');
      await loadCategories();
    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Không thể cập nhật danh mục');
    }
  };

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Menu thao tác</h1>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        {activeTab === 'profile' ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-700">Tên</span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={handleProfileChange('name')}
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-500/30 transition focus:ring-2"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-slate-700">Nghề nghiệp</span>
                <input
                  type="text"
                  value={profile.occupation}
                  onChange={handleProfileChange('occupation')}
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-500/30 transition focus:ring-2"
                />
              </label>
            </div>
            <button
              type="submit"
              className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              Lưu hồ sơ
            </button>
          </form>
        ) : activeTab === 'categories' ? (
          <div className="space-y-5">
            {categoryError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {categoryError}
              </div>
            )}
            <form onSubmit={handleAddCategory} className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_120px]">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-500/30 transition focus:ring-2"
              />
              <select
                value={newCategoryType}
                onChange={(e) => setNewCategoryType(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium outline-none ring-indigo-500/30 transition focus:ring-2"
              >
                <option value="expense">Chi tiêu</option>
                <option value="income">Thu nhập</option>
              </select>
              <button
                type="submit"
                className="md:col-span-2 lg:col-span-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                Thêm
              </button>
            </form>

            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {categories.map((item) =>
                editingCategoryId === item.id ? (
                  <form
                    key={item.id}
                    onSubmit={handleSaveCategoryEdit}
                    className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_auto_auto]"
                  >
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-500/30 transition focus:ring-2"
                    />
                    <select
                      value={editingCategoryType}
                      onChange={(e) => setEditingCategoryType(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium outline-none ring-indigo-500/30 transition focus:ring-2"
                    >
                      <option value="expense">Chi tiêu</option>
                      <option value="income">Thu nhập</option>
                    </select>
                    <button
                      type="submit"
                      className="md:col-span-2 lg:col-span-1 h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId('');
                        setEditingCategoryName('');
                        setEditingCategoryType('expense');
                      }}
                      className="md:col-span-2 lg:col-span-1 h-10 rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                    >
                      Hủy
                    </button>
                  </form>
                ) : (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditCategory(item)}
                        className="h-9 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(item.id)}
                        className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )
              )}
              {categoryLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                  Đang tải...
                </div>
              )}
              {!categoryLoading && categories.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                  Chưa có danh mục.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'theme' ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {APP_THEMES.map((theme) => {
                const active = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-base font-semibold text-slate-800">{theme.name}</p>
                      {active && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          Đang dùng
                        </span>
                      )}
                    </div>
                    <div className="mb-3 flex gap-2">
                      {theme.colors.map((color) => (
                        <span
                          key={color}
                          className="h-7 w-7 rounded-full border border-white/50 shadow"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-6">
            {historyError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {historyError}
              </div>
            )}

            {/* === PAGE HEADER === */}
            <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  Báo cáo tài chính
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  Lịch sử & phân tích dòng tiền
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Theo dõi, đối chiếu và truy vết toàn bộ giao dịch, ngân sách và hoạt động hệ thống.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-right shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Phạm vi đang xem
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{scopeLabel}</p>
              </div>
            </header>

            {/* === FILTER BAR === */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Bộ lọc dữ liệu
                </h3>
              </div>
              <div className="grid gap-3 px-5 py-4 md:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Phạm vi
                  </span>
                  <select
                    value={historyMode}
                    onChange={(e) => setHistoryMode(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                  >
                    <option value="all">Tất cả</option>
                    <option value="day">Theo ngày</option>
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Loại hoạt động
                  </span>
                  <select
                    value={historyActivityType}
                    onChange={(e) => setHistoryActivityType(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                  >
                    {ACTIVITY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {historyMode === 'day' && (
                  <label className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ngày
                    </span>
                    <input
                      type="date"
                      value={historyDay}
                      onChange={(e) => setHistoryDay(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                    />
                  </label>
                )}
                {historyMode === 'month' && (
                  <>
                    <label className="space-y-1.5">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Tháng
                      </span>
                      <select
                        value={historyMonth}
                        onChange={(e) => setHistoryMonth(Number(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Năm
                      </span>
                      <input
                        type="number"
                        value={historyYear}
                        onChange={(e) => setHistoryYear(Number(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                      />
                    </label>
                  </>
                )}
                {historyMode === 'year' && (
                  <label className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Năm
                    </span>
                    <input
                      type="number"
                      value={historyYear}
                      onChange={(e) => setHistoryYear(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                    />
                  </label>
                )}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => loadHistory(1, 1, 1)}
                    className="h-10 w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
              {historyRange && (historyRange.dateFrom || historyRange.dateTo) && (
                <div className="border-t border-slate-100 px-5 py-2.5">
                  <p className="text-xs text-slate-500">
                    Khoảng dữ liệu phân tích:{' '}
                    <span className="font-mono text-slate-700">
                      {historyRange.dateFrom && historyRange.dateTo
                        ? `${historyRange.dateFrom} → ${historyRange.dateTo}`
                        : historyRange.dateFrom || historyRange.dateTo}
                    </span>
                  </p>
                </div>
              )}
            </section>

            {/* === KPI OVERVIEW === */}
            {historyAnalytics && (
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Tổng thu
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                        {formatVND(historyAnalytics.totalIncome)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Chiếm{' '}
                    <span className="font-semibold text-emerald-600">
                      {historyAnalytics.incomeSharePct ?? 0}%
                    </span>{' '}
                    dòng tiền
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-1 bg-rose-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Tổng chi
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                        {formatVND(historyAnalytics.totalExpense)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Chiếm{' '}
                    <span className="font-semibold text-rose-600">
                      {historyAnalytics.expenseSharePct ?? 0}%
                    </span>{' '}
                    dòng tiền
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span
                    className={`absolute inset-x-0 top-0 h-1 ${
                      historyAnalytics.net >= 0 ? 'bg-sky-500' : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Chênh lệch
                      </p>
                      <p
                        className={`mt-2 text-2xl font-semibold tabular-nums ${
                          historyAnalytics.net >= 0 ? 'text-sky-700' : 'text-amber-700'
                        }`}
                      >
                        {historyAnalytics.net >= 0 ? '+' : ''}
                        {formatVND(historyAnalytics.net)}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-2 ${
                        historyAnalytics.net >= 0
                          ? 'bg-sky-50 text-sky-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <Scale className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Tỷ số thu ÷ chi:{' '}
                    <span className="font-semibold text-slate-700">
                      {historyAnalytics.incomeToExpenseRatio != null
                        ? historyAnalytics.incomeToExpenseRatio
                        : '—'}
                    </span>
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-1 bg-indigo-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Số giao dịch
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                        {Number(historyAnalytics.transactionCount).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <ReceiptText className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Trong phạm vi đã chọn</p>
                </div>
              </section>
            )}

            {/* === ANALYTICS CHARTS: PIE + TOP CATEGORIES === */}
            {historyAnalytics && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">
                      <PieIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Cơ cấu thu / chi</h3>
                      <p className="text-xs text-slate-500">
                        Tỷ trọng dòng tiền và top danh mục đóng góp
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid divide-slate-100 lg:grid-cols-3 lg:divide-x">
                  <div className="px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tỷ trọng tổng thể
                    </p>
                    {historyAnalytics.totalIncome > 0 || historyAnalytics.totalExpense > 0 ? (
                      <div className="mt-3 h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Thu', value: historyAnalytics.totalIncome },
                                { name: 'Chi', value: historyAnalytics.totalExpense },
                              ]}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={56}
                              outerRadius={86}
                              paddingAngle={2}
                              stroke="#fff"
                              strokeWidth={2}
                            >
                              <Cell fill={CHART_COLORS.income} />
                              <Cell fill={CHART_COLORS.expense} />
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatVND(value)}
                              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                            />
                            <Legend
                              iconType="circle"
                              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="mt-6 text-center text-sm text-slate-500">
                        Chưa có dữ liệu thu/chi.
                      </p>
                    )}
                  </div>
                  <div className="px-5 py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Top danh mục chi
                      </p>
                      <span className="text-xs text-slate-400">
                        {(historyAnalytics.expenseByCategory || []).length} mục
                      </span>
                    </div>
                    <ul className="mt-3 space-y-3">
                      {(historyAnalytics.expenseByCategory || []).map((c, idx) => {
                        const max = Math.max(
                          ...(historyAnalytics.expenseByCategory || []).map((x) => Number(x.value)),
                          1
                        );
                        const pct = Math.min(100, (Number(c.value) / max) * 100);
                        return (
                          <li key={c.categoryId} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-slate-500">
                                {idx + 1}
                              </span>
                              <span className="flex-1 truncate text-slate-700">{c.name}</span>
                              <span className="shrink-0 tabular-nums font-semibold text-rose-600">
                                {formatVND(c.value)}
                              </span>
                            </div>
                            <div className="ml-7 mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-rose-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                      {(!historyAnalytics.expenseByCategory ||
                        historyAnalytics.expenseByCategory.length === 0) && (
                        <li className="text-sm text-slate-500">Chưa có chi tiêu.</li>
                      )}
                    </ul>
                  </div>
                  <div className="px-5 py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Top danh mục thu
                      </p>
                      <span className="text-xs text-slate-400">
                        {(historyAnalytics.incomeByCategory || []).length} mục
                      </span>
                    </div>
                    <ul className="mt-3 space-y-3">
                      {(historyAnalytics.incomeByCategory || []).map((c, idx) => {
                        const max = Math.max(
                          ...(historyAnalytics.incomeByCategory || []).map((x) => Number(x.value)),
                          1
                        );
                        const pct = Math.min(100, (Number(c.value) / max) * 100);
                        return (
                          <li key={c.categoryId} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-slate-500">
                                {idx + 1}
                              </span>
                              <span className="flex-1 truncate text-slate-700">{c.name}</span>
                              <span className="shrink-0 tabular-nums font-semibold text-emerald-600">
                                {formatVND(c.value)}
                              </span>
                            </div>
                            <div className="ml-7 mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                      {(!historyAnalytics.incomeByCategory ||
                        historyAnalytics.incomeByCategory.length === 0) && (
                        <li className="text-sm text-slate-500">Chưa có thu nhập.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* === SƠ ĐỒ THU CHI THEO NĂM === */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Sơ đồ thu chi theo năm
                    </h3>
                    <p className="text-xs text-slate-500">
                      Biến động dòng tiền theo 12 tháng của năm được chọn
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Năm
                  </label>
                  <select
                    value={chartYear}
                    onChange={(e) => setChartYear(Number(e.target.value))}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-2"
                  >
                    {chartYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
                <div className="bg-white px-5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tổng thu năm {chartYear}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-600">
                    {formatVND(chartTotals.income)}
                  </p>
                </div>
                <div className="bg-white px-5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tổng chi năm {chartYear}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-rose-600">
                    {formatVND(chartTotals.expense)}
                  </p>
                </div>
                <div className="bg-white px-5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Chênh lệch năm {chartYear}
                  </p>
                  <p
                    className={`mt-1 text-lg font-semibold tabular-nums ${
                      chartTotals.income - chartTotals.expense >= 0
                        ? 'text-sky-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {chartTotals.income - chartTotals.expense >= 0 ? '+' : ''}
                    {formatVND(chartTotals.income - chartTotals.expense)}
                  </p>
                </div>
              </div>

              <div className="px-5 py-5">
                {chartError && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    {chartError}
                  </div>
                )}
                {chartLoading ? (
                  <p className="py-12 text-center text-sm text-slate-500">Đang tải biểu đồ…</p>
                ) : chartTotals.income === 0 && chartTotals.expense === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-500">
                    Năm {chartYear} chưa có giao dịch thu / chi.
                  </p>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartSeries}
                        margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                      >
                        <XAxis
                          dataKey="label"
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
                          content={<HistoryChartTooltip />}
                          cursor={{ fill: '#f1f5f9' }}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                          formatter={(value) =>
                            value === 'income' ? 'Thu' : value === 'expense' ? 'Chi' : value
                          }
                        />
                        <Bar
                          dataKey="income"
                          name="income"
                          fill={CHART_COLORS.income}
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="expense"
                          name="expense"
                          fill={CHART_COLORS.expense}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* === TIẾT KIỆM === */}
            {historyAnalytics?.savings && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                  <div className="rounded-md bg-pink-50 p-1.5 text-pink-600">
                    <PiggyBank className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Tiết kiệm</h3>
                    <p className="text-xs text-slate-500">
                      Dòng tiền giữa ví và quỹ tiết kiệm trong phạm vi đã chọn
                    </p>
                  </div>
                </div>
                <div className="grid divide-slate-100 sm:grid-cols-3 sm:divide-x">
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Nạp vào quỹ
                    </p>
                    <p className="mt-1.5 text-xl font-semibold tabular-nums text-pink-600">
                      {formatVND(historyAnalytics.savings.deposit)}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Rút về ví
                    </p>
                    <p className="mt-1.5 text-xl font-semibold tabular-nums text-emerald-600">
                      {formatVND(historyAnalytics.savings.withdraw)}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ròng (nạp − rút)
                    </p>
                    <p
                      className={`mt-1.5 text-xl font-semibold tabular-nums ${
                        historyAnalytics.savings.netFlow >= 0 ? 'text-indigo-700' : 'text-amber-700'
                      }`}
                    >
                      {historyAnalytics.savings.netFlow >= 0 ? '+' : ''}
                      {formatVND(historyAnalytics.savings.netFlow)}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* === GIAO DỊCH CHI TIẾT === */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md bg-sky-50 p-1.5 text-sky-600">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Sổ giao dịch thu / chi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Danh sách chi tiết các bút toán trong phạm vi đã chọn
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                  {Number(historyTransactions.total).toLocaleString('vi-VN')} bản ghi
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Thời gian</th>
                      <th className="px-5 py-3">Ví</th>
                      <th className="px-5 py-3">Danh mục</th>
                      <th className="px-5 py-3">Loại</th>
                      <th className="px-5 py-3 text-right">Số tiền</th>
                      <th className="px-5 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyTransactions.rows.map((t) => (
                      <tr key={t.id} className="transition hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-700">
                          {new Date(t.date).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-5 py-3 text-slate-800">{t.walletName}</td>
                        <td className="px-5 py-3 text-slate-800">{t.categoryName}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                              t.type === 'income'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                : 'bg-rose-50 text-rose-700 ring-rose-100'
                            }`}
                          >
                            {t.type === 'income' ? 'Thu' : 'Chi'}
                          </span>
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums ${
                            t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '−'}
                          {formatVND(t.amount)}
                        </td>
                        <td className="max-w-[260px] truncate px-5 py-3 text-slate-500">
                          {t.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!historyLoading && historyTransactions.rows.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    Không có giao dịch trong khoảng này.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:flex-row">
                <span>
                  Trang <span className="font-semibold text-slate-700">{historyTxPage}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={historyTxPage <= 1 || historyLoading}
                    onClick={() => loadHistory(historyPage, historyTxPage - 1, historySavingsPage)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 active:scale-95"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={
                      historyTxPage * historyTxLimit >= historyTransactions.total || historyLoading
                    }
                    onClick={() => loadHistory(historyPage, historyTxPage + 1, historySavingsPage)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 active:scale-95"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </section>

            {/* === CHUYỂN TIẾT KIỆM === */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md bg-pink-50 p-1.5 text-pink-600">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Sổ chuyển tiết kiệm
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lịch sử nạp / rút giữa ví và quỹ tiết kiệm
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                  {Number(historySavingsTransfers.total).toLocaleString('vi-VN')} bản ghi
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Thời gian</th>
                      <th className="px-5 py-3">Hướng</th>
                      <th className="px-5 py-3">Ví</th>
                      <th className="px-5 py-3">Quỹ</th>
                      <th className="px-5 py-3 text-right">Số tiền</th>
                      <th className="px-5 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historySavingsTransfers.rows.map((st) => (
                      <tr key={st.id} className="transition hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-700">
                          {new Date(st.date).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                              st.direction === 'deposit'
                                ? 'bg-pink-50 text-pink-700 ring-pink-100'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            }`}
                          >
                            {st.direction === 'deposit' ? 'Ví → Quỹ' : 'Quỹ → Ví'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-800">{st.walletName}</td>
                        <td className="px-5 py-3 text-slate-800">{st.savingsName}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                          {formatVND(st.amount)}
                        </td>
                        <td className="max-w-[260px] truncate px-5 py-3 text-slate-500">
                          {st.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!historyLoading && historySavingsTransfers.rows.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    Không có chuyển tiết kiệm trong khoảng này.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:flex-row">
                <span>
                  Trang <span className="font-semibold text-slate-700">{historySavingsPage}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={historySavingsPage <= 1 || historyLoading}
                    onClick={() => loadHistory(historyPage, historyTxPage, historySavingsPage - 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 active:scale-95"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={
                      historySavingsPage * historySavingsLimit >= historySavingsTransfers.total ||
                      historyLoading
                    }
                    onClick={() => loadHistory(historyPage, historyTxPage, historySavingsPage + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 active:scale-95"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </section>

            {/* === NHẬT KÝ HOẠT ĐỘNG === */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Nhật ký hoạt động</h3>
                    <p className="text-xs text-slate-500">
                      Mọi thao tác có ảnh hưởng đến dữ liệu được ghi lại theo thứ tự thời gian
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                  {Number(historyTotal).toLocaleString('vi-VN')} bản ghi
                </span>
              </div>
              <div className="px-5 py-5">
                {historyRows.length > 0 && (
                  <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-6">
                    {historyRows.map((item, idx) => {
                      const entityLabel =
                        ENTITY_TYPE_LABELS[item.entityType] || item.entityType;
                      const entityStyle =
                        ENTITY_TYPE_STYLES[item.entityType] ||
                        'bg-slate-50 text-slate-600 ring-1 ring-slate-200';
                      return (
                        <li
                          key={`${item.entityType}-${item.id}-${idx}`}
                          className="relative"
                        >
                          <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                          <div className="rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${entityStyle}`}
                                >
                                  {entityLabel}
                                </span>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.title}
                                </p>
                              </div>
                              <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                                {new Date(item.occurredAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            {item.details && (
                              <p className="mt-1.5 text-sm text-slate-600">{item.details}</p>
                            )}
                            {item.amount != null && Number(item.amount) > 0 && (
                              <p className="mt-1.5 text-sm font-semibold tabular-nums text-slate-700">
                                {formatAmount(item.amount)} đ
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {!historyLoading && historyRows.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Không có dữ liệu lịch sử.
                  </p>
                )}
                {historyLoading && historyRows.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">Đang tải lịch sử...</p>
                )}
              </div>
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:flex-row">
                <span>
                  Trang <span className="font-semibold text-slate-700">{historyPage}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={historyPage <= 1}
                    onClick={() =>
                      loadHistory(historyPage - 1, historyTxPage, historySavingsPage)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 active:scale-95"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={historyPage * historyLimit >= historyTotal}
                    onClick={() =>
                      loadHistory(historyPage + 1, historyTxPage, historySavingsPage)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 active:scale-95"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : activeTab === 'data' ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Quản lý dữ liệu</h2>
              <p className="text-sm text-slate-500">
                Xuất báo cáo, sao lưu và quản lý dữ liệu tài chính của bạn
              </p>
            </div>

            {exportError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {exportError}
                <button
                  type="button"
                  onClick={clearExportError}
                  className="ml-3 text-amber-800 underline hover:text-amber-900"
                >
                  Đóng
                </button>
              </div>
            )}

            {/* Data Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-sky-50 p-2.5 text-sky-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">Tổng quan</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">Dữ liệu</p>
                <p className="mt-1 text-sm text-slate-500">Quản lý & xuất</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">CSV</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">Excel</p>
                <p className="mt-1 text-sm text-slate-500">Phân tích chi tiết</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">Backup</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">Sao lưu</p>
                <p className="mt-1 text-sm text-slate-500">Đầy đủ</p>
              </div>
            </div>

            {/* Export Actions */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-900">Xuất dữ liệu</h3>
                <p className="mt-1 text-xs text-slate-500">Chọn định dạng để xuất báo cáo tài chính</p>
              </div>
              <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isExporting}
                  className="flex items-center gap-3 bg-white px-6 py-4 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">CSV</p>
                    <p className="text-xs text-slate-500">Excel & Google Sheets</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isExporting}
                  className="flex items-center gap-3 bg-white px-6 py-4 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <div className="rounded-lg bg-sky-50 p-2.5 text-sky-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Excel</p>
                    <p className="text-xs text-slate-500">Định dạng .xlsx</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isExporting}
                  className="flex items-center gap-3 bg-white px-6 py-4 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Backup</p>
                    <p className="text-xs text-slate-500">Sao lưu đầy đủ</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Thông tin xuất dữ liệu</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <li>• <span className="font-medium text-slate-700">CSV:</span> Mở tốt bằng Excel (UTF-8), bao gồm tóm tắt, chuỗi thời gian và bảng giao dịch chi tiết</li>
                    <li>• <span className="font-medium text-slate-700">Excel:</span> Định dạng .xlsx với biểu đồ và phân tích nâng cao</li>
                    <li>• <span className="font-medium text-slate-700">Backup:</span> Sao lưu toàn bộ dữ liệu để khôi phục khi cần</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900">{CONTENT[activeTab].title}</h2>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Đang cập nhật.
            </div>
          </>
        )}
      </Card>
      {confirmModal}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        isExporting={isExporting}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        onExportBackup={handleExportBackup}
        filters={exportFilters}
        onFilterChange={setExportFilters}
        error={exportError}
        hasData={true}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
