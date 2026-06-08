import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import {
  formatNumberInput,
  formatVND,
  nowLocalDateTime,
  unformatNumberInput,
} from '../utils/format.js';
import { useConfirm } from '../hooks/useConfirm.jsx';
import {
  Plus,
  Target,
  TrendingUp,
  Wallet,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const initialTransferForm = {
  walletId: '',
  savingsId: '',
  direction: 'deposit',
  amount: '',
  note: '',
  date: nowLocalDateTime(),
};

const initialGoalForm = {
  walletId: '',
  name: '',
  targetAmount: '',
  targetDate: '',
};

export function Savings() {
  const { confirm, confirmModal } = useConfirm();
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' or 'goals'
  
  // Savings Accounts state
  const [wallets, setWallets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferPage, setTransferPage] = useState(1);
  const [newName, setNewName] = useState('Quỹ tiết kiệm');
  const [newBalance, setNewBalance] = useState('0');
  const [transferForm, setTransferForm] = useState(initialTransferForm);
  
  // Goals state
  const [goals, setGoals] = useState([]);
  const [goalDashboard, setGoalDashboard] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [goalForm, setGoalForm] = useState(initialGoalForm);
  const [goalFormErrors, setGoalFormErrors] = useState({});
  const [goalStatusFilter, setGoalStatusFilter] = useState('active'); // 'active' or 'completed'

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showGoalModal || showTransactionModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showGoalModal, showTransactionModal]);
  const [transactionForm, setTransactionForm] = useState({ amount: '', note: '' });
  const [transactionFormErrors, setTransactionFormErrors] = useState({});
  const [goalTransactions, setGoalTransactions] = useState([]);
  
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBase = async () => {
    const [w, a] = await Promise.all([api.get('/wallets'), api.get('/savings/accounts')]);
    setWallets(w.data || []);
    setAccounts(a.data || []);
    if (w.data?.[0] && !transferForm.walletId) {
      setTransferForm((f) => ({ ...f, walletId: String(w.data[0].id) }));
    }
    if (a.data?.[0] && !transferForm.savingsId) {
      setTransferForm((f) => ({ ...f, savingsId: String(a.data[0].id) }));
    }
  };

  const loadTransfers = async (page = transferPage) => {
    const { data } = await api.get('/savings/transfers', {
      params: { page, limit: 15 },
    });
    setTransfers(data.rows || []);
    setTransferTotal(data.total || 0);
    setTransferPage(data.page || page);
  };

  const loadGoals = async () => {
    setLoading(true);
    try {
      const [g, d] = await Promise.all([
        api.get('/goals', { params: { status: goalStatusFilter } }),
        api.get('/goals/dashboard'),
      ]);
      setGoals(g.data || []);
      setGoalDashboard(d.data || null);
    } catch (ex) {
      console.error('Error loading goals:', ex);
    } finally {
      setLoading(false);
    }
  };

  const loadGoalTransactions = async (goalId) => {
    try {
      const { data } = await api.get(`/goals/${goalId}/transactions`);
      setGoalTransactions(data || []);
    } catch (ex) {
      console.error('Error loading goal transactions:', ex);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    (async () => {
      await loadBase();
      await loadTransfers(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'goals') {
      loadGoals();
    }
  }, [activeTab, goalStatusFilter]);

  const createAccount = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const trimmedName = newName.trim();
    const openingBalance = Number(unformatNumberInput(newBalance));
    if (!trimmedName) {
      setErr('Tên quỹ tiết kiệm không được để trống');
      return;
    }
    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      setErr('Số dư ban đầu phải lớn hơn hoặc bằng 0');
      return;
    }
    try {
      await api.post('/savings/accounts', {
        name: trimmedName,
        balance: openingBalance,
      });
      setMsg('Đã tạo quỹ tiết kiệm.');
      setNewName('');
      setNewBalance('');
      await loadBase();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể tạo quỹ tiết kiệm');
    }
  };

  const createTransfer = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const amount = Number(unformatNumberInput(transferForm.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr('Số tiền chuyển phải lớn hơn 0');
      return;
    }
    const selectedWallet = wallets.find((w) => Number(w.id) === Number(transferForm.walletId));
    if (
      transferForm.direction === 'deposit' &&
      selectedWallet &&
      amount > Number(selectedWallet.balance)
    ) {
      setErr('Số tiền nạp quỹ đang vượt hạn mức số dư ví');
      return;
    }
    try {
      await api.post('/savings/transfers', {
        walletId: Number(transferForm.walletId),
        savingsId: Number(transferForm.savingsId),
        direction: transferForm.direction,
        amount,
        note: transferForm.note || undefined,
        date: transferForm.date ? new Date(transferForm.date).toISOString() : undefined,
      });
      setMsg('Đã ghi nhận giao dịch tiết kiệm.');
      setTransferForm({
        ...initialTransferForm,
        date: nowLocalDateTime(),
      });
      await loadBase();
      await loadTransfers(transferPage);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể tạo giao dịch tiết kiệm');
    }
  };

  const createGoal = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setGoalFormErrors({});
    const trimmedName = goalForm.name.trim();
    const targetAmount = Number(unformatNumberInput(goalForm.targetAmount));
    if (!trimmedName) {
      setGoalFormErrors({ name: 'Tên mục tiêu không được để trống' });
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setGoalFormErrors({ targetAmount: 'Số tiền mục tiêu phải lớn hơn 0' });
      return;
    }
    if (!goalForm.walletId) {
      setGoalFormErrors({ walletId: 'Vui lòng chọn ví' });
      return;
    }
    if (!goalForm.targetDate) {
      setGoalFormErrors({ targetDate: 'Ngày hoàn thành không được để trống' });
      return;
    }
    const targetDate = new Date(goalForm.targetDate);
    const now = new Date();
    if (targetDate <= now) {
      setGoalFormErrors({ targetDate: 'Ngày hoàn thành phải là ngày trong tương lai' });
      return;
    }
    try {
      await api.post('/goals', {
        walletId: Number(goalForm.walletId),
        name: trimmedName,
        targetAmount,
        targetDate: targetDate.toISOString(),
      });
      setMsg('Đã tạo mục tiêu tiết kiệm.');
      setErr('');
      setGoalForm(initialGoalForm);
      setGoalFormErrors({});
      setShowGoalModal(false);
      await loadGoals();
    } catch (ex) {
      const errorMessage = ex.response?.data?.message || 'Không thể tạo mục tiêu';
      // Kiểm tra nếu lỗi liên quan đến ví
      if (errorMessage.toLowerCase().includes('ví') || errorMessage.toLowerCase().includes('wallet')) {
        setGoalFormErrors({ walletId: errorMessage });
        setErr('');
      } else {
        setErr(errorMessage);
      }
      setMsg('');
    }
  };

  const updateGoal = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setGoalFormErrors({});
    if (!selectedGoal) return;
    const trimmedName = goalForm.name.trim();
    const targetAmount = Number(unformatNumberInput(goalForm.targetAmount));
    if (!trimmedName) {
      setGoalFormErrors({ name: 'Tên mục tiêu không được để trống' });
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setGoalFormErrors({ targetAmount: 'Số tiền mục tiêu phải lớn hơn 0' });
      return;
    }
    if (goalForm.targetDate) {
      const targetDate = new Date(goalForm.targetDate);
      const now = new Date();
      if (targetDate <= now) {
        setGoalFormErrors({ targetDate: 'Ngày hoàn thành phải là ngày trong tương lai' });
        return;
      }
    }
    const ok = await confirm({
      title: 'Xác nhận cập nhật mục tiêu',
      message: 'Bạn có chắc chắn muốn cập nhật mục tiêu này?',
      confirmText: 'Cập nhật',
      variant: 'primary',
    });
    if (!ok) return;
    try {
      await api.put(`/goals/${selectedGoal.id}`, {
        name: trimmedName,
        targetAmount,
        targetDate: goalForm.targetDate ? new Date(goalForm.targetDate).toISOString() : undefined,
      });
      setMsg('Đã cập nhật mục tiêu.');
      setErr('');
      setGoalForm(initialGoalForm);
      setGoalFormErrors({});
      setShowGoalModal(false);
      setSelectedGoal(null);
      await loadGoals();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể cập nhật mục tiêu');
      setMsg('');
    }
  };

  const deleteGoal = async (goalId) => {
    const ok = await confirm({
      title: 'Xác nhận xóa mục tiêu',
      message: 'Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa mục tiêu',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/goals/${goalId}`);
      setMsg('Đã xóa mục tiêu.');
      setErr('');
      await loadGoals();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể xóa mục tiêu');
      setMsg('');
    }
  };

  const addFunds = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setTransactionFormErrors({});
    if (!selectedGoal) return;
    const amount = Number(unformatNumberInput(transactionForm.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setTransactionFormErrors({ amount: 'Số tiền phải lớn hơn 0' });
      return;
    }
    try {
      await api.post(`/goals/${selectedGoal.id}/deposit`, {
        amount,
        note: transactionForm.note || undefined,
      });
      setMsg('Đã thêm tiền vào mục tiêu.');
      setErr('');
      setTransactionForm({ amount: '', note: '' });
      setTransactionFormErrors({});
      setShowTransactionModal(false);
      await loadGoals();
      await loadBase(); // Update wallet balance
      if (selectedGoal) {
        // Update selectedGoal with fresh data from goals list
        const updatedGoal = goals.find(g => g.id === selectedGoal.id);
        if (updatedGoal) {
          setSelectedGoal(updatedGoal);
          await loadGoalTransactions(selectedGoal.id);
        }
      }
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể thêm tiền');
      setMsg('');
    }
  };

  const withdrawFunds = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setTransactionFormErrors({});
    if (!selectedGoal) return;
    const amount = Number(unformatNumberInput(transactionForm.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setTransactionFormErrors({ amount: 'Số tiền phải lớn hơn 0' });
      return;
    }
    const ok = await confirm({
      title: 'Xác nhận rút tiền',
      message: `Bạn có chắc chắn muốn rút ${formatVND(amount)} từ mục tiêu "${selectedGoal.name}"?`,
      confirmText: 'Rút tiền',
      variant: 'primary',
    });
    if (!ok) return;
    try {
      await api.post(`/goals/${selectedGoal.id}/withdraw`, {
        amount,
        note: transactionForm.note || undefined,
      });
      setMsg('Đã rút tiền từ mục tiêu.');
      setErr('');
      setTransactionForm({ amount: '', note: '' });
      setTransactionFormErrors({});
      setShowTransactionModal(false);
      await loadGoals();
      await loadBase(); // Update wallet balance
      if (selectedGoal) {
        // Update selectedGoal with fresh data from goals list
        const updatedGoal = goals.find(g => g.id === selectedGoal.id);
        if (updatedGoal) {
          setSelectedGoal(updatedGoal);
          await loadGoalTransactions(selectedGoal.id);
        }
      }
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể rút tiền');
      setMsg('');
    }
  };

  const openGoalModal = async (goal = null) => {
    // Ensure wallets are loaded
    if (wallets.length === 0) {
      await loadBase();
    }
    
    setGoalFormErrors({});
    
    if (goal) {
      setSelectedGoal(goal);
      setGoalForm({
        walletId: String(goal.walletId),
        name: goal.name,
        targetAmount: formatNumberInput(String(goal.targetAmount)),
        targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      });
    } else {
      setSelectedGoal(null);
      setGoalForm(initialGoalForm);
      if (wallets[0]) {
        setGoalForm((f) => ({ ...f, walletId: String(wallets[0].id) }));
      }
    }
    setShowGoalModal(true);
  };

  const openTransactionModal = (goal, type = 'deposit') => {
    setSelectedGoal(goal);
    setTransactionType(type);
    setTransactionForm({ amount: '', note: '' });
    setTransactionFormErrors({});
    setShowTransactionModal(true);
  };

  const viewGoalDetails = async (goal) => {
    setSelectedGoal(goal);
    await loadGoalTransactions(goal.id);
  };

  const totalAccounts = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalGoals = goals.reduce((s, g) => s + Number(g.currentAmount || 0), 0);
  const selectedWallet = wallets.find((w) => Number(w.id) === Number(transferForm.walletId));
  const transferAmount = Number(unformatNumberInput(transferForm.amount));
  const exceedsWalletLimit =
    transferForm.direction === 'deposit' &&
    selectedWallet &&
    Number.isFinite(transferAmount) &&
    transferAmount > Number(selectedWallet.balance);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiết kiệm & Mục tiêu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý quỹ tiết kiệm và theo dõi mục tiêu tài chính
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wallet className="h-4 w-4" />
            Quỹ tiết kiệm
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Target className="h-4 w-4" />
            Mục tiêu
          </button>
        </div>
      </Card>

      {(msg || err) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ring-1 ${
            err
              ? 'bg-amber-50 text-amber-800 ring-amber-200'
              : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
          }`}
        >
          {err || msg}
        </div>
      )}

      {activeTab === 'accounts' && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Tổng quỹ tiết kiệm: {formatVND(totalAccounts)}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Quỹ tiết kiệm</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-600">{a.name}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatVND(a.balance)}
                    </p>
                  </div>
                ))}
                {accounts.length === 0 && (
                  <p className="text-sm text-slate-500">Chưa có quỹ tiết kiệm.</p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">Tạo quỹ mới</h3>
                <form onSubmit={createAccount} className="mt-3 flex flex-wrap gap-3">
                  <input
                    className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-4 py-2"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-40 rounded-xl border border-slate-200 px-4 py-2"
                    value={newBalance}
                    onChange={(e) => setNewBalance(formatNumberInput(e.target.value))}
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 font-semibold text-white shadow-lg transition hover:scale-105"
                  >
                    Tạo
                  </button>
                </form>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Chuyển tiền</h2>
              <form onSubmit={createTransfer} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Ví</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={transferForm.walletId}
                    onChange={(e) => setTransferForm((f) => ({ ...f, walletId: e.target.value }))}
                    required
                  >
                    <option value="">Chọn ví</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} — {formatVND(w.balance)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Quỹ</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={transferForm.savingsId}
                    onChange={(e) => setTransferForm((f) => ({ ...f, savingsId: e.target.value }))}
                    required
                  >
                    <option value="">Chọn quỹ</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {formatVND(a.balance)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Hướng</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={transferForm.direction}
                      onChange={(e) =>
                        setTransferForm((f) => ({ ...f, direction: e.target.value }))
                      }
                    >
                      <option value="deposit">Ví → Quỹ</option>
                      <option value="withdraw">Quỹ → Ví</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Số tiền</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={transferForm.amount}
                      onChange={(e) =>
                        setTransferForm((f) => ({
                          ...f,
                          amount: formatNumberInput(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Ngày</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={transferForm.date}
                      onChange={(e) => setTransferForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={transferForm.note}
                      onChange={(e) => setTransferForm((f) => ({ ...f, note: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={accounts.length === 0 || wallets.length === 0 || exceedsWalletLimit}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-60"
                >
                  Ghi nhận
                </button>
                {exceedsWalletLimit && (
                  <p className="text-sm font-medium text-rose-600">
                    Cảnh báo: Tiền nạp quỹ vượt hạn mức ví hiện tại ({formatVND(selectedWallet.balance)}).
                  </p>
                )}
                {(accounts.length === 0 || wallets.length === 0) && (
                  <p className="text-xs text-slate-500">
                    Cần có ít nhất 1 ví và 1 quỹ để chuyển tiền.
                  </p>
                )}
              </form>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Lịch sử chuyển tiền</h2>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ngày</th>
                    <th className="px-4 py-3 font-semibold">Hướng</th>
                    <th className="px-4 py-3 font-semibold">Ví</th>
                    <th className="px-4 py-3 font-semibold">Quỹ</th>
                    <th className="px-4 py-3 font-semibold text-right">Số tiền</th>
                    <th className="px-4 py-3 font-semibold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`border-t border-slate-100 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(t.date).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            t.direction === 'deposit'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {t.direction === 'deposit' ? 'Ví → Quỹ' : 'Quỹ → Ví'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{t.walletName}</td>
                      <td className="px-4 py-3">{t.savingsName}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatVND(t.amount)}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                        {t.note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transfers.length === 0 && (
                <p className="p-6 text-center text-slate-500">
                  Chưa có lịch sử chuyển tiền.
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
              <span>Tổng: {transferTotal} bản ghi</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={transferPage <= 1}
                  onClick={() => loadTransfers(transferPage - 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-40 active:scale-95 transition"
                >
                  Trước
                </button>
                <span className="flex items-center">Trang {transferPage}</span>
                <button
                  type="button"
                  disabled={transferPage * 15 >= transferTotal}
                  onClick={() => loadTransfers(transferPage + 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-40 active:scale-95 transition"
                >
                  Sau
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Tổng mục tiêu: {formatVND(totalGoals)}
            </div>
          </div>

          {/* Goals Dashboard */}
          {goalDashboard && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tổng mục tiêu</p>
                    <p className="text-2xl font-bold text-slate-900">{goalDashboard.totalGoals}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Đã hoàn thành</p>
                    <p className="text-2xl font-bold text-slate-900">{goalDashboard.completedGoals}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-100 p-3 text-violet-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tổng tiết kiệm</p>
                    <p className="text-2xl font-bold text-slate-900">{formatVND(goalDashboard.totalSavings)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tiến độ</p>
                    <p className="text-2xl font-bold text-slate-900">{goalDashboard.overallProgress.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Danh sách mục tiêu</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setGoalStatusFilter('active')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    goalStatusFilter === 'active'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Đang thực hiện
                </button>
                <button
                  onClick={() => setGoalStatusFilter('completed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    goalStatusFilter === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Đã hoàn thành
                </button>
              </div>
            </div>
            {goalStatusFilter === 'active' && (
              <button
                onClick={() => openGoalModal()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Tạo mục tiêu mới
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-center text-slate-500">Đang tải...</p>
          ) : goals.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Target className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-600">
                {goalStatusFilter === 'completed' ? 'Chưa có mục tiêu nào hoàn thành' : 'Chưa có mục tiêu nào'}
              </p>
              {goalStatusFilter === 'active' && (
                <button
                  onClick={() => openGoalModal()}
                  className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-105"
                >
                  Tạo mục tiêu đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const stats = goal.stats || {};
                const isCompleted = goal.status === 'completed';
                const isOverdue = goal.status === 'overdue';
                
                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => viewGoalDetails(goal)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isOverdue
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {isCompleted ? '✓ Hoàn thành' : isOverdue ? '⚠ Quá hạn' : '○ Đang thực hiện'}
                      </span>
                      {goalStatusFilter === 'active' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openGoalModal(goal); }}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="h-4 w-4 text-slate-600" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold mb-2">{goal.name}</h4>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-slate-800">{formatVND(goal.currentAmount)}</p>
                      <p className="text-sm text-slate-600">/ {formatVND(goal.targetAmount)}</p>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 mb-4">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-600' : isOverdue ? 'bg-rose-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${stats.progress || 0}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Tiến độ:</span> {(stats.progress || 0).toFixed(0)}%
                      </p>
                      {stats.daysRemaining !== undefined && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Còn lại:</span> {stats.daysRemaining} ngày
                        </p>
                      )}
                      {stats.amountRemaining !== undefined && stats.amountRemaining > 0 && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Cần thêm:</span> {formatVND(stats.amountRemaining)}
                        </p>
                      )}
                    </div>
                    {goalStatusFilter === 'active' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openTransactionModal(goal, 'deposit'); }}
                          className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Thêm tiền
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openTransactionModal(goal, 'withdraw'); }}
                          className="flex-1 rounded-lg bg-slate-600 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                        >
                          Rút tiền
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Goal Detail View */}
          {selectedGoal && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Chi tiết mục tiêu: {selectedGoal.name}</h2>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Đóng
                </button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Tiến độ</h3>
                  <div className="h-4 rounded-full bg-slate-100">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        selectedGoal.status === 'completed' ? 'bg-emerald-600' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${(selectedGoal.stats?.progress || 0)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{(selectedGoal.stats?.progress || 0).toFixed(0)}%</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Thông tin</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Số tiền hiện tại:</span> {formatVND(selectedGoal.currentAmount)}</p>
                    <p><span className="font-medium">Số tiền mục tiêu:</span> {formatVND(selectedGoal.targetAmount)}</p>
                    <p><span className="font-medium">Ngày hoàn thành:</span> {new Date(selectedGoal.targetDate).toLocaleDateString('vi-VN')}</p>
                    {selectedGoal.stats?.daysRemaining !== undefined && (
                      <p><span className="font-medium">Còn lại:</span> {selectedGoal.stats.daysRemaining} ngày</p>
                    )}
                    {selectedGoal.stats?.amountRemaining !== undefined && selectedGoal.stats.amountRemaining > 0 && (
                      <p><span className="font-medium">Cần thêm:</span> {formatVND(selectedGoal.stats.amountRemaining)}</p>
                    )}
                    {selectedGoal.stats?.dailyRequired !== undefined && selectedGoal.stats.dailyRequired > 0 && (
                      <p><span className="font-medium">Cần tiết kiệm/ngày:</span> {formatVND(selectedGoal.stats.dailyRequired)}</p>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-700 mb-3">Lịch sử giao dịch</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ngày</th>
                      <th className="px-4 py-3 font-semibold">Loại</th>
                      <th className="px-4 py-3 font-semibold text-right">Số tiền</th>
                      <th className="px-4 py-3 font-semibold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalTransactions.map((t, i) => (
                      <tr
                        key={t.id}
                        className={`border-t border-slate-100 ${
                          i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(t.date).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              t.type === 'deposit'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {t.type === 'deposit' ? 'Thêm tiền' : 'Rút tiền'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatVND(t.amount)}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                          {t.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {goalTransactions.length === 0 && (
                  <p className="p-6 text-center text-slate-500">
                    Chưa có giao dịch nào.
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 p-6 pb-2 shrink-0">
              {selectedGoal ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'}
            </h3>
            <div className="p-6 pt-2 overflow-y-auto flex-1">
              <form onSubmit={selectedGoal ? updateGoal : createGoal} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Ví</label>
                  <select
                    className={`mt-1 w-full rounded-xl border px-3 py-2 ${
                      goalFormErrors.walletId ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                    }`}
                    value={goalForm.walletId}
                    onChange={(e) => {
                      setGoalForm((f) => ({ ...f, walletId: e.target.value }));
                      setGoalFormErrors((e) => ({ ...e, walletId: undefined }));
                    }}
                    required
                    disabled={!!selectedGoal}
                  >
                    <option value="">Chọn ví</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} — {formatVND(w.balance)}
                      </option>
                    ))}
                  </select>
                  {goalFormErrors.walletId && (
                    <p className="mt-1 text-xs text-rose-600">{goalFormErrors.walletId}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tên mục tiêu</label>
                  <input
                    className={`mt-1 w-full rounded-xl border px-3 py-2 ${
                      goalFormErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                    }`}
                    value={goalForm.name}
                    onChange={(e) => {
                      setGoalForm((f) => ({ ...f, name: e.target.value }));
                      setGoalFormErrors((e) => ({ ...e, name: undefined }));
                    }}
                    required
                  />
                  {goalFormErrors.name && (
                    <p className="mt-1 text-xs text-rose-600">{goalFormErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Số tiền mục tiêu</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 ${
                      goalFormErrors.targetAmount ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                    }`}
                    value={goalForm.targetAmount}
                    onChange={(e) => {
                      setGoalForm((f) => ({ ...f, targetAmount: formatNumberInput(e.target.value) }));
                      setGoalFormErrors((e) => ({ ...e, targetAmount: undefined }));
                    }}
                    required
                  />
                  {goalFormErrors.targetAmount && (
                    <p className="mt-1 text-xs text-rose-600">{goalFormErrors.targetAmount}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Ngày hoàn thành</label>
                  <input
                    type="date"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 ${
                      goalFormErrors.targetDate ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                    }`}
                    value={goalForm.targetDate}
                    onChange={(e) => {
                      setGoalForm((f) => ({ ...f, targetDate: e.target.value }));
                      setGoalFormErrors((e) => ({ ...e, targetDate: undefined }));
                    }}
                    required
                  />
                  {goalFormErrors.targetDate && (
                    <p className="mt-1 text-xs text-rose-600">{goalFormErrors.targetDate}</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 font-semibold text-white shadow-lg hover:scale-105 transition"
                  >
                    {selectedGoal ? 'Cập nhật' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 p-6 pb-2 shrink-0">
              {selectedGoal.name} - {transactionType === 'deposit' ? 'Thêm tiền' : 'Rút tiền'}
            </h3>
            <div className="p-6 pt-2 overflow-y-auto flex-1">
              <form onSubmit={transactionType === 'deposit' ? addFunds : withdrawFunds} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Số tiền</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 ${
                      transactionFormErrors.amount ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                    }`}
                    value={transactionForm.amount}
                    onChange={(e) => {
                      setTransactionForm((f) => ({ ...f, amount: formatNumberInput(e.target.value) }));
                      setTransactionFormErrors((e) => ({ ...e, amount: undefined }));
                    }}
                    required
                  />
                  {transactionFormErrors.amount && (
                    <p className="mt-1 text-xs text-rose-600">{transactionFormErrors.amount}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={transactionForm.note}
                    onChange={(e) => setTransactionForm((f) => ({ ...f, note: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 rounded-xl px-4 py-2 font-semibold text-white shadow-lg hover:scale-105 transition ${
                      transactionType === 'deposit' 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' 
                        : 'bg-gradient-to-r from-slate-600 to-slate-700'
                    }`}
                  >
                    {transactionType === 'deposit' ? 'Thêm tiền' : 'Rút tiền'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {confirmModal}
    </div>
  );
}

