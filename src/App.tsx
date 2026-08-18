import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AccountsPage } from './pages/AccountsPage';
import { OrdersPage } from './pages/OrdersPage';
import { PaymentEventsPage } from './pages/PaymentEventsPage';
import { CustomersPage } from './pages/CustomersPage';
import { SettingsPage } from './pages/SettingsPage';
import { BroadcastPage } from './pages/BroadcastPage';
import { AdminsPage } from './pages/AdminsPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/payment-events" element={<PaymentEventsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/broadcast" element={<BroadcastPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admins" element={<AdminsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'glass text-white border border-slate-700',
          style: {
            background: '#1e293b',
            color: '#fff',
          },
        }} 
      />
    </BrowserRouter>
  )
}

export default App
