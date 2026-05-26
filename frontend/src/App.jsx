import { Navigate, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.jsx';
import { useAuth } from './hooks/useAuth.jsx';

function Gate() {
  const { pathname } = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while verifying token
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users away from login/register pages
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect unauthenticated users to login (except for login/register pages)
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
    return <Navigate to="/login" replace />;
  }

  return <AppRoutes />;
}

export default function App() {
  return <Gate />;
}
