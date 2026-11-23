import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  ArrowUpDown, 
  X, 
  SlidersHorizontal,
  Tag,
  ArrowLeftRight
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, categoryService } from '../services/api';

export default function BrowseProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state initialized from query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'all');
  const [exchangeOnly, setExchangeOnly] = useState(searchParams.get('exchangeOnly') === 'true');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  // Update state when URL query params change
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedCondition(searchParams.get('condition') || 'all');
    setExchangeOnly(searchParams.get('exchangeOnly') === 'true');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSortBy(searchParams.get('sort') || 'newest');
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  // Fetch filtered products
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: 12,
          sort: sortBy
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        if (selectedCondition && selectedCondition !== 'all') params.condition = selectedCondition;
        if (exchangeOnly) params.exchangeOnly = 'true';
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const res = await productService.getProducts(params);
        if (res.data.success) {
          setProducts(res.data.products || []);
          setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
        }
      } catch (err) {
        console.error('Fetch products error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [search, selectedCategory, selectedCondition, exchangeOnly, minPrice, maxPrice, sortBy, currentPage]);

  const applyFilters = () => {
    const newParams = new URLSearchParams();
    if (search.trim()) newParams.set('search', search.trim());
    if (selectedCategory !== 'all') newParams.set('category', selectedCategory);
    if (selectedCondition !== 'all') newParams.set('condition', selectedCondition);
    if (exchangeOnly) newParams.set('exchangeOnly', 'true');
    if (minPrice) newParams.set('minPrice', minPrice);
    if (maxPrice) newParams.set('maxPrice', maxPrice);
    if (sortBy !== 'newest') newParams.set('sort', sortBy);
    newParams.set('page', '1');
    setSearchParams(newParams);
    setMobileFilterOpen(false);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setExchangeOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
    setMobileFilterOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Products</h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {pagination.total} student items available across campus
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-xs font-medium text-slate-500 hidden sm:inline">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                const updated = new URLSearchParams(searchParams);
                updated.set('sort', e.target.value);
                setSearchParams(updated);
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} lg:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>Filter Results</span>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-teal-700 hover:underline font-medium"
            >
              Reset
            </button>
          </div>

          {/* Search Input Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keywords</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Product name, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Category</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  const updated = new URLSearchParams(searchParams);
                  updated.delete('category');
                  setSearchParams(updated);
                }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === 'all' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c.slug);
                    const updated = new URLSearchParams(searchParams);
                    updated.set('category', c.slug);
                    setSearchParams(updated);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === c.slug ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-400">({c.product_count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Item Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['all', 'New', 'Like New', 'Good', 'Fair'].map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => {
                    setSelectedCondition(cond);
                    const updated = new URLSearchParams(searchParams);
                    if (cond === 'all') updated.delete('condition');
                    else updated.set('condition', cond);
                    setSearchParams(updated);
                  }}
                  className={`px-2 py-1.5 text-xs rounded-lg border text-center transition-colors ${
                    selectedCondition === cond
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cond === 'all' ? 'Any Condition' : cond}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Price Range (₹)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Exchange Availability Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exchangeOnly}
                onChange={(e) => {
                  setExchangeOnly(e.target.checked);
                  const updated = new URLSearchParams(searchParams);
                  if (e.target.checked) updated.set('exchangeOnly', 'true');
                  else updated.delete('exchangeOnly');
                  setSearchParams(updated);
                }}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                Exchange Available Only
              </span>
            </label>
          </div>

          {/* Apply Filter Button */}
          <button
            type="button"
            onClick={applyFilters}
            className="w-full py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Apply Filters
          </button>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Tags */}
          {(search || selectedCategory !== 'all' || selectedCondition !== 'all' || exchangeOnly || minPrice || maxPrice) && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
              <span className="font-semibold text-slate-500">Active Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700">
                  Keyword: "{search}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-md font-medium">
                  Category: {selectedCategory}
                </span>
              )}
              {selectedCondition !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700">
                  Condition: {selectedCondition}
                </span>
              )}
              {exchangeOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-medium">
                  Exchange Enabled
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700">
                  ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try loosening your filters, adjusting the price range, or searching for broader terms.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  const newP = currentPage - 1;
                  setCurrentPage(newP);
                  const updated = new URLSearchParams(searchParams);
                  updated.set('page', newP.toString());
                  setSearchParams(updated);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-xs text-slate-500 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => {
                  const newP = currentPage + 1;
                  setCurrentPage(newP);
                  const updated = new URLSearchParams(searchParams);
                  updated.set('page', newP.toString());
                  setSearchParams(updated);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
