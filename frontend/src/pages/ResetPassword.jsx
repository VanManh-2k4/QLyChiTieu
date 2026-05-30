import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api.js';
import { Landmark, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const tokenRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-fill token from ForgotPassword page
  // useEffect(() => {
  //   if (location.state?.token) {
  //     setToken(location.state.token);
  //   }
  // }, [location.state?.token]);

  // Focus on field with error
  // useEffect(() => {
  //   if (tokenError) {
  //     tokenRef.current?.focus();
  //   } else if (passwordError) {
  //     newPasswordRef.current?.focus();
  //   } else if (confirmPasswordError) {
  //     confirmPasswordRef.current?.focus();
  //   }
  // }, [tokenError, passwordError, confirmPasswordError]);

  const submit = async (e) => {
    e.preventDefault();
    setTokenError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setSuccess(false);
    
    let hasError = false;
    
    if (!token || token.length < 10) {
      setTokenError('Token không hợp lệ');
      hasError = true;
    }
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      hasError = true;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      hasError = true;
    }
    
    if (hasError) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (ex) {
      const message = ex.response?.data?.message || 'Đặt lại mật khẩu thất bại';
      if (message.toLowerCase().includes('token')) {
        setTokenError(message);
      } else {
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
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
        
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-slate-500">
            Nhập token và mật khẩu mới của bạn
          </p>
        </div>
        
        {success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800">
                Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.
              </p>
            </div>
            
            <Link
              to="/login"
              className="block w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-center font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:shadow-xl"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Token đặt lại
              </label>
              <input
                ref={tokenRef}
                className={`w-full rounded-xl border px-4 py-2.5 outline-none ring-emerald-500/20 transition focus:ring-2 ${
                  tokenError 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-slate-200'
                }`}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenError('');
                }}
                type="text"
                required
                placeholder="Nhập token từ email"
              />
              {tokenError && (
                <p className="mt-1 text-xs text-red-600">{tokenError}</p>
              )}
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  ref={newPasswordRef}
                  className={`w-full rounded-xl border px-4 py-2.5 pr-10 outline-none ring-emerald-500/20 transition focus:ring-2 ${
                    passwordError
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200'
                  }`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                    setConfirmPasswordError('');
                  }}
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Ít nhất 6 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  ref={confirmPasswordRef}
                  className={`w-full rounded-xl border px-4 py-2.5 pr-10 outline-none ring-emerald-500/20 transition focus:ring-2 ${
                    confirmPasswordError
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError('');
                  }}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
            >
              {loading ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
        
        <p className="mt-6 text-center text-sm text-slate-500">
          Nhớ lại mật khẩu?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
