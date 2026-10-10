import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
  Tag,
  ArrowRight,
  Package,
  Printer,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Order, Product } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';

interface CheckoutViewProps {
  buyNowItem?: { product: Product; quantity: number } | null;
  onOrderSuccess: (order: Order) => void;
  onContinueShopping: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  buyNowItem,
  onOrderSuccess,
  onContinueShopping,
}) => {
  const { cart, subtotal: cartSubtotal, discount: cartDiscount, appliedCoupon: cartCoupon, clearCart } = useCart();
  const { user } = useAuth();

  // Determine items being checked out (Buy Now vs Regular Cart)
  const items = buyNowItem
    ? [
        {
          productId: buyNowItem.product.id,
          productName: buyNowItem.product.name,
          productSku: buyNowItem.product.sku,
          productImage: buyNowItem.product.images[0],
          unitPrice: buyNowItem.product.salePrice ?? buyNowItem.product.price,
          quantity: buyNowItem.quantity,
          lineTotal: (buyNowItem.product.salePrice ?? buyNowItem.product.price) * buyNowItem.quantity,
        },
      ]
    : cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        productImage: item.product.images[0],
        unitPrice: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
        lineTotal: (item.product.salePrice ?? item.product.price) * item.quantity,
      }));

  // Customer Contact & Shipping Form
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '+1 (555) 234-5678',
    street: user?.address?.street || '742 Evergreen Terrace',
    city: user?.address?.city || 'Seattle',
    state: user?.address?.state || 'WA',
    postalCode: user?.address?.postalCode || '98101',
    country: user?.address?.country || 'United States',
    deliveryNotes: '',
  });

  // Shipping & Payment Options
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'stripe'>('card');
  const [cardData, setCardData] = useState({
    number: '4242 •••• •••• 4242',
    expiry: '12/28',
    cvc: '888',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState(buyNowItem ? '' : cartCoupon || '');
  const [couponDiscount, setCouponDiscount] = useState(buyNowItem ? 0 : cartDiscount);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Financial calculations
  const rawSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const activeDiscount = couponDiscount;
  const taxableAmount = Math.max(0, rawSubtotal - activeDiscount);
  const shippingFee =
    shippingMethod === 'express'
      ? 25.00
      : rawSubtotal >= 150.00
      ? 0.00
      : 12.00;
  const tax = parseFloat(((taxableAmount * 8.25) / 100).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + shippingFee + tax).toFixed(2));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await api.validateCoupon(couponCode.trim(), rawSubtotal);
      if (res.valid) {
        setCouponDiscount(res.discountAmount);
        setCouponMsg(`Applied: -$${res.discountAmount.toFixed(2)}`);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Invalid coupon');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        shippingAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
          deliveryNotes: formData.deliveryNotes.trim(),
        },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: couponDiscount > 0 ? couponCode : undefined,
        shippingMethod,
        paymentMethod,
      };

      const res = await api.checkout(payload);

      if (res.success && res.order) {
        setCompletedOrder(res.order);
        if (!buyNowItem) clearCart();
        onOrderSuccess(res.order);

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Checkout failed. Please check stock and details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // ORDER CONFIRMATION VIEW (If order successfully created)
  // ----------------------------------------------------
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-700 font-bold">
              Payment & Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Thank you, {completedOrder.customerName}.
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Your studio order <strong className="font-mono text-stone-900 font-bold">#{completedOrder.orderNumber}</strong> has been confirmed and routed to warehouse fulfillment.
            </p>
          </div>

          {/* Fulfillment snapshot card */}
          <div className="bg-stone-50 rounded-2xl p-6 text-left border border-stone-200 text-xs space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stone-200">
              <div>
                <span className="text-stone-400 block font-mono text-[11px]">DELIVERY ADDRESS</span>
                <span className="font-semibold text-stone-900 block mt-0.5">
                  {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}
                </span>
                <span className="text-stone-500">
                  {completedOrder.shippingAddress.state} {completedOrder.shippingAddress.postalCode}, {completedOrder.shippingAddress.country}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block font-mono text-[11px]">ESTIMATED ARRIVAL</span>
                <span className="font-semibold text-stone-900 block mt-0.5">2–4 Business Days</span>
                <span className="text-stone-500">{completedOrder.shippingMethod}</span>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3">
              <span className="text-stone-400 font-mono text-[11px] block">ACQUIRED OBJECTS</span>
              {completedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-stone-200"
                    />
                    <div>
                      <strong className="text-stone-900 block">{item.productName}</strong>
                      <span className="text-stone-500 font-mono text-[11px]">
                        Qty: {item.quantity} · SKU: {item.productSku}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-stone-900">${item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-950">
              <span>Total Paid:</span>
              <span className="font-mono">${completedOrder.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setInvoiceOpen(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              View & Print Invoice
            </button>

            <button
              onClick={onContinueShopping}
              className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold text-xs py-3 px-6 rounded-xl cursor-pointer transition-colors"
            >
              Continue Browsing Studio
            </button>
          </div>
        </div>

        {invoiceOpen && (
          <InvoiceModal order={completedOrder} onClose={() => setInvoiceOpen(false)} />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // CHECKOUT FORM VIEW
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="pb-8 border-b border-stone-200 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
          Studio Checkout & Order Fulfillment
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          {buyNowItem ? 'Instant Buy Now checkout' : 'Complete your purchase with encrypted dispatch'}
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Form: Customer & Shipping & Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Customer Contact */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5DF] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-2">
                <span>01</span> Customer Contact
              </h2>
              {user ? (
                <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                  Signed in as {user.username}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-stone-400">Guest Checkout Enabled</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="elena@designlab.io"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Phone Number (for Courier Delivery Updates) *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5DF] space-y-4">
            <div className="pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-2">
                <span>02</span> Shipping Destination
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Suite, apartment, street number"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  State / Province *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Country *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  placeholder="Gate code, porch drop, signature notes..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Shipping Method Selection */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5DF] space-y-4">
            <div className="pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-2">
                <span>03</span> Courier Service
              </h2>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setShippingMethod('standard')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'standard'
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'standard'}
                    onChange={() => setShippingMethod('standard')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-stone-900">
                      Standard Carbon-Neutral Courier
                    </strong>
                    <span className="text-[11px] text-stone-500">
                      Estimated 3–5 business days delivery
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-stone-900">
                  {rawSubtotal >= 150 ? <span className="text-emerald-600 uppercase">Free</span> : '$12.00'}
                </span>
              </label>

              <label
                onClick={() => setShippingMethod('express')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'express'
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'express'}
                    onChange={() => setShippingMethod('express')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-stone-900">
                      Express Priority Air Courier
                    </strong>
                    <span className="text-[11px] text-stone-500">
                      Guaranteed 1–2 business days delivery with signature
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-stone-900">$25.00</span>
              </label>
            </div>
          </div>

          {/* Section 4: Payment Method */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5DF] space-y-4">
            <div className="pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide font-mono flex items-center gap-2">
                <span>04</span> Payment Gateway
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit / Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cod'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Cash on Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'stripe'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Stripe Test Mode</span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
                <span className="text-[11px] font-mono text-stone-500 uppercase block font-semibold">
                  Secure Mock Payment Sandbox (No real funds charged)
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2.5 font-mono text-stone-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="bg-white border border-stone-200 rounded-lg p-2.5 font-mono text-stone-800 text-center"
                    />
                    <input
                      type="text"
                      value={cardData.cvc}
                      onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                      className="bg-white border border-stone-200 rounded-lg p-2.5 font-mono text-stone-800 text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong>Cash on Delivery (COD) Selected:</strong>
                <p>
                  You will inspect the package and pay <strong>${grandTotal.toFixed(2)}</strong> upon physical arrival at your door.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary: Order Items & Totals (5 cols, sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5DF] shadow-xs space-y-6">
            <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider font-mono pb-3 border-b border-stone-100">
              Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h3>

            {/* Items scroll */}
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.productImage}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-900 truncate">{item.productName}</h4>
                    <span className="font-mono text-stone-500 text-[11px]">
                      {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-stone-900 tabular-nums">
                    ${item.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="pt-3 border-t border-stone-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-stone-900 text-white font-bold text-xs px-3 rounded-lg hover:bg-stone-800 cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponMsg && <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{couponMsg}</p>}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-xs text-stone-600 pt-3 border-t border-stone-100 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-stone-900">${rawSubtotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span className="font-mono tabular-nums">-${couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({shippingMethod === 'express' ? 'Express Air' : 'Standard Ground'})</span>
                <span className="font-mono tabular-nums text-stone-900">
                  {shippingFee === 0 ? <strong className="text-emerald-600 uppercase">Free</strong> : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sales Tax (8.25%)</span>
                <span className="font-mono tabular-nums text-stone-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-950 pt-3 border-t border-stone-200">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-101 cursor-pointer transition-all"
            >
              <span>{isSubmitting ? 'Validating Stock & Placing Order...' : `Confirm & Authorize $${grandTotal.toFixed(2)}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-[11px] text-stone-400">
              Transactions are protected by 256-bit encryption. 30-day trial policy applies.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
