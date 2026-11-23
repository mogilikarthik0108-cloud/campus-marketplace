import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  ArrowRight, 
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { orderService } from '../services/api';

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'sales'
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const [orderRes, saleRes] = await Promise.all([
        orderService.getMyOrders(),
        orderService.getMySales(),
      ]);

      if (orderRes.data.success) setOrders(orderRes.data.orders || []);
      if (saleRes.data.success) setSales(saleRes.data.sales || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.data.success) {
        fetchOrderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status.');
    }
  };

  const statusColors = {
    'Placed': 'bg-blue-50 text-blue-800 border-blue-200',
    'Confirmed': 'bg-teal-50 text-teal-800 border-teal-200',
    'Ready for Pickup': 'bg-amber-50 text-amber-800 border-amber-200',
    'Completed': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders & Sales</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your campus purchases and items you've sold to fellow students
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Purchases ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'sales'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Sales ({sales.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading order details...</p>
        </div>
      ) : activeTab === 'orders' ? (
        /* MY PURCHASES TAB */
        orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">You haven't placed any orders yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Browse textbooks, calculators, electronics, and essentials available for campus pickup.
            </p>
            <Link
              to="/browse"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {ord.order_code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ord.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold border rounded-full ${statusColors[ord.order_status]}`}>
                      {ord.order_status}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{Number(ord.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="space-y-3">
                  {ord.items && ord.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.primary_image}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{item.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            Seller: <span className="font-medium text-slate-700">{item.seller_name}</span> &bull; {item.seller_campus}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{Number(item.price_at_purchase).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer status & Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Pickup Point: <strong>{ord.pickup_location}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/orders/${ord.id}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      Order Details & Timeline
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* MY SALES TAB */
        sales.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No items sold yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              When fellow students purchase your listed essentials, order coordination requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Order: {sale.order_code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(sale.order_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 text-xs font-semibold border rounded-full ${statusColors[sale.order_status]}`}>
                    {sale.order_status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={sale.primary_image}
                      alt={sale.product_title}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{sale.product_title}</h4>
                      <p className="text-[11px] text-slate-500">
                        Purchased by: <strong className="text-slate-800">{sale.buyer_name}</strong> ({sale.buyer_college})
                      </p>
                      <p className="text-[11px] text-slate-400">Buyer Phone: {sale.buyer_phone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{Number(sale.price_at_purchase).toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Meetup Point: <strong>{sale.pickup_location}</strong></span>
                  </div>

                  {/* Seller Status Controls */}
                  <div className="flex items-center gap-2">
                    {sale.order_status === 'Confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(sale.order_id, 'Ready for Pickup')}
                        className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
                      >
                        Mark Ready for Pickup
                      </button>
                    )}
                    {sale.order_status === 'Ready for Pickup' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(sale.order_id, 'Completed')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        Confirm Handover Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
