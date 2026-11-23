import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Sparkles, Filter, Search, Plus } from 'lucide-react';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function ExchangePage() {
  const [exchangeProducts, setExchangeProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');

  useEffect(() => {
    const fetchExchangeItems = async () => {
      try {
        setLoading(true);
        const res = await productService.getExchangeProducts();
        if (res.data.success) {
          setExchangeProducts(res.data.products || []);
        }
      } catch (err) {
        console.error('Fetch exchange items error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeItems();
  }, []);

  const filteredProducts = exchangeProducts.filter((p) => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || 
      (p.preferred_exchange && p.preferred_exchange.toLowerCase().includes(search.toLowerCase()));
    const matchesCondition = filterCondition === 'all' || p.condition_state === filterCondition;
    return matchesSearch && matchesCondition;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Exchange Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-md relative overflow-hidden">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Campus Barter & Item Exchange System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Exchange Items with Fellow Students
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Trade your semester textbooks, electronics, calculators, or lab coats for items you need without spending cash. Browse listings with exchange preferences and propose trades directly.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/exchange-requests"
              className="px-5 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
            >
              View My Exchange Requests
            </Link>
            <Link
              to="/my-listings/add"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              List an Item for Exchange
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search title or preferred item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Condition:</label>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Conditions</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
          <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No exchange items match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for other terms or reset condition filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
