import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  History,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Truck,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Box,
  Layers,
  Printer,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Product, Order, User, Coupon, InventoryMovement, StoreSettings, Category } from '../types';
import { api } from '../lib/api';
import { InvoiceModal } from '../components/InvoiceModal';

interface AdminDashboardViewProps {
  onBackToStore: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToStore }) => {
  // Navigation
  const [activeModule, setActiveModule] = useState<
    'analytics' | 'products' | 'orders' | 'inventory' | 'customers' | 'coupons' | 'settings'
  >('analytics');

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Inventory movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [stockAdjustProductId, setStockAdjustProductId] = useState('');
  const [stockAdjustQty, setStockAdjustQty] = useState(0);
  const [stockAdjustReason, setStockAdjustReason] = useState('manual_adjustment');
  const [stockAdjustNotes, setStockAdjustNotes] = useState('');

  // Customers state
  const [customers, setCustomers] = useState<any[]>([]);

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);
  const [seedResetMsg, setSeedResetMsg] = useState(false);

  // Global refresh
  const loadDashboardData = async () => {
    try {
      setAnalyticsLoading(true);
      const [analyticsRes, prodRes, catRes, ordRes, movRes, custRes, cpnRes, setRes] =
        await Promise.all([
          api.getAdminAnalytics(),
          api.getProducts({ limit: '100', includeInactive: 'true' }),
          api.getCategories(),
          api.getOrders({ limit: '100' }),
          api.getInventoryMovements(),
          api.getAdminCustomers(),
          api.getCoupons(),
          api.getSettings(),
        ]);

      setAnalytics(analyticsRes);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
      setOrders(ordRes.orders);
      setMovements(movRes.movements);
      setCustomers(custRes.customers);
      setCoupons(cpnRes.coupons);
      setSettings(setRes.settings);
    } catch (err) {
      console.error('Failed loading admin dashboard data:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ---------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order['status'],
    tracking?: string,
    carrier?: string
  ) => {
    try {
      const res = await api.updateOrderStatus(orderId, {
        status: newStatus,
        trackingNumber: tracking,
        carrier,
        note: `Status updated to ${newStatus} by admin`,
      });
      setOrders(orders.map((o) => (o.id === orderId ? res.order : o)));
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(res.order);
      }
      loadDashboardData(); // Recalculate inventory & analytics
    } catch (err: any) {
      alert(err.message || 'Failed updating order');
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    const reason = prompt('Enter audit refund reason:');
    if (!reason) return;
    try {
      const res = await api.refundOrder(orderId, reason);
      if (res.success && res.order) {
        setOrders(orders.map((o) => (o.id === orderId ? res.order : o)));
        if (selectedOrderDetails?.id === orderId) {
          setSelectedOrderDetails(res.order);
        }
        loadDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed processing refund');
    }
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProductId || stockAdjustQty === 0) return;
    try {
      await api.adjustStock(stockAdjustProductId, stockAdjustQty, stockAdjustReason, stockAdjustNotes);
      setIsAdjustStockModalOpen(false);
      setStockAdjustNotes('');
      setStockAdjustQty(0);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed adjusting inventory');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete or archive this product? Historical orders will be preserved.')) return;
    try {
      await api.deleteProduct(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed deleting product');
    }
  };

  const handleToggleCustomer = async (id: string) => {
    try {
      await api.toggleCustomerStatus(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed toggling customer status');
    }
  };

  const handleResetSeedData = async () => {
    if (!confirm('Reset store database to pristine demo state? (Products, sample orders, and stock will be re-initialized)')) return;
    try {
      await api.resetSeed();
      setSeedResetMsg(true);
      await loadDashboardData();
      setTimeout(() => setSeedResetMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed resetting seed data');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed updating settings');
    }
  };

  // Color palette for charts
  const CHART_COLORS = ['#3B49DF', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>AURA Control Console</span>
              <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">v2.6 Enterprise</span>
            </h1>
            <p className="text-[11px] text-stone-500">Live inventory synchronization & analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onBackToStore}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront View</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Viewport */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Admin Navigation Sidebar (240px) */}
        <aside className="w-full md:w-64 bg-white border-r border-stone-200 p-4 space-y-1 shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold px-3 py-2">
            Operations Modules
          </div>

          <button
            onClick={() => setActiveModule('analytics')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeModule === 'analytics' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveModule('products')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeModule === 'products' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Catalog</span>
            <span className="ml-auto font-mono text-[11px] opacity-70">{products.length}</span>
          </button>

          <button
            onClick={() => setActiveModule('orders')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeModule === 'orders' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Orders & Shipping</span>
            <span className="ml-auto font-mono text-[11px] opacity-70">{orders.length}</span>
          </button>

          <button
            onClick={() => setActiveModule('inventory')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeModule === 'inventory' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stock Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveModule('customers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeModule === 'customers' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Directory</span>
            <span className="ml-auto font-mono text-[11px] opacity-70">{customers.length}</span>
          </button>

          <button
            onClick={() => setActiveModule('coupons')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeModule === 'coupons' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Discounts & Promos</span>
            <span className="ml-auto font-mono text-[11px] opacity-70">{coupons.length}</span>
          </button>

          <div className="pt-4 border-t border-stone-200 mt-4">
            <button
              onClick={() => setActiveModule('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeModule === 'settings' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Store Configuration</span>
            </button>
          </div>
        </aside>

        {/* Right Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto max-w-7xl">
          
          {/* ================================================== */}
          {/* MODULE 1: OVERVIEW & REAL-TIME ANALYTICS */}
          {/* ================================================== */}
          {activeModule === 'analytics' && analytics && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Operations & Financial Analytics</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Calculated dynamically from live PostgreSQL / ACID order and stock transactions
                </p>
              </div>

              {/* 14 KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Total Revenue</span>
                  <span className="font-mono text-2xl font-bold text-stone-950 block mt-1 tabular-nums">
                    ${analytics.kpis.totalRevenue.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold block mt-1">Excludes returns/refunds</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Revenue (Today)</span>
                  <span className="font-mono text-2xl font-bold text-indigo-600 block mt-1 tabular-nums">
                    ${analytics.kpis.revenueToday.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono block mt-1">Last 24 hours</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Revenue (7 Days)</span>
                  <span className="font-mono text-2xl font-bold text-stone-950 block mt-1 tabular-nums">
                    ${analytics.kpis.revenue7d.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono block mt-1">Last 7 calendar days</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Average Order Value</span>
                  <span className="font-mono text-2xl font-bold text-stone-950 block mt-1 tabular-nums">
                    ${analytics.kpis.averageOrderValue.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono block mt-1">Per confirmed cart</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Total Orders</span>
                  <span className="font-mono text-2xl font-bold text-stone-950 block mt-1 tabular-nums">
                    {analytics.kpis.totalOrders}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-semibold block mt-1">
                    {analytics.kpis.ordersAwaitingProcessing} awaiting fulfillment
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Delivered Orders</span>
                  <span className="font-mono text-2xl font-bold text-emerald-600 block mt-1 tabular-nums">
                    {analytics.kpis.completedOrders}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono block mt-1">
                    {analytics.kpis.cancelledOrders} cancelled
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Total Units in Stock</span>
                  <span className="font-mono text-2xl font-bold text-stone-950 block mt-1 tabular-nums">
                    {analytics.kpis.totalUnitsInStock}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono block mt-1">Across all product lines</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-[11px] font-mono text-stone-400 uppercase block font-semibold">Inventory Alerts</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
                      {analytics.kpis.lowStockCount}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">low</span>
                    <span className="font-mono text-2xl font-bold text-rose-600 tabular-nums ml-2">
                      {analytics.kpis.outOfStockCount}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">out</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold block mt-1">Requires restock</span>
                </div>
              </div>

              {/* Interactive Charts: Revenue Trends & Category Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 14-Day Revenue Curve */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">Revenue Performance Trend</h3>
                      <p className="text-[11px] text-stone-500">Daily net sales across the past 14 days</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      14-Day Trajectory
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.charts.dailyTrends}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B49DF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B49DF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                          contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3B49DF" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sales by Category Distribution */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Sales by Discipline</h3>
                    <p className="text-[11px] text-stone-500">Gross revenue volume breakdown</p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.charts.salesByCategory} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#374151' }} width={80} />
                        <Tooltip
                          formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Sales']}
                          contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        />
                        <Bar dataKey="amount" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Split: Top Selling Hardware + Low Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Top Selling Hardware */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900">Bestselling Hardware Products</h3>
                  <div className="space-y-3">
                    {analytics.charts.topSelling.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-stone-50">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-stone-100" />
                          <div>
                            <strong className="block text-stone-900">{item.name}</strong>
                            <span className="text-stone-400 font-mono text-[11px]">{item.units} units shipped</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-stone-900 tabular-nums">
                          ${item.revenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Watchlist */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Low & Depleted Stock Watchlist</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    {analytics.lowStockAlerts.length > 0 ? (
                      analytics.lowStockAlerts.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-stone-100 bg-stone-50">
                          <div>
                            <strong className="block text-stone-900">{item.name}</strong>
                            <span className="font-mono text-stone-400 text-[10px]">SKU: {item.sku}</span>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              item.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} left (min: ${item.threshold})`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-400 text-center py-6">All studio products are healthy in inventory.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MODULE 2: PRODUCT & INVENTORY MANAGEMENT */}
          {/* ================================================== */}
          {activeModule === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Product & Catalog Management</h2>
                  <p className="text-xs text-stone-500">Manage listings, prices, margins, and active inventory</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/api/products/export/csv"
                    className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-semibold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </a>

                  <button
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-4 text-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by product name, SKU, brand..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Disciplines</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3 text-right">Price</th>
                      <th className="py-3 px-3 text-right">Cost</th>
                      <th className="py-3 px-3 text-center">In Stock</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products
                      .filter((p) => {
                        if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
                        if (productSearch) {
                          const q = productSearch.toLowerCase();
                          return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((product) => (
                        <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                              />
                              <div>
                                <strong className="font-bold text-stone-900 block">{product.name}</strong>
                                <span className="text-[11px] text-stone-400 font-mono">{product.brand}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-stone-600">{product.sku}</td>
                          <td className="py-3 px-3 font-mono text-right tabular-nums">
                            <strong>${(product.salePrice ?? product.price).toFixed(2)}</strong>
                            {product.salePrice && (
                              <span className="block text-[10px] text-stone-400 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-right tabular-nums text-stone-500">
                            ${product.costPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                product.stock === 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : product.stock <= product.lowStockThreshold
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {product.stock} units
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-semibold ${
                                product.isActive ? 'text-emerald-600' : 'text-stone-400 line-through'
                              }`}
                            >
                              {product.isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedProductForEdit(product)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete or Archive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MODULE 3: ORDERS & FULFILLMENT */}
          {/* ================================================== */}
          {activeModule === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Order Management & Fulfillment</h2>
                <p className="text-xs text-stone-500">Track shipments, issue refunds, and print invoices</p>
              </div>

              {/* Status Filter Tabs & Search */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-colors cursor-pointer ${
                        orderStatusFilter === status ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order # or Customer..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3 text-right">Items</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders
                      .filter((o) => {
                        if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                        if (orderSearch) {
                          const q = orderSearch.toLowerCase();
                          return (
                            o.orderNumber.toLowerCase().includes(q) ||
                            o.customerName.toLowerCase().includes(q) ||
                            o.customerEmail.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                            #{order.orderNumber}
                          </td>
                          <td className="py-3.5 px-3 text-stone-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-3">
                            <strong className="block text-stone-900">{order.customerName}</strong>
                            <span className="text-stone-400 text-[11px]">{order.customerEmail}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                            {order.items.reduce((s, i) => s + i.quantity, 0)} units
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-stone-950 tabular-nums">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'cancelled'
                                  ? 'bg-stone-100 text-stone-500 line-through'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedOrderDetails(order)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold py-1 px-2.5 rounded-lg cursor-pointer"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg cursor-pointer"
                              >
                                Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MODULE 4: INVENTORY TRACKING & MOVEMENTS LOG */}
          {/* ================================================== */}
          {activeModule === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Stock Movements & Audit Trail</h2>
                  <p className="text-xs text-stone-500">Every inventory deduction and replenishment logged with audit metadata</p>
                </div>

                <button
                  onClick={() => setIsAdjustStockModalOpen(true)}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Manual Stock Adjustment
                </button>
              </div>

              {/* Movements Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3 text-center">Change</th>
                      <th className="py-3 px-3 text-center">Balance After</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-4">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-stone-500">
                          {new Date(mov.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">{mov.productName}</td>
                        <td className="py-3 px-3 font-mono text-stone-500">{mov.productSku}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              mov.quantityChange > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-stone-800">
                          {mov.stockAfter} units
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] uppercase text-stone-600 block">
                            {mov.reason}
                          </span>
                          {mov.notes && <span className="text-[10px] text-stone-400">{mov.notes}</span>}
                        </td>
                        <td className="py-3 px-4 text-stone-600">{mov.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MODULE 5: CUSTOMER DIRECTORY */}
          {/* ================================================== */}
          {activeModule === 'customers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Registered Customer Directory</h2>
                <p className="text-xs text-stone-500">Profiles, lifetime spends, and account status controls</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-3 text-center">Total Orders</th>
                      <th className="py-3 px-3 text-right">Lifetime Spend</th>
                      <th className="py-3 px-4 text-center">Status / Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 font-bold text-stone-900">{c.fullName}</td>
                        <td className="py-3 px-3 text-stone-600 font-mono">{c.email}</td>
                        <td className="py-3 px-3 text-stone-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          {c.orderCount} orders
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-stone-950 tabular-nums">
                          ${c.lifetimeSpend?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleCustomer(c.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                              c.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Deactivated'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MODULE 6: COUPONS & DISCOUNTS */}
          {/* ================================================== */}
          {activeModule === 'coupons' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Promotion & Promo Code Management</h2>
                  <p className="text-xs text-stone-500">Fixed or percentage discount campaigns with usage limits</p>
                </div>

                <button
                  onClick={() => setIsAddCouponModalOpen(true)}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Create Coupon
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3 text-right">Value</th>
                      <th className="py-3 px-3 text-right">Min Order</th>
                      <th className="py-3 px-3 text-center">Usage Count</th>
                      <th className="py-3 px-3">Expiration</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {coupons.map((cpn) => (
                      <tr key={cpn.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-sm">
                          {cpn.code}
                        </td>
                        <td className="py-3 px-3 uppercase font-mono text-stone-500">{cpn.discountType}</td>
                        <td className="py-3 px-3 font-mono text-right font-bold text-stone-900">
                          {cpn.discountType === 'percentage' ? `${cpn.discountValue}%` : `$${cpn.discountValue.toFixed(2)}`}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-stone-600">
                          ${cpn.minOrderAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {cpn.currentUsageCount} / {cpn.maxUsageLimit}
                        </td>
                        <td className="py-3 px-3 text-stone-500">
                          {new Date(cpn.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-semibold text-xs ${
                              cpn.isActive ? 'text-emerald-600' : 'text-stone-400'
                            }`}
                          >
                            {cpn.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MODULE 7: SETTINGS & SEED RE-INITIALIZATION */}
          {/* ================================================== */}
          {activeModule === 'settings' && settings && (
            <div className="max-w-2xl bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6 text-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Storefront Configuration</h2>
                <p className="text-xs text-stone-500">Manage currencies, shipping thresholds, and tax policies</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                      Free Shipping Threshold ($)
                    </label>
                    <input
                      type="number"
                      value={settings.freeShippingThreshold}
                      onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.taxRatePercent}
                      onChange={(e) => setSettings({ ...settings, taxRatePercent: parseFloat(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900"
                    />
                  </div>
                </div>

                {settingsSavedMsg && (
                  <p className="text-emerald-600 font-semibold">Settings successfully updated.</p>
                )}

                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-6 rounded-xl cursor-pointer"
                >
                  Save Store Configurations
                </button>
              </form>

              {/* Seed Reset Card */}
              <div className="pt-6 border-t border-stone-200 space-y-3">
                <h3 className="text-sm font-bold text-stone-900">Demo Dataset Management</h3>
                <p className="text-xs text-stone-500">
                  Restore all initial 32 demo products, sample orders, customers, and inventory audit logs.
                </p>
                {seedResetMsg && (
                  <p className="text-emerald-600 font-bold">Database successfully re-seeded to initial state.</p>
                )}
                <button
                  type="button"
                  onClick={handleResetSeedData}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Reset Demo Seed Data
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ORDER DETAILS MODAL / DRAWER */}
      {/* ---------------------------------------------------- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-center justify-center">
          <div onClick={() => setSelectedOrderDetails(null)} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Order Fulfillment: #{selectedOrderDetails.orderNumber}
                </h3>
                <span className="text-stone-400 font-mono text-[11px]">
                  Placed {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Change Status Control */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <label className="block text-[11px] font-mono uppercase font-bold text-stone-600">
                Update Order Status & Inventory State
              </label>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as Order['status'][]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, st)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase font-bold cursor-pointer transition-colors ${
                        selectedOrderDetails.status === st
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                * Note: Transitioning to <strong>cancelled</strong> or <strong>returned</strong> automatically returns items back to available inventory.
              </p>
            </div>

            {/* Refund Action */}
            {selectedOrderDetails.paymentStatus !== 'refunded' && (
              <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <div>
                  <strong>Issue Financial Refund:</strong>
                  <p className="text-[11px] text-rose-700">Marks payment as refunded and adds staff audit entry.</p>
                </div>
                <button
                  onClick={() => handleRefundOrder(selectedOrderDetails.id)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Process Refund
                </button>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase text-stone-500 font-bold block">Purchased Objects</span>
              {selectedOrderDetails.items.map((i) => (
                <div key={i.id} className="flex justify-between items-center p-2 rounded-lg bg-stone-50">
                  <div className="flex items-center gap-3">
                    <img src={i.productImage} alt="" className="w-10 h-10 rounded-md object-cover bg-stone-200" />
                    <div>
                      <strong className="text-stone-900">{i.productName}</strong>
                      <span className="text-stone-400 text-[11px] font-mono block">
                        {i.quantity} × ${i.unitPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold">${i.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between font-bold text-sm">
              <span>Total Paid:</span>
              <span className="font-mono">${selectedOrderDetails.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MANUAL STOCK ADJUSTMENT MODAL */}
      {/* ---------------------------------------------------- */}
      {isAdjustStockModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-center justify-center">
          <div onClick={() => setIsAdjustStockModalOpen(false)} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Manual Inventory Adjustment</h3>
              <button onClick={() => setIsAdjustStockModalOpen(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase font-semibold text-stone-500 mb-1">
                  Product
                </label>
                <select
                  required
                  value={stockAdjustProductId}
                  onChange={(e) => setStockAdjustProductId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-semibold text-stone-500 mb-1">
                  Quantity Change (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustQty}
                  onChange={(e) => setStockAdjustQty(parseInt(e.target.value, 10))}
                  placeholder="e.g. 10 or -2"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-semibold text-stone-500 mb-1">
                  Audit Reason
                </label>
                <select
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none"
                >
                  <option value="restock">Restock / Warehouse Shipment Received</option>
                  <option value="manual_adjustment">Physical Cycle Count Correction</option>
                  <option value="damage">Damaged or Defective Write-off</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-semibold text-stone-500 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={stockAdjustNotes}
                  onChange={(e) => setStockAdjustNotes(e.target.value)}
                  placeholder="e.g. Received PO-8839 from supplier"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl cursor-pointer"
              >
                Commit Inventory Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer */}
      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}
    </div>
  );
};
