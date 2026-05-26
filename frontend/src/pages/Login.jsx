import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Landmark } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      navigate('/');
    } catch (ex) {
      const message = ex.response?.data?.message || 'Đăng nhập thất bại';
      const details = ex.response?.data?.details || [];
      
      // Set field-specific errors based on error message
      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('tài khoản')) {
        setEmailError(message);
      } else if (message.toLowerCase().includes('mật khẩu') || message.toLowerCase().includes('password')) {
        setPasswordError(message);
      } else {
        // General error, set both fields
        setEmailError(message);
        setPasswordError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="relative w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Spendify</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập để tiếp tục</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-emerald-500/20 transition focus:ring-2 ${
                emailError 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-200'
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              type="email"
              required
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-emerald-500/20 transition focus:ring-2 ${
                passwordError 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-200'
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              type="password"
              required
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-600 hover:text-emerald-700 transition"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
          >
            {loading ? 'Đang xử lý…' : 'Đăng nhập'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
