import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeftRight, 
  BookOpen, 
  Monitor, 
  FlaskConical, 
  PenTool, 
  Calculator, 
  Backpack, 
  Trophy, 
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, categoryService } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [exchangeProducts, setExchangeProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Category Icon mapping
  const categoryIcons = {
    'BookOpen': BookOpen,
    'Monitor': Monitor,
    'FlaskConical': FlaskConical,
    'PenTool': PenTool,
    'Calculator': Calculator,
    'Backpack': Backpack,
    'Trophy': Trophy,
    'Layers': Layers,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, featRes, recRes, popRes, exchRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeatured(),
          productService.getRecent(),
          productService.getPopular(),
          productService.getExchangeProducts(),
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories || []);
        if (featRes.data.success) setFeaturedProducts(featRes.data.products || []);
        if (recRes.data.success) setRecentProducts(recRes.data.products || []);
        if (popRes.data.success) setPopularProducts(popRes.data.products || []);
        if (exchRes.data.success) setExchangeProducts((exchRes.data.products || []).slice(0, 4));
      } catch (err) {
        console.error('Home page data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-teal-400 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Campus Exchange & Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Buy, Sell & Exchange Essentials <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              Across Your Campus Community
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Connect directly with verified students to trade textbooks, calculators, electronics, lab equipment, and sports gear. Negotiate real-time prices or propose item-for-item exchanges.
          </p>

          {/* Quick Hero Search */}
          <form onSubmit={handleHeroSearch} className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center bg-white rounded-full p-1.5 shadow-xl">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 mr-2" />
              <input
                type="text"
                placeholder="What are you looking for today? (e.g. fx-991EX, B.S. Grewal)"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full text-slate-900 text-xs sm:text-sm bg-transparent focus:outline-none placeholder-slate-400 pr-2"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-full transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/browse"
              className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
            >
              Shop Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/exchange"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs sm:text-sm font-bold rounded-xl transition-colors border border-slate-700 inline-flex items-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Explore Exchange Hub
            </Link>
            <Link
              to="/my-listings/add"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Sell an Item
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Product Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore by Category</h2>
              <p className="text-xs text-slate-500 mt-0.5">Find student essentials categorized for quick campus access</p>
            </div>
            <Link to="/browse" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              All categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {categories.map((cat) => {
              const IconComp = categoryIcons[cat.icon] || Layers;
              return (
                <Link
                  key={cat.id}
                  to={`/browse?category=${cat.slug}`}
                  className="group p-4 bg-white border border-slate-200/90 rounded-2xl hover:border-teal-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-700 flex items-center justify-center transition-colors">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {cat.product_count} {cat.product_count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Featured Campus Listings</h2>
                <p className="text-xs text-slate-500">Handpicked high-demand textbooks and equipment</p>
              </div>
            </div>
            <Link to="/browse" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Products Available for Exchange Banner & Grid */}
        <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-teal-200/80 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold mb-2">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Zero-Cash Barter System</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Products Available for Direct Exchange
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Sellers of these items are open to exchanging for other books, calculators, and equipment.
              </p>
            </div>
            <Link
              to="/exchange"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              Browse All Exchangeable Items
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {exchangeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Recently Added Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Recently Added</h2>
                <p className="text-xs text-slate-500">Fresh listings added by students today</p>
              </div>
            </div>
            <Link to="/browse?sort=newest" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              View newest <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Most Popular on Campus</h2>
                <p className="text-xs text-slate-500">Listings receiving the highest student views</p>
              </div>
            </div>
            <Link to="/browse?sort=popular" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              View popular <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
