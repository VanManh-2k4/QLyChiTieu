import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { ProtectedRoute } from '../components/ProtectedRoute.jsx';
import { Login } from '../pages/Login.jsx';
import { Register } from '../pages/Register.jsx';
import { Dashboard } from '../pages/Dashboard.jsx';
import { Transactions } from '../pages/Transactions.jsx';
import { Wallets } from '../pages/Wallets.jsx';
import { Budget } from '../pages/Budget.jsx';
import { Reports } from '../pages/Reports.jsx';
import { Savings } from '../pages/Savings.jsx';
import { MenuTools } from '../pages/MenuTools.jsx';
import { Profile } from '../pages/Profile.jsx';
import { About } from '../pages/About.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="wallets" element={<Wallets />} />
        <Route path="budget" element={<Budget />} />
        <Route path="reports" element={<Reports />} />
        <Route path="savings" element={<Savings />} />
        <Route path="menu-tools" element={<MenuTools />} />
        <Route path="profile" element={<Profile />} />
        <Route path="about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
