import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, ChevronDown, Heart, LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { productsAPI } from '../services/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';

/* ─── Category tabs ─── */
const TABS = [
  { id: 'all',          name: 'All Products' },
  { id: 'headset',      name: 'Headsets'     },
  { id: 'keyboard',     name: 'Keyboards'    },
  { id: 'mouse',        name: 'Mouse'        },
  { id: 'mousepad',     name: 'Mousepads'    },
  { id: 'monitor',      name: 'Monitors'     },
  { id: 'accessories',  name: 'Accessories'  },
];

const SORT_OPTIONS = [
  { value: '-soldCount', label: 'Best Selling'       },
  { value: '-createdAt', label: 'Newest First'       },
  { value: 'price',      label: 'Price: Low to High' },
  { value: '-price',     label: 'Price: High to Low' },
];

const BADGE_VARIANTS = [
  { text: 'BEST SELLER', bg: '#ff4700' },
  { text: 'NEW',         bg: '#10b981' },
  { text: 'SAVE $50',    bg: '#374151', border: true },
  { text: '-20%',        bg: '#8b5cf6' },
  { text: '-15%',        bg: '#ef4444' },
];

/* ─── Star rating ─── */
const StarRating = ({ rating = 4.8, count = '1.2K' }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-[#ff4700]' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
    <span className="text-gray-400 text-[10px]">{rating} ({count})</span>
  </div>
);

/* ════════════ SHOP PAGE ════════════ */
const Shop = () => {
  const { addToCart } = useCart();
  const { addToast }  = useToast();
  const [searchParams] = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [sort, setSort]               = useState('-soldCount');
  const [sortOpen, setSortOpen]       = useState(false);
  const [page, setPage]               = useState(1);
  const [viewGrid, setViewGrid]       = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');

  /* active tab — track by both id + name since some ids repeat */
  const [activeTab, setActiveTab] = useState({ id: 'all', name: 'All Products' });

  /* sync URL params */
  useEffect(() => {
    const cat = searchParams.get('category');
    const q   = searchParams.get('search') || '';
    if (cat) {
      const match = TABS.find(t => t.id === cat);
      if (match) setActiveTab(match);
    } else {
      setActiveTab({ id: 'all', name: 'All Products' });
    }
    setSearch(q);
    setSearchInput(q);
    setPage(1);
  }, [searchParams]);

  /* fetch */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (activeTab.id !== 'all') params.category = activeTab.id;
      if (search) params.search = search;
      const res = await productsAPI.getAll(params);
      setProducts(res.products || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, activeTab, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    addToast(`${product.name} added to cart!`, 'success');
  };

  const discount = (p) =>
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : null;

  const getBadge = (product, idx) => {
    if (product.isFeatured) return { text: 'BEST SELLER', bg: '#ff4700' };
    const off = discount(product);
    if (off) return { text: `-${off}%`, bg: '#8b5cf6' };
    return BADGE_VARIANTS[idx % BADGE_VARIANTS.length];
  };

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Best Selling';

  /* ─── Product Card ─── */
  const ProductCard = ({ product, idx }) => {
    const off   = discount(product);
    const badge = getBadge(product, idx);
    const [wished, setWished] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: idx * 0.03 }}
        className="group bg-[#111] border border-white/5 hover:border-[#ff4700]/50 hover:shadow-[0_0_20px_rgba(255,71,0,0.1)] transition-all duration-300 rounded-xl overflow-hidden flex flex-col"
      >
        {/* Image */}
        <Link
          to={`/product/${product._id}`}
          className="relative aspect-square bg-[#0d0d0d] flex items-center justify-center overflow-hidden p-4"
        >
          <span
            className="absolute top-3 left-3 z-10 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
            style={{ backgroundColor: badge.bg, border: badge.border ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
          >
            {badge.text}
          </span>
          <button
            onClick={e => { e.preventDefault(); setWished(v => !v); }}
            className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
              wished
                ? 'bg-[#ff4700] border-[#ff4700] text-white'
                : 'bg-[#0d0d0d]/80 border-white/10 text-gray-500 hover:border-[#ff4700] hover:text-[#ff4700]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={wished ? 'currentColor' : 'none'} />
          </button>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Package className="w-14 h-14 text-white/10" />
          )}
        </Link>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[#ff4700] text-[9px] font-black uppercase tracking-widest mb-1">
            AL-QURESH
          </p>
          <Link to={`/product/${product._id}`}>
            <h3 className="text-gray-300 text-[13px] font-medium leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
              {product.name}
            </h3>
          </Link>

          <StarRating rating={4.8} count="1.2K" />

          <div className="flex items-center gap-2 mt-2 mb-3">
            <span className="text-white font-black text-base">
              ${product.price?.toLocaleString()}
            </span>
            {off && (
              <>
                <span className="text-gray-400 text-[11px] line-through">
                  ${product.originalPrice?.toLocaleString()}
                </span>
                <span className="text-[#ff4700] text-[11px] font-bold">-{off}%</span>
              </>
            )}
          </div>

          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.stock === 0}
            className="mt-auto flex items-center justify-center gap-2 w-full bg-transparent border border-white/10 hover:bg-[#ff4700] hover:border-[#ff4700] text-gray-400 hover:text-white text-[11px] font-bold py-2.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </motion.div>
    );
  };

  /* ─── render ─── */
  return (
    <div className="bg-[#0a0a0a] min-h-screen">

      {/* ── Hero Banner ── */}
      <div className="bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff4700]/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff4700]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <nav className="flex items-center gap-2 text-[12px] text-gray-500 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-300 font-medium">{activeTab.name}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
            {activeTab.name === 'All Products'
              ? <><span className="text-[#ff4700]">All</span> Products</>
              : activeTab.name}
          </h1>
          <p className="text-gray-400 text-sm max-w-lg">
            Premium gaming gear — Keyboards, Mice, Headsets, Monitors &amp; more.
          </p>
        </div>
      </div>

      {/* ── Category Tabs (sticky) ── */}
      <div className="bg-[#0f0f0f] border-b border-white/5 sticky top-[68px] z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center overflow-x-auto gap-0 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {TABS.map((tab, i) => {
              const isActive = activeTab.name === tab.name;
              return (
                <button
                  key={`${tab.id}-${i}`}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`flex-shrink-0 px-5 py-4 text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-[#ff4700] text-[#ff4700]'
                      : 'border-transparent text-gray-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-[#111] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-all"
            />
          </form>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Count */}
            <p className="text-gray-600 text-[12px] hidden sm:block">
              {loading ? '...' : (
                <>
                  Showing <span className="text-gray-300 font-semibold">
                    {pagination.total === 0 ? '0' : `${(page - 1) * 12 + 1}–${Math.min(page * 12, pagination.total)}`}
                  </span> of <span className="text-gray-300 font-semibold">{pagination.total}</span> products
                </>
              )}
            </p>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-full px-4 py-2 text-[13px] font-semibold text-gray-300 hover:border-white/30 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                Sort
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setPage(1); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                        sort === opt.value
                          ? 'text-[#ff4700] font-bold bg-[#ff4700]/5'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex border border-white/10 rounded-full overflow-hidden">
              <button
                onClick={() => setViewGrid(true)}
                className={`p-2 transition-colors ${viewGrid ? 'bg-[#ff4700] text-white' : 'text-gray-600 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewGrid(false)}
                className={`p-2 transition-colors ${!viewGrid ? 'bg-[#ff4700] text-white' : 'text-gray-600 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid / Loading / Empty */}
        {loading ? (
          <div className={`grid gap-5 ${viewGrid ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[#111] rounded-xl border border-white/5 animate-pulse overflow-hidden">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-2.5">
                  <div className="h-2 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-9 bg-white/5 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-white font-black text-lg mb-2">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try a different category or search term</p>
            <button
              onClick={() => { setActiveTab({ id: 'all', name: 'All Products' }); setSearch(''); setSearchInput(''); setPage(1); }}
              className="bg-[#ff4700] hover:bg-[#e03e00] text-white font-bold px-6 py-2.5 rounded text-sm transition-colors"
            >
              View All Products
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div className={`grid gap-5 ${viewGrid ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {products.map((product, idx) => (
                <ProductCard key={product._id} product={product} idx={idx} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2 border border-white/10 text-gray-400 text-sm font-semibold rounded hover:border-[#ff4700] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded text-sm font-bold transition-colors ${
                  page === i + 1
                    ? 'bg-[#ff4700] text-white'
                    : 'border border-white/10 text-gray-500 hover:border-[#ff4700] hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-5 py-2 border border-white/10 text-gray-400 text-sm font-semibold rounded hover:border-[#ff4700] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
