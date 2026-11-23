import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Package, 
  Tag, 
  ArrowLeftRight, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { productService } from '../services/api';

export default function MyListingsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await productService.getMyListings();
      if (res.data.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error('Fetch my listings error:', err);
      setError('Could not load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleToggleStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      const res = await productService.toggleStatus(productId, newStatus);
      if (res.data.success) {
        setActionSuccess(`Product marked as ${newStatus}.`);
        setTimeout(() => setActionSuccess(''), 3000);
        fetchListings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status.');
    }
  };

  const handleDelete = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      const res = await productService.deleteProduct(productId);
      if (res.data.success) {
        setActionSuccess('Product listing deleted successfully.');
        setTimeout(() => setActionSuccess(''), 3000);
        fetchListings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting listing.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Product Listings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your items for sale, update availability, and review offers
          </p>
        </div>
        <Link
          to="/my-listings/add"
          className="px-4 py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading your listings...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">You haven't listed any items yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Sell your old textbooks, electronics, or dorm essentials to students right on your campus.
          </p>
          <Link
            to="/my-listings/add"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={item.primary_image}
                    alt={item.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {item.category_name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <Link to={`/products/${item.id}`} className="block mt-1">
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-teal-700">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      ₹{Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Metrics badges */}
                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Views</span>
                    <span className="font-bold text-slate-800">{item.views_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Offers</span>
                    <span className={`font-bold ${item.pending_offers_count > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {item.pending_offers_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Exchanges</span>
                    <span className={`font-bold ${item.pending_exchanges_count > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {item.pending_exchanges_count}
                    </span>
                  </div>
                </div>

                {/* Exchange details if enabled */}
                {item.exchange_available === 1 && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg line-clamp-1">
                    Exchange item: {item.preferred_exchange || 'Open'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item.id, item.status)}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors border ${
                    item.status === 'available'
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {item.status === 'available' ? 'Mark as Sold' : 'Reactivate'}
                </button>

                <Link
                  to={`/my-listings/edit/${item.id}`}
                  className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit listing"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  to={`/products/${item.id}`}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="View product"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
