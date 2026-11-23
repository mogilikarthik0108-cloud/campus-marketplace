import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { wishlistService } from '../services/api';
import { useCart } from '../context/CartContext';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshCart } = useCart();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistService.getWishlist();
      if (res.data.success) {
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      fetchWishlist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      const res = await wishlistService.moveToCart(productId);
      if (res.data.success) {
        await refreshCart();
        fetchWishlist();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error moving to cart.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Saved Wishlist</h1>
        <p className="text-xs text-slate-500 mt-1">
          Items you are saving for current or upcoming academic semesters
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading saved items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click the heart icon on any product card or details page to bookmark student essentials.
          </p>
          <Link
            to="/browse"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.wishlist_id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <Link to={`/products/${item.product_id}`} className="block aspect-[4/3] bg-slate-100 overflow-hidden relative">
                <img
                  src={item.primary_image}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleRemove(item.product_id); }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-full text-slate-500 hover:text-rose-600 shadow-xs"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Link>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {item.category_name}
                  </span>
                  <Link to={`/products/${item.product_id}`} className="block mt-1">
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-teal-700">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Seller: {item.seller_name} &bull; {item.campus_location}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-base font-extrabold text-slate-900 block">
                    ₹{Number(item.price).toLocaleString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item.product_id)}
                    className="w-full py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Move to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
