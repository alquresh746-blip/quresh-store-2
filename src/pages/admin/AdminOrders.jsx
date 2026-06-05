import React, { useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../../services/orders';
import { productsAPI } from '../../services/products';
import { useToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import {
  Search, ChevronDown, MessageCircle, Eye, CheckCircle,
  Truck, Package, X, ShoppingCart, Plus, Trash2,
  User, MapPin, Phone, FileText
} from 'lucide-react';

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLE = {
  Pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Shipped:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala',
  'Sargodha','Hyderabad','Other'
];

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923041109928';

const EMPTY_CUSTOMER = { fullName: '', phone: '', city: '', address: '', notes: '' };

const AdminOrders = () => {
  const { addToast } = useToast();

  // Orders list state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Create order state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(EMPTY_CUSTOMER);
  const [orderItems, setOrderItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await ordersAPI.getAll(params);
      setOrders(res.orders || []);
    } catch {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Product search for order creation
  const searchProducts = useCallback(async (q) => {
    if (!q.trim()) { setProductResults([]); return; }
    setSearchingProducts(true);
    try {
      const res = await productsAPI.getAll({ search: q, limit: 8 });
      setProductResults(res.products || []);
    } catch {
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 350);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  const addItemToOrder = (product) => {
    const existing = orderItems.find(i => i.product === product._id);
    if (existing) {
      setOrderItems(prev => prev.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems(prev => [...prev, {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        stock: product.stock,
        quantity: 1,
      }]);
    }
    setProductSearch('');
    setProductResults([]);
  };

  const updateItemQty = (productId, qty) => {
    if (qty < 1) return;
    setOrderItems(prev => prev.map(i => i.product === productId ? { ...i, quantity: qty } : i));
  };

  const removeItem = (productId) => {
    setOrderItems(prev => prev.filter(i => i.product !== productId));
  };

  const orderTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderItems.length) { addToast('Please add at least one product', 'error'); return; }
    setCreatingOrder(true);
    try {
      await ordersAPI.create({
        customerInfo,
        items: orderItems.map(i => ({ product: i.product, quantity: i.quantity, name: i.name })),
        totalAmount: orderTotal,
      });
      addToast('Order created successfully!', 'success');
      setShowCreateModal(false);
      setCustomerInfo(EMPTY_CUSTOMER);
      setOrderItems([]);
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Order create karne mein error', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      addToast(`Status updated to ${newStatus}`, 'success');
    } catch {
      addToast('Status update failed', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openWhatsApp = (order) => {
    const c = order.customerInfo;
    const items = order.items.map(i => `• ${i.name} x${i.quantity} = Rs. ${(i.price * i.quantity).toLocaleString()}`).join('%0A');
    const msg = `*New Order — Al-Quresh Traders*%0A%0A*Order:* ${order.orderNumber}%0A*Customer:* ${c.fullName}%0A*Phone:* ${c.phone}%0A*City:* ${c.city}%0A*Address:* ${c.address}%0A%0A*Items:*%0A${items}%0A%0A*Total:* Rs. ${order.totalAmount?.toLocaleString()}%0A*Payment:* Cash on Delivery`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(q) ||
      order.customerInfo?.fullName?.toLowerCase().includes(q) ||
      order.customerInfo?.phone?.includes(searchTerm)
    );
  });

  const fmt = (n) => Number(n).toLocaleString('en-PK');
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Order # / Customer / Phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[#0d0d0d] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#ff4700]/50 transition-colors w-64"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#0d0d0d] border border-white/10 rounded-lg pl-4 pr-8 py-2 text-white text-sm focus:outline-none focus:border-[#ff4700]/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff4700] hover:bg-[#e03e00] text-white font-bold rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader size="lg" text="Loading orders..." /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400 text-sm mb-3">No orders found</p>
            <button onClick={() => setShowCreateModal(true)} className="text-[#ff4700] text-xs font-bold hover:underline">+ Create first order</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-white/10">
                  <th className="pb-3 pl-6 pt-4">Order #</th>
                  <th className="pb-3 pt-4">Customer</th>
                  <th className="pb-3 pt-4">City</th>
                  <th className="pb-3 pt-4">Total</th>
                  <th className="pb-3 pt-4">Status</th>
                  <th className="pb-3 pt-4">Date</th>
                  <th className="pb-3 pr-6 pt-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-6">
                      <p className="text-white font-bold text-xs">{order.orderNumber}</p>
                      <p className="text-gray-600 text-[10px]">{order.items?.length} item(s)</p>
                    </td>
                    <td className="py-3">
                      <p className="text-white text-xs font-medium">{order.customerInfo?.fullName}</p>
                      <p className="text-gray-500 text-[10px]">{order.customerInfo?.phone}</p>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{order.customerInfo?.city}</td>
                    <td className="py-3 text-white font-bold text-xs">Rs. {fmt(order.totalAmount)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${STATUS_STYLE[order.status] || STATUS_STYLE.Pending}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{fmtDate(order.createdAt)}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center" title="Detail">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openWhatsApp(order)} className="w-7 h-7 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center" title="WhatsApp">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {order.status === 'Pending' && (
                          <button onClick={() => handleStatusUpdate(order._id, 'Confirmed')} className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center" title="Confirm">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.status === 'Confirmed' && (
                          <button onClick={() => handleStatusUpdate(order._id, 'Shipped')} className="w-7 h-7 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center justify-center" title="Ship">
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.status === 'Shipped' && (
                          <button onClick={() => handleStatusUpdate(order._id, 'Delivered')} className="w-7 h-7 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center" title="Delivered">
                            <Package className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CREATE ORDER MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <h2 className="text-white font-black text-lg uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#ff4700]" /> New Order
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">

                {/* LEFT: Customer Info */}
                <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/10 space-y-4">
                  <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Customer Details
                  </h3>

                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={customerInfo.fullName}
                      onChange={e => setCustomerInfo(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Muhammad Ahmed"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                      <Phone className="w-3 h-3 inline mr-1" />Phone *
                    </label>
                    <input
                      required
                      type="tel"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))}
                      placeholder="03001234567"
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                      <MapPin className="w-3 h-3 inline mr-1" />City *
                    </label>
                    <select
                      required
                      value={customerInfo.city}
                      onChange={e => setCustomerInfo(p => ({ ...p, city: e.target.value }))}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    >
                      <option value="">Select City</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Address *</label>
                    <textarea
                      required
                      rows={3}
                      value={customerInfo.address}
                      onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))}
                      placeholder="House #, Street, Area..."
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                      <FileText className="w-3 h-3 inline mr-1" />Notes
                    </label>
                    <input
                      type="text"
                      value={customerInfo.notes}
                      onChange={e => setCustomerInfo(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Special instructions..."
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* RIGHT: Products */}
                <div className="p-6 space-y-4 flex flex-col">
                  <h3 className="text-[#ff4700] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Products
                  </h3>

                  {/* Product Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff4700]/50 transition-colors"
                    />
                    {/* Dropdown Results */}
                    {(productResults.length > 0 || searchingProducts) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
                        {searchingProducts ? (
                          <div className="p-3 text-gray-500 text-xs text-center">Searching...</div>
                        ) : (
                          productResults.map(p => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => addItemToOrder(p)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="w-8 h-8 bg-[#0d0d0d] rounded flex-shrink-0 overflow-hidden">
                                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-contain p-0.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{p.name}</p>
                                <p className="text-gray-500 text-[10px]">Rs. {p.price?.toLocaleString()} · Stock: {p.stock}</p>
                              </div>
                              <Plus className="w-4 h-4 text-[#ff4700] flex-shrink-0" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 space-y-2 overflow-y-auto min-h-[120px]">
                    {orderItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-gray-700 mb-1" />
                        <p className="text-gray-600 text-xs">Search a product above to add it</p>
                      </div>
                    ) : (
                      orderItems.map(item => (
                        <div key={item.product} className="flex items-center gap-3 bg-[#0d0d0d] border border-white/5 rounded-lg p-3">
                          <div className="w-10 h-10 bg-[#0f0f0f] rounded flex-shrink-0 overflow-hidden">
                            {item.image && <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{item.name}</p>
                            <p className="text-gray-500 text-[10px]">Rs. {item.price?.toLocaleString()} each</p>
                          </div>
                          {/* Qty Controls */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button type="button" onClick={() => updateItemQty(item.product, item.quantity - 1)} className="w-6 h-6 rounded bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold">-</button>
                            <span className="text-white text-xs font-bold w-5 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateItemQty(item.product, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-6 h-6 rounded bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold disabled:opacity-30">+</button>
                          </div>
                          <p className="text-white text-xs font-bold w-20 text-right flex-shrink-0">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                          <button type="button" onClick={() => removeItem(item.product)} className="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Order Total */}
                  {orderItems.length > 0 && (
                    <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total (COD)</span>
                      <span className="text-white font-black text-xl">Rs. {orderTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 border border-white/10 text-gray-400 font-bold rounded-lg hover:bg-white/5 transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={creatingOrder || !orderItems.length}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#ff4700] hover:bg-[#e03e00] text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {creatingOrder
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                  : <><ShoppingCart className="w-4 h-4" />Order Create Karo</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ORDER DETAIL MODAL ─── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-white font-black text-base">{selectedOrder.orderNumber}</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLE[selectedOrder.status]}`}>{selectedOrder.status}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-4">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">Customer</p>
                  <p className="text-white text-sm font-bold">{selectedOrder.customerInfo?.fullName}</p>
                  <p className="text-gray-400 text-xs">{selectedOrder.customerInfo?.phone}</p>
                  <p className="text-gray-400 text-xs">{selectedOrder.customerInfo?.city}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-4">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">Address</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{selectedOrder.customerInfo?.address}</p>
                  {selectedOrder.customerInfo?.notes && <p className="text-gray-500 text-[10px] mt-2">Note: {selectedOrder.customerInfo.notes}</p>}
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#0d0d0d] border border-white/5 rounded-lg p-3">
                      <div className="w-12 h-12 bg-[#0f0f0f] rounded flex-shrink-0 overflow-hidden">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-contain p-1" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold">{item.name}</p>
                        <p className="text-gray-500 text-[10px]">x{item.quantity} × Rs. {fmt(item.price)}</p>
                      </div>
                      <p className="text-white font-black text-sm">Rs. {fmt(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-4 flex items-center justify-between">
                <span className="text-gray-400">Total (COD)</span>
                <span className="text-white font-black text-xl">Rs. {fmt(selectedOrder.totalAmount)}</span>
              </div>

              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3">Status Update</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusUpdate(selectedOrder._id, s)}
                      disabled={selectedOrder.status === s || updatingStatus}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${
                        selectedOrder.status === s
                          ? 'bg-[#ff4700] border-[#ff4700] text-white cursor-default'
                          : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex-shrink-0">
              <button
                onClick={() => openWhatsApp(selectedOrder)}
                className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp pe Customer se Baat Karo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
