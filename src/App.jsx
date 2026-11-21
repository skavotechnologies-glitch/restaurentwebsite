import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { CartProvider } from './context/CartContext';

// Public Pages
import HomePage from './pages/HomePage';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import CustomerCartPage from './pages/customer/CustomerCartPage';
import CustomerCheckoutPage from './pages/customer/CustomerCheckoutPage';
import CustomerOrderSuccessPage from './pages/customer/CustomerOrderSuccessPage';
import CustomerOrderTrackingPage from './pages/customer/CustomerOrderTrackingPage';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminTablesPage from './pages/admin/AdminTablesPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminHistoryPage from './pages/admin/AdminHistoryPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <CartProvider>
          <Routes>
            {/* Landing / Gateway Page */}
            <Route path="/" element={<HomePage />} />

            {/* Customer Digital Menu & Ordering Routes */}
            <Route path="/r/:restaurantSlug" element={<CustomerMenuPage />} />
            <Route path="/r/:restaurantSlug/cart" element={<CustomerCartPage />} />
            <Route path="/r/:restaurantSlug/checkout" element={<CustomerCheckoutPage />} />
            <Route path="/r/:restaurantSlug/order-success/:orderId" element={<CustomerOrderSuccessPage />} />
            <Route path="/order/:orderId" element={<CustomerOrderTrackingPage />} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin Portal with Sidebar Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:orderId" element={<AdminOrdersPage />} />
              <Route path="menu" element={<AdminMenuPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="tables" element={<AdminTablesPage />} />
              <Route path="billing" element={<AdminBillingPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </RestaurantProvider>
    </AuthProvider>
  );
}
