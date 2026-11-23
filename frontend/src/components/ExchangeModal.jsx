import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exchangeService, productService } from '../services/api';

export default function ExchangeModal({ requestedProduct, isOpen, onClose, onSuccess }) {
  const [myProducts, setMyProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [message, setMessage] = useState('');
  const [loadingListings, setLoadingListings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchMyListings = async () => {
        try {
          setLoadingListings(true);
          const res = await productService.getMyListings();
          if (res.data.success) {
            // Filter only available items
            const available = (res.data.products || []).filter(p => p.status === 'available');
            setMyProducts(available);
            if (available.length > 0) {
              setSelectedProductId(available[0].id.toString());
            }
          }
        } catch (err) {
          console.error('Fetch listings error:', err);
        } finally {
          setLoadingListings(false);
        }
      };
      fetchMyListings();
    }
  }, [isOpen]);

  if (!isOpen || !requestedProduct) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProductId) {
      setError('Please select an item from your listings to offer in exchange.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await exchangeService.proposeExchange({
        requested_product_id: requestedProduct.id,
        offered_product_id: parseInt(selectedProductId, 10),
        message: message.trim() || undefined
      });

      if (res.data.success) {
        setSuccessMsg('Exchange request proposed to the seller!');
        setTimeout(() => {
          onSuccess && onSuccess(res.data);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send exchange request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Propose Product Exchange</h3>
              <p className="text-[11px] text-slate-500">Trade your item for this product</p>
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

        {/* Modal Body */}
        <div className="p-5">
          {/* Target requested item snippet */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              You are requesting:
            </span>
            <div className="flex items-center gap-3">
              <img
                src={requestedProduct.primary_image}
                alt={requestedProduct.title}
                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-900 truncate">{requestedProduct.title}</h4>
                <p className="text-[11px] text-slate-500">Seller: {requestedProduct.seller_name}</p>
                {requestedProduct.preferred_exchange && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Seller looking for: {requestedProduct.preferred_exchange}
                  </p>
                )}
              </div>
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

          {loadingListings ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading your listings...</div>
          ) : myProducts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-600 mb-3">
                You do not have any active product listings to offer for exchange.
              </p>
              <Link
                to="/my-listings/add"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                List an Item to Exchange
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Choose which of your items to offer:
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {myProducts.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedProductId === p.id.toString()
                          ? 'bg-teal-50/80 border-teal-500'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="offered_product"
                        value={p.id}
                        checked={selectedProductId === p.id.toString()}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <img
                        src={p.primary_image}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded-md border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-500">Value: ₹{Number(p.price).toLocaleString()} &bull; {p.condition_state}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exchange Proposal Note (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Explain why this exchange is beneficial or describe your item's condition..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Send Exchange Proposal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
