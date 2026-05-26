import { Navigate, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.jsx';
import { useAuth } from './hooks/useAuth.jsx';

function Gate() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  
  if (pathname === '/login' && isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <AppRoutes />;
}

export default function App() {
  return <Gate />;
}
