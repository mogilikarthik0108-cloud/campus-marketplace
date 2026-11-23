import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { productService, categoryService } from '../services/api';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [conditionState, setConditionState] = useState('Good');
  const [status, setStatus] = useState('available');
  const [exchangeAvailable, setExchangeAvailable] = useState(false);
  const [preferredExchange, setPreferredExchange] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [primaryImage, setPrimaryImage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getProductById(id),
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories);
        if (prodRes.data.success) {
          const p = prodRes.data.product;
          setTitle(p.title);
          setCategoryId(p.category_id.toString());
          setDescription(p.description);
          setPrice(p.price.toString());
          setOriginalPrice(p.original_price ? p.original_price.toString() : '');
          setConditionState(p.condition_state);
          setStatus(p.status);
          setExchangeAvailable(p.exchange_available === 1);
          setPreferredExchange(p.preferred_exchange || '');
          setCampusLocation(p.campus_location);
          setContactInfo(p.contact_info || '');
          setPrimaryImage(p.primary_image || '');
        }
      } catch (err) {
        console.error('Edit product load error:', err);
        setError('Could not load product for editing.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const res = await productService.updateProduct(id, {
        title: title.trim(),
        category_id: parseInt(categoryId, 10),
        description: description.trim(),
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        condition_state: conditionState,
        status,
        exchange_available: exchangeAvailable,
        preferred_exchange: exchangeAvailable ? preferredExchange.trim() : null,
        campus_location: campusLocation.trim(),
        contact_info: contactInfo.trim(),
        primary_image: primaryImage.trim()
      });

      if (res.data.success) {
        navigate('/my-listings');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating product.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-400">Loading product information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/my-listings"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Listing</h1>
          <p className="text-xs text-slate-500">Update pricing, condition or availability status</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Product Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Condition</label>
            <select
              value={conditionState}
              onChange={(e) => setConditionState(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Listing Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Price (₹)</label>
            <input
              type="number"
              step="any"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Original Price (₹)</label>
            <input
              type="number"
              step="any"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Description</label>
          <textarea
            rows="4"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">Primary Image URL</label>
          <input
            type="url"
            value={primaryImage}
            onChange={(e) => setPrimaryImage(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {/* Exchange Available */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exchangeAvailable}
              onChange={(e) => setExchangeAvailable(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
              Enable Product Exchange
            </span>
          </label>

          {exchangeAvailable && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Exchange Item</label>
              <input
                type="text"
                value={preferredExchange}
                onChange={(e) => setPreferredExchange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-emerald-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Campus Pickup Location</label>
            <input
              type="text"
              required
              value={campusLocation}
              onChange={(e) => setCampusLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Contact Phone or Email</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/my-listings"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
