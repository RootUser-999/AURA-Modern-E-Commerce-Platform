import React, { useState, useEffect } from 'react';
import {
  Package,
  Heart,
  User as UserIcon,
  LogOut,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  Printer,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { Order, Product } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';

interface AccountViewProps {
  onSelectProduct: (product: Product) => void;
  onExploreCatalog: () => void;
  onGoToCheckout: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  onSelectProduct,
  onExploreCatalog,
  onGoToCheckout,
}) => {
  const { user, login, register, logout, refreshUser } = useAuth();
  const { addToCart } = useCart();

  // Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');

  // Auth form states (when logged out)
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Wishlist State
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  // Profile update state
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileStreet, setProfileStreet] = useState(user?.address?.street || '');
  const [profileCity, setProfileCity] = useState(user?.address?.city || '');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setOrdersLoading(true);
      api.getOrders()
        .then((res) => setOrders(res.orders))
        .catch(console.error)
        .finally(() => setOrdersLoading(false));

      api.getWishlist()
        .then((res) => setWishlistProducts(res.products))
        .catch(console.error);

      setProfilePhone(user.phone || '');
      setProfileStreet(user.address?.street || '');
      setProfileCity(user.address?.city || '');
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegistering) {
        await register({
          username: authEmail.split('@')[0],
          email: authEmail.trim(),
          fullName: authName.trim(),
        });
      } else {
        await login(authEmail.trim(), authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleQuickDemoLogin = async (email: string) => {
    setAuthError(null);
    try {
      await login(email, 'demo');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Your reserved items will be returned to inventory.')) return;
    try {
      const res = await api.cancelOrder(orderId);
      if (res.success && res.order) {
        setOrders(orders.map((o) => (o.id === orderId ? res.order : o)));
      }
    } catch (err: any) {
      alert(err.message || 'Failed cancelling order');
    }
  };

  const handleReorder = (order: Order) => {
    for (const item of order.items) {
      api.getProduct(item.productId).then((res) => {
        addToCart(res.product, item.quantity);
      }).catch(console.error);
    }
    onGoToCheckout();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        phone: profilePhone,
        address: {
          street: profileStreet,
          city: profileCity,
          state: user?.address?.state || 'WA',
          postalCode: user?.address?.postalCode || '98101',
          country: user?.address?.country || 'United States',
        },
      });
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------------------------
  // LOGGED OUT VIEW: Login & Register Forms
  // ---------------------------------------------
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-bold">
            Studio Membership
          </span>
          <h1 className="text-2xl font-bold text-stone-900">
            {isRegistering ? 'Create Collector Account' : 'Sign in to Your Account'}
          </h1>
          <p className="text-xs text-stone-500">
            Access past order histories, manage addresses, and view invoices.
          </p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500 font-bold block">
            1-Click Demo Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('elena.rostova@designlab.io')}
              className="p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-left cursor-pointer transition-colors"
            >
              <strong className="block text-stone-900 truncate">Elena Rostova</strong>
              <span className="text-[10px] text-stone-400 font-mono">VIP Collector</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('marcus.vance@archstudio.com')}
              className="p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-left cursor-pointer transition-colors"
            >
              <strong className="block text-stone-900 truncate">Marcus Vance</strong>
              <span className="text-[10px] text-stone-400 font-mono">Architect</span>
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4 text-xs">
          {isRegistering && (
            <div>
              <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="elena.rostova@designlab.io"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
              Password (or demo PIN)
            </label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl cursor-pointer transition-colors"
          >
            {isRegistering ? 'Complete Registration' : 'Sign In to Account'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-stone-500 hover:text-stone-900 underline cursor-pointer"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New collector? Create an account'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---------------------------------------------
  // LOGGED IN PORTAL VIEW
  // ---------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Collector Profile */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">{user.fullName}</h1>
            <p className="text-xs text-stone-500 font-mono">{user.email} · Role: {user.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-rose-600 cursor-pointer self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'wishlist'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Wishlist ({wishlistProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Address & Profile</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="py-12 text-center text-xs text-stone-400 font-mono">Loading order records...</div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const canCancel = order.status === 'pending' || order.status === 'processing';

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
                    {/* Order Heading */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100 text-xs">
                      <div>
                        <span className="font-mono text-stone-400 block text-[11px]">ORDER NUMBER</span>
                        <strong className="font-mono text-stone-900 text-sm">{order.orderNumber}</strong>
                        <span className="text-stone-500 block mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Status Badge */}
                        <span
                          className={`font-mono text-[11px] font-bold uppercase px-2.5 py-1 rounded-md ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'cancelled'
                              ? 'bg-stone-100 text-stone-500 line-through'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Status: {order.status}
                        </span>

                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Invoice
                        </button>

                        <button
                          onClick={() => handleReorder(order)}
                          className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reorder
                        </button>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.productImage}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200"
                            />
                            <div>
                              <h4 className="font-bold text-stone-900">{item.productName}</h4>
                              <span className="font-mono text-stone-500 text-[11px]">
                                Qty: {item.quantity} · SKU: {item.productSku} · ${item.unitPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-900">
                            ${item.lineTotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer: Tracking info & Cancellation */}
                    <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        {order.trackingNumber ? (
                          <span className="text-stone-600 flex items-center gap-1.5 font-mono">
                            <Truck className="w-3.5 h-3.5 text-indigo-600" />
                            Tracking: <strong>{order.trackingNumber}</strong> ({order.carrier})
                          </span>
                        ) : (
                          <span className="text-stone-400 font-mono">
                            Fulfillment: {order.shippingMethod}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-extrabold text-stone-950">
                          Total: ${order.total.toFixed(2)}
                        </span>

                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline text-[11px]"
                          >
                            Cancel Order & Restore Stock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
              <Package className="w-10 h-10 mx-auto text-stone-400" />
              <h3 className="font-bold text-stone-900 text-sm">No orders on record yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Acquisitions placed through checkout will be tracked here with live courier updates and printable invoices.
              </p>
              <button
                onClick={onExploreCatalog}
                className="bg-stone-900 text-white font-bold text-xs py-2.5 px-5 rounded-lg cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistProducts.map((prod) => (
                <div key={prod.id} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100">
                    <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs">{prod.name}</h4>
                    <span className="font-mono font-bold text-xs text-stone-950 block mt-1">
                      ${(prod.salePrice ?? prod.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onSelectProduct(prod)}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold py-2 rounded-lg cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <Heart className="w-8 h-8 mx-auto text-stone-300" />
              <h3 className="font-bold text-stone-900 text-sm">Your wishlist is empty</h3>
              <p className="text-xs text-stone-500">Save items you wish to evaluate later.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6 text-xs">
          <h3 className="font-bold text-stone-900 text-sm">Shipping Information & Contact</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                Default Street Address
              </label>
              <input
                type="text"
                value={profileStreet}
                onChange={(e) => setProfileStreet(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                City
              </label>
              <input
                type="text"
                value={profileCity}
                onChange={(e) => setProfileCity(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900"
              />
            </div>

            {profileSaved && (
              <p className="text-emerald-600 font-semibold">Profile updated successfully.</p>
            )}

            <button
              type="submit"
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-6 rounded-xl cursor-pointer"
            >
              Update Preferences
            </button>
          </form>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
