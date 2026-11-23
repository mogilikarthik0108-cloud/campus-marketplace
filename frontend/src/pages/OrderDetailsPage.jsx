import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  User, 
  Package,
  ShieldCheck
} from 'lucide-react';
import { orderService } from '../services/api';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await orderService.getOrderById(id);
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error('Fetch order details error:', err);
        setError('Order details could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-400">Loading order information...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <Link to="/orders" className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl">
          Back to Orders
        </Link>
      </div>
    );
  }

  const steps = ['Placed', 'Confirmed', 'Ready for Pickup', 'Completed'];
  const currentStepIdx = steps.indexOf(order.order_status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Link
          to="/orders"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order #{order.order_code}</h1>
          <p className="text-xs text-slate-500">
            Placed on {new Date(order.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Status Timeline</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {steps.map((st, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={st} className="space-y-2">
                <div className={`h-2 rounded-full transition-all ${
                  isCompleted ? 'bg-teal-600' : 'bg-slate-200'
                }`} />
                <p className={`text-xs font-bold ${
                  isCurrent ? 'text-teal-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {st}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchased Items */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
          Order Items ({order.items?.length || 0})
        </h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={item.primary_image}
                  alt={item.title}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500">Condition: {item.condition_state}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seller: <strong className="text-slate-700">{item.seller_name}</strong> &bull; {item.seller_campus}
                  </p>
                  {item.seller_phone && (
                    <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> Contact: {item.seller_phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-slate-900 block">
                  ₹{Number(item.price_at_purchase).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup Coordination & Payment Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Campus Pickup Coordination</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Designated Meetup Point:</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{order.pickup_location}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Delivery Type:</span>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{order.delivery_type}</p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Contact Phone:</span>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{order.contact_phone}</p>
          </div>
          {order.notes && (
            <div>
              <span className="text-[11px] text-slate-400 block">Special Instructions:</span>
              <p className="text-xs text-slate-600 italic mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>Payment Summary</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Payment Option:</span>
            <span className="font-semibold text-slate-800">{order.payment_method}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Payment Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              order.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {order.payment_status}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Total Paid:</span>
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{Number(order.total_amount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
