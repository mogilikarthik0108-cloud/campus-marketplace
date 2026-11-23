import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  ArrowLeftRight, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Layers,
  AlertCircle
} from 'lucide-react';
import { adminService, categoryService } from '../services/api';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'products', 'orders', 'categories'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Layers');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, prodRes, ordRes, catRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getProducts(),
        adminService.getOrders(),
        categoryService.getCategories(),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users || []);
      if (prodRes.data.success) setProducts(prodRes.data.products || []);
      if (ordRes.data.success) setOrders(ordRes.data.orders || []);
      if (catRes.data.success) setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      const res = await adminService.toggleUserStatus(userId, !currentStatus);
      if (res.data.success) {
        setActionSuccess(res.data.message);
        setTimeout(() => setActionSuccess(''), 3000);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling user status.');
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Moderate & remove listing "${title}"?`)) return;
    try {
      const res = await adminService.deleteProduct(productId);
      if (res.data.success) {
        setActionSuccess('Product removed by admin.');
        setTimeout(() => setActionSuccess(''), 3000);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing product.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await categoryService.createCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        description: newCatDesc.trim() || undefined
      });
      if (res.data.success) {
        setActionSuccess('Category created successfully.');
        setNewCatName('');
        setNewCatDesc('');
        setTimeout(() => setActionSuccess(''), 3000);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating category.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Administrator Console</h1>
            <p className="text-xs text-slate-500">Marketplace supervision, user management, and product moderation</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl gap-1">
          {['overview', 'users', 'products', 'orders', 'categories'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading admin metrics...</p>
        </div>
      ) : activeTab === 'overview' ? (
        /* OVERVIEW TAB */
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Registered Users</span>
              <p className="text-2xl font-extrabold text-slate-900">{stats?.totalUsers || 0}</p>
              <span className="text-[10px] text-teal-600 font-medium">Campus-wide students</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Products</span>
              <p className="text-2xl font-extrabold text-slate-900">{stats?.totalProducts || 0}</p>
              <span className="text-[10px] text-emerald-600 font-medium">{stats?.availableProducts || 0} active &bull; {stats?.soldProducts || 0} sold</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Completed Orders</span>
              <p className="text-2xl font-extrabold text-slate-900">{stats?.totalOrders || 0}</p>
              <span className="text-[10px] text-teal-600 font-medium">₹{Number(stats?.totalRevenue || 0).toLocaleString()} volume</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Active Deals</span>
              <p className="text-2xl font-extrabold text-slate-900">
                {(stats?.activeNegotiations || 0) + (stats?.activeExchanges || 0)}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">
                {stats?.activeNegotiations || 0} offers &bull; {stats?.activeExchanges || 0} exchanges
              </span>
            </div>
          </div>

          {/* Category Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Category Distribution
              </h3>
              <div className="space-y-2">
                {stats?.categoryBreakdown?.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{cat.name}</span>
                    <span className="font-bold text-slate-900">{cat.count} items</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recent Marketplace Orders
              </h3>
              <div className="space-y-3">
                {stats?.recentOrders?.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-900">{ord.order_code}</p>
                      <p className="text-[11px] text-slate-500">Buyer: {ord.buyer_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">₹{Number(ord.total_amount).toLocaleString()}</span>
                      <span className="block text-[10px] text-emerald-700 font-semibold">{ord.order_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* USERS TAB */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">College & Campus</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Listings</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800">{u.college_name}</p>
                      <p className="text-[11px] text-slate-400">{u.campus_location}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.products_count}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.orders_count}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'products' ? (
        /* PRODUCTS TAB */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={p.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                          <p className="text-[10px] text-slate-400">Condition: {p.condition_state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{p.category_name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{Number(p.price).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-700">{p.seller_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.title)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        /* ORDERS TAB */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order Code</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.order_code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{ord.buyer_name}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">₹{Number(ord.total_amount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{ord.pickup_location}</td>
                    <td className="py-3 px-4 text-slate-600">{ord.payment_method}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        {ord.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CATEGORIES TAB */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-slate-900">Add New Marketplace Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Musical Instruments"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Add Category
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{c.description || 'General category'}</p>
                <span className="text-[10px] text-teal-700 font-bold block mt-2">
                  {c.product_count || 0} active products
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
