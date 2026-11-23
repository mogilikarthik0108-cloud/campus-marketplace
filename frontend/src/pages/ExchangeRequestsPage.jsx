import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftRight, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Package, 
  ArrowRight,
  User
} from 'lucide-react';
import { exchangeService } from '../services/api';

export default function ExchangeRequestsPage() {
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const res = await exchangeService.getExchanges();
      if (res.data.success) {
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      }
    } catch (err) {
      console.error('Fetch exchanges error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  const handleRespond = async (exchangeId, status) => {
    try {
      const res = await exchangeService.respondExchange(exchangeId, status);
      if (res.data.success) {
        fetchExchanges();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating exchange request.');
    }
  };

  const statusBadges = {
    'Pending': 'bg-amber-50 text-amber-800 border-amber-200',
    'Accepted': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Rejected': 'bg-rose-50 text-rose-800 border-rose-200',
    'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200',
    'Completed': 'bg-teal-50 text-teal-800 border-teal-200',
  };

  const currentList = activeTab === 'incoming' ? incoming : outgoing;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exchange Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage peer-to-peer barter proposals and trade student essentials
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'incoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Incoming Proposals ({incoming.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'outgoing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Sent Proposals ({outgoing.length})
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading exchange requests...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
          <ArrowLeftRight className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'incoming' ? 'No incoming exchange proposals' : 'No outgoing exchange proposals'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'incoming'
              ? 'When other students propose trading items for your exchange-enabled products, they appear here.'
              : 'Browse products with exchange enabled and propose your own items in trade.'}
          </p>
          <Link
            to="/exchange"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            Browse Exchange Hub
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((item) => {
            const isIncoming = activeTab === 'incoming';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="text-xs text-slate-500">
                    Requested on {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    {isIncoming ? (
                      <span> &bull; From: <strong className="text-slate-800">{item.requester_name}</strong> ({item.requester_college})</span>
                    ) : (
                      <span> &bull; To Seller: <strong className="text-slate-800">{item.target_seller_name}</strong></span>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 text-xs font-bold border rounded-full ${statusBadges[item.status]}`}>
                    {item.status}
                  </span>
                </div>

                {/* Side-by-side exchange view */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Requested Product */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <img
                      src={item.requested_product_image}
                      alt={item.requested_product_title}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested Item</span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.requested_product_title}</h4>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">₹{Number(item.requested_product_price).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Offered Product */}
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <img
                      src={item.offered_product_image}
                      alt={item.offered_product_title}
                      className="w-14 h-14 rounded-lg object-cover border border-emerald-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Offered in Barter</span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.offered_product_title}</h4>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">₹{Number(item.offered_product_price).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Proposal Message */}
                {item.message && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{item.message}"
                  </p>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  {isIncoming && item.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespond(item.id, 'Accepted')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept Exchange
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(item.id, 'Rejected')}
                        className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </>
                  )}

                  {!isIncoming && item.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleRespond(item.id, 'Cancelled')}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancel Request
                    </button>
                  )}

                  {item.status === 'Accepted' && (
                    <button
                      type="button"
                      onClick={() => handleRespond(item.id, 'Completed')}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                    >
                      Mark Barter Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
