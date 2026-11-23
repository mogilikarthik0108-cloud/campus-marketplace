import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  ArrowLeftRight, 
  Tag, 
  MapPin, 
  User, 
  Star, 
  ShieldCheck, 
  Share2, 
  Phone, 
  Mail, 
  ChevronRight,
  Clock,
  CheckCircle,
  Eye,
  MessageCircle
} from 'lucide-react';
import { productService, reviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import OfferModal from '../components/OfferModal';
import ExchangeModal from '../components/ExchangeModal';
import ProductCard from '../components/ProductCard';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await productService.getProductById(id);
        if (res.data.success) {
          setProduct(res.data.product);
          setSelectedImage(res.data.product.primary_image || (res.data.product.images[0]?.image_url));
        }
      } catch (err) {
        console.error('Fetch product error:', err);
        setError('Product listing not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Item Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'Unable to load product.'}</p>
        <Link
          to="/browse"
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-teal-700"
        >
          Return to Browse
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === product.seller_id;
  const isSold = product.status === 'sold';
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, 1);
      alert('Product added to cart!');
    } catch (err) {
      alert(err.message || 'Could not add to cart.');
    }
  };

  const handleBuyNow = async () => {
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

  const handleToggleWishlist = async () => {
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await reviewService.submitReview({
        product_id: product.id,
        seller_id: product.seller_id,
        rating,
        comment: comment.trim()
      });

      if (res.data.success) {
        setReviewSuccess('Review posted successfully!');
        setComment('');
        // Refresh product to show review
        const updated = await productService.getProductById(id);
        if (updated.data.success) {
          setProduct(updated.data.product);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Condition Badge colors
  const conditionColors = {
    'New': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Like New': 'bg-teal-50 text-teal-800 border-teal-200',
    'Good': 'bg-blue-50 text-blue-800 border-blue-200',
    'Fair': 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const discountPercent = product.original_price && Number(product.original_price) > Number(product.price)
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/browse" className="hover:text-slate-900">Browse</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={`/browse?category=${product.category_slug}`} className="hover:text-slate-900">
          {product.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-xs">
            <img
              src={selectedImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {isSold && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-1.5 bg-rose-600 text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-lg">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img.image_url ? 'border-teal-600 ring-2 ring-teal-600/20' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Purchase Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category, Condition, and Views */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-800 rounded-md">
                {product.category_name}
              </span>
              <span className={`px-2.5 py-1 text-xs font-semibold border rounded-md ${conditionColors[product.condition_state]}`}>
                Condition: {product.condition_state}
              </span>
              {product.exchange_available === 1 && (
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Exchange Available
                </span>
              )}
              <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {product.views_count} views
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {product.title}
            </h1>

            {/* Price section */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">Selling Price</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{Number(product.price).toLocaleString()}
                  </span>
                  {product.original_price && Number(product.original_price) > Number(product.price) && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{Number(product.original_price).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {discountPercent && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Exchange Details Banner if enabled */}
            {product.exchange_available === 1 && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-900">Seller accepts product exchanges</p>
                    <p className="text-emerald-700 mt-0.5">
                      Preferred item: <span className="font-medium text-emerald-950">{product.preferred_exchange || 'Open to relevant student items'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-4 border border-slate-200 rounded-xl">
                {product.description}
              </p>
            </div>

            {/* Pickup Campus Location */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-teal-700 flex-shrink-0" />
              <span>Campus Pickup: <strong className="text-slate-800">{product.campus_location}</strong></span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            {!isSold && !isOwner ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="py-3 px-4 bg-slate-900 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    Buy Now
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Make an Offer Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) return navigate('/login');
                      setIsOfferModalOpen(true);
                    }}
                    className="py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-amber-700" />
                    Make an Offer
                  </button>

                  {/* Propose Exchange Button */}
                  {product.exchange_available === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) return navigate('/login');
                        setIsExchangeModalOpen(true);
                      }}
                      className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
                      Propose Exchange
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                      {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
                    </button>
                  )}
                </div>
              </>
            ) : isOwner ? (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-center">
                <p className="text-xs font-bold text-teal-900">You listed this product</p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <Link
                    to={`/my-listings/edit/${product.id}`}
                    className="px-4 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800"
                  >
                    Edit Listing
                  </Link>
                  <Link
                    to="/my-listings"
                    className="px-4 py-1.5 bg-white text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    View in My Listings
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-500">
                This item has been purchased and is no longer available.
              </div>
            )}

            {/* Wishlist toggle link if exchange was displayed */}
            {!isOwner && product.exchange_available === 1 && (
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                {wishlisted ? 'Remove from Saved Wishlist' : 'Save to Wishlist for later'}
              </button>
            )}
          </div>

          {/* Seller Card Box */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Information</h4>
            <div className="flex items-center gap-3">
              <img
                src={product.seller_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller_name)}&background=0f172a&color=fff`}
                alt={product.seller_name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-bold text-slate-900 truncate">{product.seller_name}</h5>
                <p className="text-xs text-slate-500 truncate">{product.seller_college}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-800 ml-1">{product.seller_rating_avg}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">({product.seller_reviews_count} reviews)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {product.seller_campus}
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Student
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Student Reviews & Feedback</h3>
            <p className="text-xs text-slate-500">Peer verified feedback for this item and seller</p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-900">{product.seller_rating_avg}</span>
            <span className="text-xs text-slate-500">/ 5.0</span>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer_name)}&background=0f172a&color=fff`}
                      alt={rev.reviewer_name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-900">{rev.reviewer_name}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                )}
                <span className="text-[10px] text-slate-400 block">
                  {new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              No reviews yet for this listing. Be the first to share your experience after purchasing!
            </p>
          )}
        </div>

        {/* Add Review Form */}
        {!isOwner && isAuthenticated && (
          <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Leave a Review for this Seller</h4>
            
            {reviewSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg">{reviewSuccess}</p>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows="2"
              placeholder="Write a brief comment about item condition, accuracy, or pickup punctuality..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </section>

      {/* Similar Products */}
      {product.similar && product.similar.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Similar Items from {product.category_name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.similar.map((sim) => (
              <ProductCard key={sim.id} product={sim} />
            ))}
          </div>
        </section>
      )}

      {/* Offer Modal */}
      <OfferModal
        product={product}
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSuccess={() => {
          navigate('/negotiations');
        }}
      />

      {/* Exchange Modal */}
      <ExchangeModal
        requestedProduct={product}
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        onSuccess={() => {
          navigate('/exchange-requests');
        }}
      />
    </div>
  );
}
