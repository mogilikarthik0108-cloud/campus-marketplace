import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';

export default function CheckoutPage() {
  const { cartItems, total, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pickupLocation, setPickupLocation] = useState('Central Library Main Gate');
  const [customLocation, setCustomLocation] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone_number || '');
  const [deliveryType, setDeliveryType] = useState('Campus Pickup');
  const [paymentMethod, setPaymentMethod] = useState('UPI Simulation');
  const [notes, setNotes] = useState('');

  // Simulated UPI state
  const [simulatedUpiId, setSimulatedUpiId] = useState('student@okcampus');
  const [upiPaidSuccess, setUpiPaidSuccess] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (cartItems.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Items to Checkout</h2>
        <p className="text-xs text-slate-500 mb-4">Your cart is currently empty.</p>
        <Link to="/browse" className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Predefined pickup spots on campus
  const pickupSpots = [
    'Central Library Main Gate',
    'Student Activity Center (SAC) Canteen',
    'Campus North Gate Parking Bay',
    'Engineering Block Foyer',
    'Hostel Dining Hall Lounge',
    'Other / Custom Campus Spot'
  ];

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setError('');

    const finalLocation = pickupLocation === 'Other / Custom Campus Spot' 
      ? customLocation.trim() 
      : pickupLocation;

    if (!finalLocation) {
      setError('Please select or specify a campus meetup & pickup spot.');
      return;
    }

    if (!contactPhone.trim()) {
      setError('Please provide a contact phone number for meetup coordination.');
      return;
    }

    try {
      setSubmitting(true);
      const itemsPayload = cartItems.map(item => ({
        product_id: item.product_id,
        price: item.price,
        quantity: item.quantity
      }));

      const res = await orderService.createOrder({
        items: itemsPayload,
        pickup_location: finalLocation,
        contact_phone: contactPhone.trim(),
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        notes: notes.trim()
      });

      if (res.data.success) {
        setConfirmedOrder(res.data.order);
        await refreshCart();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Error confirming your order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmed Success Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Order Confirmed!</h1>
          <p className="text-xs text-slate-500 mt-1">
            Order Reference ID: <strong className="text-teal-700 font-mono text-sm">{confirmedOrder.order_code}</strong>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Order Summary
          </h3>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total Paid / Payable:</span>
            <span className="font-extrabold text-slate-900 text-base">₹{Number(confirmedOrder.total_amount).toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Payment Option:</span>
            <span className="font-semibold text-slate-800">{confirmedOrder.payment_method} ({confirmedOrder.payment_status})</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Meetup & Pickup Point:</span>
            <span className="font-semibold text-slate-800 text-right max-w-xs">{confirmedOrder.pickup_location}</span>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              Next Step: Campus Meetup
            </p>
            <p className="text-slate-600">
              The seller has received an instant notification. Check your "My Orders" page to track pickup coordination.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/orders"
            className="px-6 py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            View My Orders
          </Link>
          <Link
            to="/browse"
            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Link
          to="/cart"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Checkout</h1>
          <p className="text-xs text-slate-500">Review pickup coordination and finalize your order</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pickup & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pickup Location Selection */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Campus Pickup Spot</h2>
                <p className="text-[11px] text-slate-500">Designated meetup locations on your campus</p>
              </div>
            </div>

            <div className="space-y-2">
              {pickupSpots.map((spot) => (
                <label
                  key={spot}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    pickupLocation === spot
                      ? 'bg-teal-50/70 border-teal-500 font-semibold text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="pickup_spot"
                    value={spot}
                    checked={pickupLocation === spot}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs">{spot}</span>
                </label>
              ))}

              {pickupLocation === 'Other / Custom Campus Spot' && (
                <div className="pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Specify building, block or landmark..."
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              )}
            </div>

            {/* Contact details */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Contact Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery / Handover Type
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="Campus Pickup">Campus Pickup (Standard)</option>
                  <option value="Hostel Delivery">Hostel Delivery</option>
                  <option value="Library Meetup">Library Meetup</option>
                </select>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pickup Timing & Notes (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Free after 3 PM today outside the library cafe..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
              />
            </div>
          </div>

          {/* Simulated Payment Options */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Payment Simulation (Academic Demo)</h2>
                <p className="text-[11px] text-slate-500">Choose simulated payment method</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cash on Pickup */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  paymentMethod === 'Cash on Pickup'
                    ? 'bg-teal-50/70 border-teal-500 text-teal-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <input
                    type="radio"
                    name="payment"
                    value="Cash on Pickup"
                    checked={paymentMethod === 'Cash on Pickup'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-teal-600"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Cash on Pickup</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pay after inspecting item</p>
                </div>
              </label>

              {/* UPI Simulation */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  paymentMethod === 'UPI Simulation'
                    ? 'bg-teal-50/70 border-teal-500 text-teal-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <input
                    type="radio"
                    name="payment"
                    value="UPI Simulation"
                    checked={paymentMethod === 'UPI Simulation'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-teal-600"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">UPI Simulation</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Simulate GPay / PhonePe</p>
                </div>
              </label>

              {/* Demo Payment */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  paymentMethod === 'Demo Payment'
                    ? 'bg-teal-50/70 border-teal-500 text-teal-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <input
                    type="radio"
                    name="payment"
                    value="Demo Payment"
                    checked={paymentMethod === 'Demo Payment'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-teal-600"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Demo Card</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Direct simulated checkout</p>
                </div>
              </label>
            </div>

            {/* Interactive UPI Simulation Box */}
            {paymentMethod === 'UPI Simulation' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-1 flex-shrink-0">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Simulated Campus UPI QR</p>
                    <p className="text-slate-500 text-[11px]">UPI ID: campuscart@demo.bank</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      Ready to authorize ₹{Number(total).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Review Order Items ({cartItems.length})
            </h2>

            {/* Items scroll */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="flex items-center gap-3">
                  <img
                    src={item.primary_image}
                    alt={item.title}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity} &bull; Seller: {item.seller_name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    ₹{Number(item.itemTotal).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{Number(total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Meetup Fee</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl font-extrabold text-slate-900">₹{Number(total).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-slate-900 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {submitting ? 'Confirming Order...' : 'Confirm & Place Campus Order'}
            </button>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Campus peer-to-peer verified order</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
