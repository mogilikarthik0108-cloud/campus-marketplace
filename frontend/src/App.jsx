import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import BrowseProductsPage from './pages/BrowseProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ExchangePage from './pages/ExchangePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import MyListingsPage from './pages/MyListingsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import NegotiationsPage from './pages/NegotiationsPage';
import ExchangeRequestsPage from './pages/ExchangeRequestsPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-[#fcfbf9]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Marketplace Pages */}
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowseProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/exchange" element={<ExchangePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Student Account Pages */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <MyOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyListingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings/add"
                  element={
                    <ProtectedRoute>
                      <AddProductPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings/edit/:id"
                  element={
                    <ProtectedRoute>
                      <EditProductPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/negotiations"
                  element={
                    <ProtectedRoute>
                      <NegotiationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exchange-requests"
                  element={
                    <ProtectedRoute>
                      <ExchangeRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <WishlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Console */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
