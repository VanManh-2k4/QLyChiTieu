import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Landmark, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setSuccess(false);
    setDevToken('');
    
    if (!email || !email.includes('@')) {
      setEmailError('Email không hợp lệ');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      
      // In development, show the reset token
      if (data.devResetToken) {
        setDevToken(data.devResetToken);
      }
    } catch (ex) {
      const message = ex.response?.data?.message || 'Gửi yêu cầu thất bại';
      setEmailError(message);
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
          <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu?</h1>
          <p className="mt-2 text-sm text-slate-500">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
        </div>
        
        {success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800">
                Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
              </p>
            </div>
            
            {devToken && (
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="mb-2 text-xs font-semibold text-amber-800">
                  Development Mode - Reset Token:
                </p>
                <code className="block break-all rounded bg-amber-100 px-3 py-2 text-xs text-amber-900">
                  {devToken}
                </code>
                <p className="mt-2 text-xs text-amber-700">
                  Sử dụng token này để đặt lại mật khẩu tại trang Reset Password
                </p>
              </div>
            )}
            
            <Link
              to="/reset-password"
              className="block w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-center font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:shadow-xl"
            >
              Đặt lại mật khẩu
            </Link>
          </div>
        ) : (
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
                placeholder="email@example.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
            >
              {loading ? 'Đang xử lý…' : 'Gửi yêu cầu'}
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
