import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  Landmark,
  Sparkles,
  SlidersHorizontal,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-105'
  }`;

function getProfileName() {
  try {
    const raw = localStorage.getItem('user_profile');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return typeof parsed?.name === 'string' ? parsed.name.trim() : '';
  } catch {
    return '';
  }
}

export function MainLayout() {
  const [profileName, setProfileName] = useState(() => getProfileName());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncProfile = () => setProfileName(getProfileName());
    window.addEventListener('storage', syncProfile);
    window.addEventListener('user-profile-updated', syncProfile);

    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('user-profile-updated', syncProfile);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Fintech
              </p>
              <p className="font-bold">Spendify</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={navClass}>
            <Receipt className="h-5 w-5 shrink-0" />
            Giao dịch
          </NavLink>
          <NavLink to="/wallets" className={navClass}>
            <Wallet className="h-5 w-5 shrink-0" />
            Ví
          </NavLink>
          <NavLink to="/budget" className={navClass}>
            <PiggyBank className="h-5 w-5 shrink-0" />
            Ngân sách
          </NavLink>
          <NavLink to="/reports" className={navClass}>
            <BarChart3 className="h-5 w-5 shrink-0" />
            Phân tích
          </NavLink>
          <NavLink to="/savings" className={navClass}>
            <PiggyBank className="h-5 w-5 shrink-0" />
            Tiết kiệm
          </NavLink>
          <NavLink
            to="/menu-tools"
            className={({ isActive }) => `${navClass({ isActive })} !font-bold`}
          >
            <SlidersHorizontal className="h-5 w-5 shrink-0" />
            Menu thao tác
          </NavLink>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 shadow-lg shadow-violet-300/70">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {profileName ? `Xin chào ${profileName}!` : 'Quản lý thu chi thông minh'}
              </p>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
