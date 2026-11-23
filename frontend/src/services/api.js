import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campuscart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, could clear token if not logging in
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        // localStorage.removeItem('campuscart_token');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// User Profile Services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getSellerProfile: (sellerId) => api.get(`/users/${sellerId}`),
};

// Category Services
export const categoryService = {
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Product Services
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getRecent: () => api.get('/products/recent'),
  getPopular: () => api.get('/products/popular'),
  getExchangeProducts: () => api.get('/products/exchange'),
  getMyListings: () => api.get('/products/my-listings'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  toggleStatus: (id, status) => api.patch(`/products/${id}/status`, { status }),
  uploadImage: (formData) => api.post('/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Cart Services
export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity = 1) => api.post('/cart', { product_id: productId, quantity }),
  updateQuantity: (cartItemId, quantity) => api.put(`/cart/${cartItemId}`, { quantity }),
  removeFromCart: (cartItemId) => api.delete(`/cart/${cartItemId}`),
  clearCart: () => api.delete('/cart'),
};

// Wishlist Services
export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (productId) => api.post(`/wishlist/toggle/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  moveToCart: (productId) => api.post(`/wishlist/move-to-cart/${productId}`),
};

// Orders & Checkout Services
export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders'),
  getMySales: () => api.get('/orders/sales/my-sales'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { order_status: status }),
};

// Negotiation Services
export const negotiationService = {
  createOffer: (data) => api.post('/negotiations', data),
  getNegotiations: () => api.get('/negotiations'),
  getNegotiationById: (id) => api.get(`/negotiations/${id}`),
  respondOffer: (id, data) => api.post(`/negotiations/${id}/respond`, data),
};

// Product Exchange Services
export const exchangeService = {
  proposeExchange: (data) => api.post('/exchanges', data),
  getExchanges: () => api.get('/exchanges'),
  respondExchange: (id, status) => api.patch(`/exchanges/${id}/respond`, { status }),
};

// Notification Services
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Reviews Services
export const reviewService = {
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  getSellerReviews: (sellerId) => api.get(`/reviews/seller/${sellerId}`),
  submitReview: (data) => api.post('/reviews', data),
};

// Admin Services
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  toggleUserStatus: (id, is_active) => api.patch(`/admin/users/${id}/status`, { is_active }),
  getProducts: () => api.get('/admin/products'),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getOrders: () => api.get('/admin/orders'),
  getExchanges: () => api.get('/admin/exchanges'),
};

export default api;
