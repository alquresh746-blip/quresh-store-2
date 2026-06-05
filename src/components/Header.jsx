import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Search, User, ShoppingCart, ChevronDown, Menu, X,
  LogOut, LayoutDashboard, ShieldCheck, Headphones,
  Keyboard, Mouse, Monitor, Cpu, Armchair, Video, Package
} from 'lucide-react';

const NAV_CATEGORIES = [
  { id: 'keyboard',      name: 'Keyboards',     icon: Keyboard   },
  { id: 'mouse',         name: 'Mice',           icon: Mouse      },
  { id: 'headset',       name: 'Headsets',       icon: Headphones },
  { id: 'monitor',       name: 'Monitors',       icon: Monitor    },
  { id: 'pc-components', name: 'PC Components',  icon: Cpu        },
  { id: 'chairs',        name: 'Gaming Chairs',  icon: Armchair   },
  { id: 'streaming',     name: 'Streaming Gear', icon: Video      },
  { id: 'accessories',   name: 'Accessories',    icon: Package    },
];

const Header = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen,    setCatOpen]    = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const catRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full bg-[#0f0f0f] text-white sticky top-0 z-50 border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[96px] gap-6">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center flex-shrink-0 group">
            <img
              src="/logo.png"
              alt="Al-Quresh Traders"
              className="h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* ── Center Nav (desktop) ── */}
          <nav className="hidden lg:flex items-center gap-1 text-[14px] font-semibold flex-1 justify-center" ref={catRef}>

            <Link
              to="/"
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive('/')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>

            <Link
              to="/shop"
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive('/shop')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Shop
            </Link>

            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCatOpen(o => !o)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl py-2 z-50">
                  {NAV_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.id}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-[#ff4700] hover:bg-white/5 transition-colors text-[13px]"
                      >
                        <Icon className="w-4 h-4 text-gray-600" />
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/deals"
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive('/deals')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Deals
            </Link>

            <Link
              to="/wholesale"
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive('/wholesale')
                  ? 'bg-[#ff4700]/10 text-[#ff4700] border border-[#ff4700]/20'
                  : 'text-[#ff4700] hover:bg-[#ff4700]/10 border border-[#ff4700]/30 hover:border-[#ff4700]/50'
              }`}
            >
              Wholesale
            </Link>

            <Link
              to="/about"
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive('/about')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive('/contact')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* ── Right: Search + Icons ── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Search bar (desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium gear..."
                className="w-48 lg:w-64 bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4700]/50 focus:ring-2 focus:ring-[#ff4700]/10 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff4700] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Mobile search */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-[#ff4700] transition-colors"
              onClick={() => navigate('/shop')}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account */}
            {isAuthenticated ? (
              <div className="relative group hidden sm:block">
                <button className="p-2 text-gray-400 hover:text-[#ff4700] transition-colors">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                  <div className="px-4 py-2.5 border-b border-white/10">
                    <p className="text-white font-bold text-[13px] truncate">{user?.name}</p>
                    <p className="text-gray-500 text-[11px] truncate">{user?.email}</p>
                  </div>
                  {user?.role === 'admin' ? (
                    <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-[#ff4700] hover:bg-white/5 text-[13px] font-bold">
                      <ShieldCheck className="w-4 h-4" /> Admin Panel
                    </Link>
                  ) : (
                    <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 text-[13px]">
                      <LayoutDashboard className="w-4 h-4" /> My Dashboard
                    </Link>
                  )}
                  <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-[13px]">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex p-2 text-gray-400 hover:text-[#ff4700] transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-400 hover:text-[#ff4700] transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#ff4700] text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 border-2 border-[#0f0f0f]">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-[#ff4700] transition-colors"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0f0f0f] border-t border-white/5 px-4 py-4 space-y-1 shadow-2xl absolute w-full left-0 z-40">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search premium gear..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4700]/50"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff4700]">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {[
            { to: '/',        label: 'Home'    },
            { to: '/shop',    label: 'Shop'    },
            { to: '/deals',   label: 'Deals'   },
            { to: '/about',   label: 'About'   },
            { to: '/contact', label: 'Contact' },
          ].map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`block px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                isActive(l.to)
                  ? 'bg-[#ff4700]/10 text-[#ff4700]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/wholesale"
            className={`block px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all border ${
              isActive('/wholesale')
                ? 'bg-[#ff4700]/10 text-[#ff4700] border-[#ff4700]/30'
                : 'text-[#ff4700] hover:bg-[#ff4700]/10 border-[#ff4700]/20'
            }`}
          >
            Wholesale
          </Link>

          <div className="h-px bg-white/5 my-2" />

          {isAuthenticated ? (
            <>
              {user?.role === 'admin' ? (
                <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-bold text-[#ff4700] hover:bg-[#ff4700]/10">
                  <ShieldCheck className="w-4 h-4" /> Admin Panel
                </Link>
              ) : (
                <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-gray-400 hover:text-white hover:bg-white/5">
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </Link>
              )}
              <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[14px] font-semibold text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center justify-center gap-2 mx-4 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#ff4700] hover:bg-[#e03e00] transition-colors">
              <User className="w-4 h-4" /> Login / Register
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
