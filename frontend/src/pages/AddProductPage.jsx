import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PackagePlus, 
  Upload, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeftRight,
  Image as ImageIcon
} from 'lucide-react';
import { productService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AddProductPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [conditionState, setConditionState] = useState('Good');
  const [exchangeAvailable, setExchangeAvailable] = useState(false);
  const [preferredExchange, setPreferredExchange] = useState('');
  const [campusLocation, setCampusLocation] = useState(user?.campus_location || '');
  const [contactInfo, setContactInfo] = useState(user?.phone_number || user?.email || '');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.data.success && res.data.categories.length > 0) {
          setCategories(res.data.categories);
          setCategoryId(res.data.categories[0].id.toString());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl(''); // clear direct URL if uploading file
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !categoryId || !description.trim() || !price || !campusLocation.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      let finalPrimaryImage = imageUrl.trim();

      // If a local image file was chosen, upload it first to the backend
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await productService.uploadImage(formData);
        if (uploadRes.data.success) {
          finalPrimaryImage = uploadRes.data.imageUrl;
        }
      }

      // Fallback default image if none provided
      if (!finalPrimaryImage) {
        finalPrimaryImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
      }

      const res = await productService.createProduct({
        title: title.trim(),
        category_id: parseInt(categoryId, 10),
        description: description.trim(),
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        condition_state: conditionState,
        exchange_available: exchangeAvailable,
        preferred_exchange: exchangeAvailable ? preferredExchange.trim() : null,
        campus_location: campusLocation.trim(),
        contact_info: contactInfo.trim(),
        primary_image: finalPrimaryImage,
        images: [finalPrimaryImage]
      });

      if (res.data.success) {
        navigate('/my-listings');
      }
    } catch (err) {
      console.error('Create listing error:', err);
      setError(err.response?.data?.message || 'Error creating product listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/my-listings"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">List an Item for Sale or Exchange</h1>
          <p className="text-xs text-slate-500">Provide details about your student essential</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Product Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Product Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Higher Engineering Mathematics 44th Edition, Casio fx-991EX..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Item Condition <span className="text-rose-500">*</span>
            </label>
            <select
              value={conditionState}
              onChange={(e) => setConditionState(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="New">New (Unopened / Never used)</option>
              <option value="Like New">Like New (Mint condition, no marks)</option>
              <option value="Good">Good (Minor wear, fully functional)</option>
              <option value="Fair">Fair (Noticeable wear, functions properly)</option>
            </select>
          </div>
        </div>

        {/* Price & Original Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Selling Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 450"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Original Price (₹) <span className="text-slate-400 font-normal">(Optional MRP)</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 850"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-600"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows="4"
            required
            placeholder="Describe the edition, highlights, accessories included, and condition..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {/* Image Selection / Upload */}
        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <label className="block text-xs font-bold text-slate-800">
            Product Image
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">Upload Image from Computer:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-teal-700 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">Or enter Image URL:</label>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                  setImageFile(null);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 bg-white"
              />
            </div>
          </div>

          {imagePreview && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-xs"
              />
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Image preview ready
              </span>
            </div>
          )}
        </div>

        {/* Exchange Available Toggle */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={exchangeAvailable}
              onChange={(e) => setExchangeAvailable(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
              Enable Product Exchange (Barter)
            </span>
          </label>

          {exchangeAvailable && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Exchange Item
              </label>
              <input
                type="text"
                placeholder="e.g. Data Structures Textbook, TI-84, or Arduino Kit"
                value={preferredExchange}
                onChange={(e) => setPreferredExchange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-emerald-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          )}
        </div>

        {/* Campus Location & Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Campus Pickup Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. North Campus Library, Hostel Block 4..."
              value={campusLocation}
              onChange={(e) => setCampusLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Contact Phone or Email
            </label>
            <input
              type="text"
              placeholder="+91..."
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Submit */}
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
            {submitting ? 'Listing Product...' : 'Publish Product Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
