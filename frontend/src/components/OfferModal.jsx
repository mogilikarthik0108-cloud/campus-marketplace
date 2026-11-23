import React, { useState } from 'react';
import { X, Tag, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { negotiationService } from '../services/api';

export default function OfferModal({ product, isOpen, onClose, onSuccess }) {
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !product) return null;

  const originalPrice = Number(product.price);

  const handleQuickPercent = (discount) => {
    const discounted = Math.round(originalPrice * (1 - discount / 100));
    setOfferedPrice(discounted.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const priceNum = parseFloat(offeredPrice);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid offer price.');
      return;
    }

    if (priceNum >= originalPrice) {
      setError(`Your offer must be lower than the listed price (₹${originalPrice}). To buy at full price, use Buy Now.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await negotiationService.createOffer({
        product_id: product.id,
        offered_price: priceNum,
        message: message.trim() || `I would like to offer ₹${priceNum} for this item.`
      });

      if (res.data.success) {
        setSuccessMsg('Offer sent to the seller!');
        setTimeout(() => {
          onSuccess && onSuccess(res.data);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Make an Offer</h3>
              <p className="text-[11px] text-slate-500">Negotiate price directly with seller</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product summary snippet */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4">
            <img
              src={product.primary_image}
              alt={product.title}
              className="w-14 h-14 object-cover rounded-lg border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-900 truncate">{product.title}</h4>
              <p className="text-[11px] text-slate-500">Listed by {product.seller_name}</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Current Price: <span className="text-teal-700">₹{originalPrice.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick discount buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quick Offer Suggestions:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPercent(10)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-xs font-medium rounded-lg transition-colors text-slate-700"
                >
                  10% Off (₹{Math.round(originalPrice * 0.9)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(15)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-xs font-medium rounded-lg transition-colors text-slate-700"
                >
                  15% Off (₹{Math.round(originalPrice * 0.85)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(20)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-xs font-medium rounded-lg transition-colors text-slate-700"
                >
                  20% Off (₹{Math.round(originalPrice * 0.8)})
                </button>
              </div>
            </div>

            {/* Custom Offer Price Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Proposed Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max={originalPrice - 1}
                  step="any"
                  placeholder="Enter your proposed amount"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  required
                  className="w-full pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Optional message to seller */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message to Seller (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Can pick up today at the library, cash ready."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-slate-800"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Sending Offer...' : 'Send Offer to Seller'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
