import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Tag, Users, CheckCircle, AlertCircle, Minus, Plus } from 'lucide-react';
import { productsAPI } from '../services/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import Loader from '../components/Loader';

const WholesaleCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [qty, setQty] = useState(1);

  const minQty = product.minWholesaleQty || 5;
  const isUnlocked = qty >= minQty;
  const effectivePrice = isUnlocked ? product.wholesalePrice : product.price;
  const savings = isUnlocked ? (product.price - product.wholesalePrice) * qty : 0;

  const handleAdd = () => {
    addToCart(product, qty);
    addToast(
      isUnlocked
        ? `${product.name} added at wholesale price!`
        : `${product.name} added to cart`,
      'success'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-[#ff4700]/20 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative bg-[#0d0d0d] aspect-square overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-700" />
          </div>
        )}
        <div className="absolute top-3 left-3 bg-[#ff4700] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
          Wholesale
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 capitalize">{product.category}</p>
        <h3 className="text-white font-bold text-sm mb-3 line-clamp-2 leading-snug">{product.name}</h3>

        {/* Prices */}
        <div className="bg-[#0d0d0d] rounded-xl p-3 mb-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Retail Price</span>
            <span className="text-gray-400 text-xs line-through">Rs. {product.price?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#ff4700] text-xs font-bold">Wholesale Price</span>
            <span className="text-[#ff4700] font-black text-sm">Rs. {product.wholesalePrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/5">
            <span className="text-gray-500 text-[10px]">Min. Qty</span>
            <span className="text-white text-[10px] font-bold">{minQty} items</span>
          </div>
        </div>

        {/* Wholesale unlock status */}
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-xs font-bold transition-all ${
          isUnlocked
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-white/5 text-gray-500 border border-white/5'
        }`}>
          {isUnlocked ? (
            <><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Wholesale price unlocked!</>
          ) : (
            <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Minimum {minQty} items required for wholesale price</>
          )}
        </div>

        {/* Savings badge */}
        {isUnlocked && savings > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3 text-center">
            <span className="text-green-400 text-xs font-bold">You save Rs. {savings.toLocaleString()}!</span>
          </div>
        )}

        {/* Quantity + Add to Cart */}
        <div className="mt-auto space-y-3">
          {/* Qty selector */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">Qty:</span>
            <div className="flex items-center gap-1 bg-[#0d0d0d] border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 text-center text-white text-sm font-bold">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(product.stock || 999, q + 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-gray-500 text-[10px]">
              Total: <span className={`font-bold ${isUnlocked ? 'text-[#ff4700]' : 'text-white'}`}>
                Rs. {(effectivePrice * qty).toLocaleString()}
              </span>
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              product.stock === 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : isUnlocked
                ? 'bg-[#ff4700] hover:bg-[#e03e00] text-white shadow-lg shadow-[#ff4700]/20'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : isUnlocked ? 'Add at Wholesale Price' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Wholesale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWholesale = async () => {
      try {
        const res = await productsAPI.getAll({ wholesale: 'true', limit: 100 });
        setProducts(res.products || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWholesale();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Banner */}
      <div className="bg-[#0f0f0f] border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#ff4700]" />
                <span className="text-[#ff4700] text-xs font-black uppercase tracking-widest">Wholesale Program</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                Buy More, <span className="text-[#ff4700]">Save More</span>
              </h1>
              <p className="text-gray-400 text-sm max-w-xl">
                Special wholesale pricing for bulk orders. Order 5 or more items of the same product to unlock exclusive wholesale prices.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-center min-w-[100px]">
                <Tag className="w-5 h-5 text-[#ff4700] mx-auto mb-1" />
                <p className="text-white font-black text-lg">Min 5</p>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Items</p>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-center min-w-[100px]">
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white font-black text-lg">Best</p>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Prices</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader size="lg" text="Loading wholesale products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Wholesale Products Yet</h3>
            <p className="text-gray-500 text-sm">Check back soon — wholesale pricing is being set up for products.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-black text-lg">
                {products.length} Wholesale {products.length === 1 ? 'Product' : 'Products'}
              </h2>
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Live Pricing</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product, i) => (
                <WholesaleCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wholesale;
