import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Landmark } from 'lucide-react';

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    let hasError = false;
    
    if (!name || name.length < 2) {
      setNameError('Họ và tên phải có ít nhất 2 ký tự');
      hasError = true;
    }
    
    if (!email || !email.includes('@')) {
      setEmailError('Email không hợp lệ');
      hasError = true;
    }
    
    if (!password || password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      hasError = true;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      hasError = true;
    }
    
    if (hasError) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data);
      navigate('/');
    } catch (ex) {
      const message = ex.response?.data?.message || 'Đăng ký thất bại';
      const details = ex.response?.data?.details || [];
      
      // Set field-specific errors based on error message
      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('đã được sử dụng')) {
        setEmailError(message);
      } else if (message.toLowerCase().includes('mật khẩu') || message.toLowerCase().includes('password')) {
        setPasswordError(message);
      } else if (message.toLowerCase().includes('tên') || message.toLowerCase().includes('name')) {
        setNameError(message);
      } else {
        // General error
        setEmailError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Spendify</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo tài khoản mới</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Họ và tên
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-indigo-500/20 transition focus:ring-2 ${
                nameError 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-200'
              }`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              type="text"
              required
              minLength={2}
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-600">{nameError}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-indigo-500/20 transition focus:ring-2 ${
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
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-indigo-500/20 transition focus:ring-2 ${
                passwordError 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-200'
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
                setConfirmPasswordError('');
              }}
              type="password"
              required
              minLength={6}
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Xác nhận mật khẩu
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-indigo-500/20 transition focus:ring-2 ${
                confirmPasswordError 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-200'
              }`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
              }}
              type="password"
              required
              minLength={6}
            />
            {confirmPasswordError && (
              <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
          >
            {loading ? 'Đang xử lý…' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
