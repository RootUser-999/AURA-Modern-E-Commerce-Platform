import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, RotateCcw } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';

interface CatalogViewProps {
  initialCategory?: string;
  initialQuery?: string;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  initialCategory = 'all',
  initialQuery = '',
  onSelectProduct,
  onQuickView,
  onBuyNow,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(800);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mobile filters drawer
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Listen for category filter events from Navbar
  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      if (e.detail) {
        setSelectedCategory(e.detail);
        setCurrentPage(1);
      }
    };
    window.addEventListener('filter-category', handleCategoryEvent);
    return () => window.removeEventListener('filter-category', handleCategoryEvent);
  }, []);

  // Fetch categories once
  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories)).catch(console.error);
  }, []);

  // Fetch products with active filters
  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: '12',
          sort: sortOption,
        };

        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (inStockOnly) params.inStock = 'true';
        if (maxPrice < 800) params.maxPrice = maxPrice.toString();

        const res = await api.getProducts(params);
        setProducts(res.products);
        setTotalPages(res.totalPages);
        setTotalItems(res.total);
      } catch (err) {
        console.error('Failed fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();
  }, [searchQuery, selectedCategory, sortOption, inStockOnly, maxPrice, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortOption('featured');
    setInStockOnly(false);
    setMaxPrice(800);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    sortOption !== 'featured' ||
    inStockOnly ||
    maxPrice < 800;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Catalog Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E5DF]">
        <div>
          <span className="text-xs font-mono uppercase text-stone-500 tracking-wider">The Permanent Collection</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            Studio Hardware Catalog
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Showing {totalItems} precision design objects calibrated for daily use
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Search Input */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, SKU, brand..."
              className="w-full bg-white border border-[#E5E5DF] text-xs rounded-xl pl-9 pr-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-white border border-[#E5E5DF] rounded-xl px-3 py-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-stone-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured Order</option>
              <option value="bestseller">Bestselling First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">New Releases</option>
            </select>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center gap-2 bg-white border border-[#E5E5DF] rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-800"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && '•'}
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block md:col-span-3 space-y-6 sticky top-24 bg-white p-6 rounded-2xl border border-[#E5E5DF]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Filter Criteria</h3>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
              Category
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer flex justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>All Disciplines</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer flex justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {cat.itemCount !== undefined && (
                    <span className="font-mono text-[11px] opacity-60">({cat.itemCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <h4 className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
              Availability
            </h4>
            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>In-Stock Only (Ready to Dispatch)</span>
            </label>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <div className="flex justify-between items-center text-xs">
              <h4 className="font-mono uppercase tracking-wider text-stone-500 font-semibold">
                Maximum Price
              </h4>
              <span className="font-mono font-bold text-stone-900">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="800"
              step="25"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-stone-400">
              <span>$50</span>
              <span>$800+</span>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-9 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200 h-80 animate-pulse p-4 space-y-4">
                  <div className="bg-stone-200 aspect-[4/3] rounded-lg" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={onSelectProduct}
                    onQuickView={onQuickView}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="pt-8 border-t border-stone-200 flex items-center justify-between text-xs">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-40 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    &larr; Previous Page
                  </button>

                  <span className="font-mono text-stone-600">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-stone-300 rounded-lg disabled:opacity-40 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Next Page &rarr;
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No objects match your filters</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try widening your price range, searching for another keyword, or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div onClick={() => setMobileFiltersOpen(false)} className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs" />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <h3 className="font-bold text-stone-900 text-sm">Filter Criteria</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-stone-500 font-semibold">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left text-xs py-2 px-3 rounded-lg ${
                      selectedCategory === 'all' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600'
                    }`}
                  >
                    All Disciplines
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`w-full text-left text-xs py-2 px-3 rounded-lg ${
                        selectedCategory === c.id ? 'bg-stone-900 text-white font-bold' : 'text-stone-600'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* In stock */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>In-Stock Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border border-stone-300 text-xs font-semibold rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
