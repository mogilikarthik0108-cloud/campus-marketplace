import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { 
    cartItems, 
    subtotal, 
    total, 
    itemCount, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    loading 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In to View Your Cart</h2>
        <p className="text-xs text-slate-500 mb-6">
          Your saved items will automatically appear here once you log in with your campus account.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
          Explore books, calculators, electronics and lab gear listed by students on your campus.
        </p>
        <Link
          to="/browse"
          className="px-6 py-3 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
        >
          Explore Campus Marketplace
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const hasUnavailableItems = cartItems.some(item => !item.isAvailable);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-1">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for campus meetup & pickup
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-semibold"
        >
          Clear Cart
        </button>
      </div>

      {hasUnavailableItems && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            One or more items in your cart have been marked as sold or unavailable. Please remove them to proceed with checkout.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.cart_item_id}
              className={`p-4 bg-white border rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                !item.isAvailable ? 'opacity-60 border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={item.primary_image}
                  alt={item.title}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.condition_state}
                    </span>
                    {!item.isAvailable && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        SOLD OUT
                      </span>
                    )}
                  </div>
                  <Link to={`/products/${item.product_id}`} className="block">
                    <h3 className="text-sm font-bold text-slate-900 truncate hover:text-teal-700">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seller: <span className="font-medium text-slate-700">{item.seller_name}</span> &bull; {item.seller_college}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> Pickup: {item.campus_location}
                  </p>
                </div>
              </div>

              {/* Quantity & Price */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                {/* Quantity Controls */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal for item */}
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 block">
                    ₹{Number(item.itemTotal).toLocaleString()}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[10px] text-slate-400 block">
                      (₹{Number(item.price).toLocaleString()} each)
                    </span>
                  )}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(item.cart_item_id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove from cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              to="/browse"
              className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              &larr; Continue shopping other campus categories
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{Number(subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Meetup & Pickup</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Brokerage Fee</span>
                <span className="font-semibold text-emerald-700">₹0 (Zero Fee)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Amount</span>
              <span className="text-2xl font-extrabold text-slate-900">
                ₹{Number(total).toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              disabled={hasUnavailableItems || cartItems.length === 0}
              onClick={() => navigate('/checkout')}
              className="w-full py-3 bg-slate-900 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Proceed to Campus Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Hand-to-hand inspection before pickup payment
              </p>
              <p className="pl-5">Direct coordination via student phone or campus meetup point.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
