import { useEffect, useState } from 'react';
import { Wallet2 } from 'lucide-react';
import api from '../services/api.js';
import { Card } from '../components/Card.jsx';
import { formatVND } from '../utils/format.js';
import { useConfirm } from '../hooks/useConfirm.jsx';

export function Wallets() {
  const { confirm, confirmModal } = useConfirm();
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const { data } = await api.get('/wallets');
    setList(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setErr('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErr('Tên ví không được để trống');
      return;
    }
    try {
      await api.post('/wallets', {
        name: trimmedName,
      });
      setName('');
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể tạo ví');
    }
  };

  const remove = async (id) => {
    const ok = await confirm({
      title: 'Xác nhận xóa ví',
      message: 'Bạn có muốn xóa không?',
      confirmText: 'Xóa ví',
      variant: 'danger',
    });
    if (!ok) return;
    await api.delete(`/wallets/${id}`);
    load();
  };

  const startEdit = (w) => {
    setEditId(w.id);
    setEditName(w.name);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
  };

  const saveEdit = async (id) => {
    const ok = await confirm({
      title: 'Xác nhận sửa ví',
      message: 'Bạn chắc chắn sửa không?',
      confirmText: 'Chắc chắn sửa',
      variant: 'primary',
    });
    if (!ok) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setErr('Tên ví không được để trống');
      return;
    }
    try {
      await api.put(`/wallets/${id}`, {
        name: trimmedName,
      });
      cancelEdit();
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Không thể cập nhật ví');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Ví của bạn</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((w) => (
          <div
            key={w.id}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl transition hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              {editId === w.id ? (
                <div className="w-full space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm text-white placeholder:text-white/70"
                    placeholder="Tên ví"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/80">{w.name}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    {formatVND(w.balance)}
                  </p>
                </div>
              )}
              <Wallet2 className="h-10 w-10 shrink-0 text-white/80" />
            </div>
            <div className="relative mt-6 flex gap-3 text-xs font-semibold">
              {editId === w.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => saveEdit(w.id)}
                    className="text-white/90 underline-offset-2 hover:text-white hover:underline"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-white/75 underline-offset-2 hover:text-white hover:underline"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(w)}
                    className="text-white/90 underline-offset-2 hover:text-white hover:underline"
                  >
                    Sửa ví
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(w.id)}
                    className="text-white/75 underline-offset-2 hover:text-white hover:underline"
                  >
                    Xóa ví
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Thêm ví mới</h2>
        {err && (
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {err}
          </div>
        )}
        <form onSubmit={create} className="flex flex-wrap gap-3">
          <input
            required
            placeholder="Tên ví"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-4 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 font-semibold text-white shadow-lg transition hover:scale-105"
          >
            Tạo ví
          </button>
        </form>
      </Card>
      {confirmModal}
    </div>
  );
}
