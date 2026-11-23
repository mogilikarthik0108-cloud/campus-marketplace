import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeftRight, MapPin, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product, onMakeOffer }) {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const isSold = product.status === 'sold';
  const isOwner = user && user.id === product.seller_id;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      alert(err.message || 'Could not add to cart.');
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, 1);
      navigate('/cart');
    } catch (err) {
      alert(err.message || 'Could not proceed to buy.');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Condition Badge colors
  const conditionColors = {
    'New': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Like New': 'bg-teal-50 text-teal-700 border-teal-200',
    'Good': 'bg-blue-50 text-blue-700 border-blue-200',
    'Fair': 'bg-amber-50 text-amber-700 border-amber-200',
  };

  // Calculate discount percentage
  const discountPercent = product.original_price && Number(product.original_price) > Number(product.price)
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : null;

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
      {/* Top Media & Badges */}
      <Link to={`/products/${product.id}`} className="block relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={product.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          <span className={`px-2 py-0.5 text-[11px] font-semibold border rounded-md shadow-xs ${conditionColors[product.condition_state] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {product.condition_state}
          </span>
          {product.exchange_available === 1 && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 text-white rounded-md shadow-xs flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3" />
              Exchange Available
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Save to wishlist"
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-500 hover:text-rose-500 hover:bg-white shadow-xs transition-colors z-10"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-md">
              Sold
            </span>
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 gap-2">
            <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {product.category_name || 'General'}
            </span>
            <span className="truncate flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3" />
              {product.campus_location?.split(',')[0]}
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 hover:text-teal-700 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Seller info */}
          <p className="text-xs text-slate-500 mt-1">
            Listed by <span className="font-medium text-slate-700">{product.seller_name || 'Student'}</span>
          </p>
        </div>

        {/* Price & Actions */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900">
                  ₹{Number(product.price).toLocaleString()}
                </span>
                {product.original_price && Number(product.original_price) > Number(product.price) && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{Number(product.original_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {discountPercent && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {!isSold && !isOwner ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-1.5 px-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                Buy Now
              </button>
            </div>
          ) : isOwner ? (
            <div className="py-1.5 px-2 bg-slate-50 border border-slate-200 text-center text-xs font-medium text-slate-600 rounded-lg">
              Your Listing
            </div>
          ) : (
            <div className="py-1.5 px-2 bg-slate-100 text-center text-xs font-medium text-slate-400 rounded-lg">
              Item Sold
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
