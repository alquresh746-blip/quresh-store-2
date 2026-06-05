import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../../services/products';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import {
  Plus, Search, Edit, Trash2, X, Upload, Link as LinkIcon,
  Star, Package, ChevronLeft, ChevronRight, ImagePlus, Check
} from 'lucide-react';

const CATEGORIES = [
  { value: 'keyboard', label: 'Keyboards' },
  { value: 'mouse', label: 'Mice' },
  { value: 'headset', label: 'Headsets' },
  { value: 'monitor', label: 'Monitors' },
  { value: 'laptop', label: 'Laptops' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'controller', label: 'Controllers' },
  { value: 'mousepad', label: 'Mousepads' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  originalPrice: '',
  hasDiscount: false,
  discountPercent: '',
  stock: '',
  isFeatured: false,
  images: [],
  tags: '',
  specs: [{ key: '', value: '' }],
  isWholesaleAvailable: false,
  wholesalePrice: '',
  minWholesaleQty: '5',
};

const AdminProducts = () => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'file'
  const [urlInput, setUrlInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchProducts(); }, [page, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      const res = await productsAPI.getAll(params);
      setProducts(res.products || []);
      setPagination(res.pagination || { pages: 1, total: 0 });
    } catch {
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setUrlInput('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    const hasDiscount = !!(product.originalPrice && product.originalPrice > product.price);
    const discountPercent = hasDiscount
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : '';
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      originalPrice: product.originalPrice || product.price || '',
      hasDiscount,
      discountPercent,
      stock: product.stock || '',
      isFeatured: product.isFeatured || false,
      images: product.images || [],
      tags: (product.tags || []).join(', '),
      specs: Object.entries(product.specs || {}).map(([key, value]) => ({ key, value })).concat([{ key: '', value: '' }]),
      isWholesaleAvailable: product.isWholesaleAvailable || false,
      wholesalePrice: product.wholesalePrice || '',
      minWholesaleQty: product.minWholesaleQty || '5',
    });
    setUrlInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
  };

  const addImageUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) { addToast('Please enter a valid URL starting with http:// or https://', 'error'); return; }
    setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    setUrlInput('');
  };

  const removeImage = (idx) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const res = await productsAPI.uploadImages(files);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...(res.images || [])] }));
      addToast(`${files.length} image(s) uploaded!`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      addToast(`Upload failed: ${msg}`, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateSpec = (idx, field, val) => {
    setFormData(prev => {
      const specs = [...prev.specs];
      specs[idx] = { ...specs[idx], [field]: val };
      // Auto-add new row when last row is filled
      if (idx === specs.length - 1 && specs[idx].key && specs[idx].value) {
        specs.push({ key: '', value: '' });
      }
      return { ...prev, specs };
    });
  };

  const removeSpec = (idx) => {
    setFormData(prev => ({ ...prev, specs: prev.specs.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.images.length) { addToast('Please add at least one product image', 'error'); return; }

    const specsObj = {};
    formData.specs.forEach(({ key, value }) => { if (key && value) specsObj[key] = value; });

    const origPrice = Number(formData.originalPrice);
    const discount = formData.hasDiscount ? Number(formData.discountPercent) : 0;
    const salePrice = formData.hasDiscount && discount > 0
      ? Math.round(origPrice - (origPrice * discount) / 100)
      : origPrice;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      price: salePrice,
      originalPrice: formData.hasDiscount ? origPrice : undefined,
      stock: Number(formData.stock),
      isFeatured: formData.isFeatured,
      images: formData.images,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      specs: specsObj,
      isWholesaleAvailable: formData.isWholesaleAvailable,
      wholesalePrice: formData.isWholesaleAvailable && formData.wholesalePrice ? Number(formData.wholesalePrice) : null,
      minWholesaleQty: formData.isWholesaleAvailable ? Number(formData.minWholesaleQty) || 5 : 5,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, payload);
        addToast('Product updated!', 'success');
      } else {
        await productsAPI.create(payload);
        addToast('Product created!', 'success');
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      addToast('Product deleted', 'success');
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      addToast('Failed to delete product', 'error');
    }
  };

  const fmt = (n) => Number(n).toLocaleString('en-PK');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="bg-[#0d0d0d] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#ff4700]/50 transition-colors w-64"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff4700] hover:bg-[#e03e00] text-white font-bold rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader size="lg" text="Loading products..." /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400 text-sm mb-3">No products yet</p>
            <button onClick={openCreate} className="text-[#ff4700] text-xs font-bold hover:underline">+ Add your first product</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-white/10">
                  <th className="pb-3 pl-6 pt-4">Product</th>
                  <th className="pb-3 pt-4">Category</th>
                  <th className="pb-3 pt-4">Price</th>
                  <th className="pb-3 pt-4">Stock</th>
                  <th className="pb-3 pt-4">Featured</th>
                  <th className="pb-3 pt-4">Status</th>
                  <th className="pb-3 pr-6 pt-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0d0d0d] rounded-lg flex-shrink-0 overflow-hidden">
                          {product.images?.[0]
                            ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-1" />
                            : <Package className="w-5 h-5 text-gray-600 m-auto mt-2.5" />}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs line-clamp-1 max-w-[180px]">{product.name}</p>
                          <p className="text-gray-600 text-[10px]">{product._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-400 text-xs capitalize">{product.category}</td>
                    <td className="py-3">
                      <p className="text-white font-bold text-xs">Rs. {fmt(product.price)}</p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-gray-600 text-[10px] line-through">Rs. {fmt(product.originalPrice)}</p>
                          <span className="bg-[#ff4700] text-white text-[8px] font-bold px-1 py-0.5 rounded">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{product.stock}</td>
                    <td className="py-3">
                      {product.isFeatured
                        ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        : <span className="text-gray-700 text-xs">—</span>}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        product.stock > 0
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(product._id)} className="w-7 h-7 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">{pagination.total} products total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white text-xs font-bold px-2">{page} / {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6 w-full max-w-sm text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Delete Product?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-white/10 text-gray-400 font-bold rounded-lg hover:bg-white/5 transition-colors text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <h2 className="text-white font-black text-lg uppercase tracking-tight">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Basic Info */}
              <div>
                <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest mb-3">Basic Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Logitech G Pro X Superlight"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, isFeatured: !p.isFeatured }))}
                      className={`w-10 h-6 rounded-full transition-colors relative ${formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.isFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <label className="text-gray-400 text-xs flex items-center gap-1.5 cursor-pointer" onClick={() => setFormData(p => ({ ...p, isFeatured: !p.isFeatured }))}>
                      <Star className={`w-3.5 h-3.5 ${formData.isFeatured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                      Featured Product
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Product description..."
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div>
                <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest mb-3">Pricing & Stock</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Price (PKR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.originalPrice}
                      onChange={e => setFormData(p => ({ ...p, originalPrice: e.target.value }))}
                      placeholder="e.g. 5000"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Discount Toggle */}
                <div className="mt-4 bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white text-sm font-bold">Discount</p>
                      <p className="text-gray-500 text-[10px]">Optional — apply a discount to reduce the selling price</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, hasDiscount: !p.hasDiscount, discountPercent: '' }))}
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.hasDiscount ? 'bg-[#ff4700]' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.hasDiscount ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {formData.hasDiscount && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Discount %</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={formData.discountPercent}
                              onChange={e => setFormData(p => ({ ...p, discountPercent: e.target.value }))}
                              placeholder="e.g. 20"
                              className="w-full bg-[#0f0f0f] border border-[#ff4700]/30 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/60 transition-colors pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff4700] font-bold text-sm">%</span>
                          </div>
                        </div>
                        {formData.discountPercent && formData.originalPrice && (
                          <div className="flex-1">
                            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Sale Price</label>
                            <div className="bg-[#0f0f0f] border border-green-500/30 rounded-lg px-4 py-2.5">
                              <span className="text-green-400 font-bold text-sm">
                                Rs. {Math.round(Number(formData.originalPrice) - (Number(formData.originalPrice) * Number(formData.discountPercent)) / 100).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {formData.discountPercent && formData.originalPrice && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#ff4700]/5 border border-[#ff4700]/20 rounded-lg px-3 py-2">
                          <span className="line-through text-gray-600">Rs. {Number(formData.originalPrice).toLocaleString()}</span>
                          <span>→</span>
                          <span className="text-green-400 font-bold">Rs. {Math.round(Number(formData.originalPrice) - (Number(formData.originalPrice) * Number(formData.discountPercent)) / 100).toLocaleString()}</span>
                          <span className="ml-auto bg-[#ff4700] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{formData.discountPercent}% OFF</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Wholesale Pricing */}
              <div>
                <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest mb-3">Wholesale Pricing</h3>
                <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white text-sm font-bold">Enable Wholesale</p>
                      <p className="text-gray-500 text-[10px]">Show this product on the Wholesale page with special pricing</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, isWholesaleAvailable: !p.isWholesaleAvailable }))}
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.isWholesaleAvailable ? 'bg-[#ff4700]' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.isWholesaleAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {formData.isWholesaleAvailable && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                      <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Wholesale Price (PKR) *</label>
                        <input
                          type="number"
                          min="0"
                          required={formData.isWholesaleAvailable}
                          value={formData.wholesalePrice}
                          onChange={e => setFormData(p => ({ ...p, wholesalePrice: e.target.value }))}
                          placeholder="e.g. 3500"
                          className="w-full bg-[#0f0f0f] border border-[#ff4700]/30 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/60 transition-colors"
                        />
                        {formData.wholesalePrice && formData.originalPrice && (
                          <p className="text-green-400 text-[10px] mt-1 font-bold">
                            Save Rs. {(Number(formData.originalPrice) - Number(formData.wholesalePrice)).toLocaleString()} per item
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Min. Wholesale Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.minWholesaleQty}
                          onChange={e => setFormData(p => ({ ...p, minWholesaleQty: e.target.value }))}
                          placeholder="5"
                          className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                        />
                        <p className="text-gray-600 text-[10px] mt-1">Default: 5 items</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest mb-3">Product Images *</h3>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <div className="w-20 h-20 bg-[#0d0d0d] border border-white/10 rounded-lg overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-contain p-1" onError={e => e.target.style.display='none'} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {idx === 0 && <span className="absolute bottom-0 left-0 right-0 text-[8px] font-bold text-center bg-[#ff4700] text-white rounded-b-lg py-0.5">MAIN</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mode Tabs */}
                <div className="flex gap-1 mb-3 bg-[#0d0d0d] p-1 rounded-lg w-fit">
                  <button type="button" onClick={() => setImageMode('url')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${imageMode === 'url' ? 'bg-[#ff4700] text-white' : 'text-gray-500 hover:text-white'}`}>
                    <LinkIcon className="w-3.5 h-3.5" />URL
                  </button>
                  <button type="button" onClick={() => setImageMode('file')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${imageMode === 'file' ? 'bg-[#ff4700] text-white' : 'text-gray-500 hover:text-white'}`}>
                    <Upload className="w-3.5 h-3.5" />Upload
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                    <button type="button" onClick={addImageUrl} className="px-4 py-2.5 bg-[#ff4700] hover:bg-[#e03e00] text-white text-xs font-bold rounded-lg transition-colors">Add</button>
                  </div>
                ) : (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-white/10 hover:border-[#ff4700]/40 rounded-lg py-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {uploading
                        ? <><div className="w-6 h-6 border-2 border-[#ff4700] border-t-transparent rounded-full animate-spin" /><span className="text-gray-400 text-xs">Uploading...</span></>
                        : <><ImagePlus className="w-6 h-6 text-gray-500" /><span className="text-gray-400 text-xs">Click to upload (JPG, PNG, WebP — max 5MB)</span><span className="text-gray-600 text-[10px]">Requires Cloudinary setup</span></>}
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest mb-3">Tags</h3>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                  placeholder="gaming, wireless, mechanical (comma separated)"
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                />
              </div>

              {/* Specs */}
              <div>
                <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest mb-3">Specifications</h3>
                <div className="space-y-2">
                  {formData.specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={e => updateSpec(idx, 'key', e.target.value)}
                        placeholder="e.g. DPI"
                        className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={e => updateSpec(idx, 'value', e.target.value)}
                        placeholder="e.g. 100 - 25600"
                        className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                      />
                      {formData.specs.length > 1 && (
                        <button type="button" onClick={() => removeSpec(idx)} className="w-7 h-7 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 border border-white/10 text-gray-400 font-bold rounded-lg hover:bg-white/5 transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#ff4700] hover:bg-[#e03e00] text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-60"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                  : <><Check className="w-4 h-4" />{editingProduct ? 'Update Product' : 'Create Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
