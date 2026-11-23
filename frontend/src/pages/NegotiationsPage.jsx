import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Tag, 
  Check, 
  X, 
  RotateCcw, 
  MessageSquare, 
  ShoppingBag, 
  ArrowRight, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { negotiationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function NegotiationsPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded negotiation message histories
  const [expandedOfferId, setExpandedOfferId] = useState(null);
  const [activeNegotiation, setActiveNegotiation] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Counter offer modal state
  const [counterModalNego, setCounterModalNego] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await negotiationService.getNegotiations();
      if (res.data.success) {
        setReceivedOffers(res.data.receivedOffers || []);
        setSentOffers(res.data.sentOffers || []);
      }
    } catch (err) {
      console.error('Fetch negotiations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleToggleDetails = async (negoId) => {
    if (expandedOfferId === negoId) {
      setExpandedOfferId(null);
      setActiveNegotiation(null);
      return;
    }

    try {
      setExpandedOfferId(negoId);
      setLoadingDetails(true);
      const res = await negotiationService.getNegotiationById(negoId);
      if (res.data.success) {
        setActiveNegotiation(res.data.negotiation);
      }
    } catch (err) {
      console.error('Fetch details error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRespond = async (negoId, action, extra = {}) => {
    try {
      setSubmittingAction(true);
      const res = await negotiationService.respondOffer(negoId, { action, ...extra });
      if (res.data.success) {
        setCounterModalNego(null);
        setCounterPrice('');
        setCounterMessage('');
        fetchOffers();
        if (expandedOfferId === negoId) {
          handleToggleDetails(negoId);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing offer action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleBuyAcceptedOffer = async (nego) => {
    try {
      await addToCart(nego.product_id, 1);
      navigate('/cart');
    } catch (err) {
      alert(err.message || 'Could not add negotiated item to cart.');
    }
  };

  const statusBadges = {
    'Pending': 'bg-amber-50 text-amber-800 border-amber-200',
    'Countered': 'bg-blue-50 text-blue-800 border-blue-200',
    'Accepted': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Rejected': 'bg-rose-50 text-rose-800 border-rose-200',
    'Expired': 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const currentList = activeTab === 'received' ? receivedOffers : sentOffers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price Negotiations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review proposed offers, negotiate counter-prices, and accept deals in real time
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setActiveTab('received'); setExpandedOfferId(null); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'received' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Offers Received ({receivedOffers.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('sent'); setExpandedOfferId(null); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'sent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Offers Made ({sentOffers.length})
          </button>
        </div>
      </div>

      {/* Offer Cards List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading negotiations...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'received' ? 'No incoming offers right now' : 'You haven’t made any offers yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'received'
              ? 'When buyers propose custom prices for your listings, they will show up here.'
              : 'Find products on the marketplace and use "Make an Offer" to negotiate a student price.'}
          </p>
          <Link
            to="/browse"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((item) => {
            const isReceived = activeTab === 'received';
            const counterpartyName = isReceived ? item.buyer_name : item.seller_name;
            const counterpartyAvatar = isReceived ? item.buyer_avatar : item.seller_avatar;
            const isExpanded = expandedOfferId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Top snippet: Product + Counterparty + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <Link to={`/products/${item.product_id}`} className="block">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-teal-700">
                          {item.product_title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isReceived ? 'Buyer:' : 'Seller:'} <strong className="text-slate-700">{counterpartyName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Offered Amount</span>
                      <span className="text-lg font-extrabold text-teal-700">
                        ₹{Number(item.current_offered_price).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through block -mt-1">
                        Listed: ₹{Number(item.original_price).toLocaleString()}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-bold border rounded-full ${statusBadges[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Response / Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleDetails(item.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isExpanded ? 'Hide Negotiation History' : 'View Negotiation History'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* If item is pending/countered and you are seller (or buyer responding to counter) */}
                    {(item.status === 'Pending' || item.status === 'Countered') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespond(item.id, 'accept')}
                          disabled={submittingAction}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => setCounterModalNego(item)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          Counter Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(item.id, 'reject')}
                          disabled={submittingAction}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </>
                    )}

                    {/* If buyer and offer was Accepted */}
                    {!isReceived && item.status === 'Accepted' && (
                      <button
                        type="button"
                        onClick={() => handleBuyAcceptedOffer(item)}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Buy at Negotiated Price (₹{Number(item.current_offered_price).toLocaleString()})
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Chat / Counter-Offer History */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50/70 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Negotiation Timeline
                    </h4>

                    {loadingDetails ? (
                      <p className="text-xs text-slate-400">Loading conversation history...</p>
                    ) : activeNegotiation?.messages?.length > 0 ? (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {activeNegotiation.messages.map((msg) => {
                          const isMe = msg.sender_id === user.id;
                          return (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl text-xs max-w-md ${
                                isMe
                                  ? 'ml-auto bg-slate-900 text-white'
                                  : 'mr-auto bg-white border border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 mb-1">
                                <span className={`font-bold ${isMe ? 'text-teal-300' : 'text-slate-900'}`}>
                                  {isMe ? 'You' : msg.sender_name} ({msg.action_type})
                                </span>
                                <span className={`font-mono font-bold ${isMe ? 'text-emerald-300' : 'text-teal-700'}`}>
                                  ₹{Number(msg.offered_price).toLocaleString()}
                                </span>
                              </div>
                              {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                              <span className={`text-[10px] mt-1 block ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No message details found.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModalNego && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Propose Counter-Offer Price
            </h3>
            <p className="text-xs text-slate-500">
              Current offered price: <strong className="text-slate-800">₹{counterModalNego.current_offered_price}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Counter Price (₹)</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="Enter counter price"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Note (Optional)</label>
              <textarea
                rows="2"
                placeholder="Explain your counter-offer..."
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCounterModalNego(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !counterPrice}
                onClick={() => handleRespond(counterModalNego.id, 'counter', { counterPrice, message: counterMessage })}
                className="px-4 py-1.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                {submittingAction ? 'Sending...' : 'Send Counter Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
