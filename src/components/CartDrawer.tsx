import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onExploreCatalog: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onExploreCatalog,
}) => {
  const {
    cart,
    cartCount,
    subtotal,
    discount,
    appliedCoupon,
    shippingFee,
    tax,
    total,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    shippingThreshold,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const res = await applyCoupon(couponInput.trim());
    setCouponLoading(false);
    setCouponMsg({ text: res.message, error: !res.success });
    if (res.success) setCouponInput('');
  };

  const amountToFreeShipping = Math.max(0, shippingThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / shippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAFAF8] shadow-2xl border-l border-stone-200 flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-stone-900" />
              <h2 className="text-base font-bold text-stone-900">Your Shopping Bag</h2>
              <span className="font-mono text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {cart.length > 0 && (
            <div className="bg-white px-5 py-3 border-b border-stone-200">
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                {amountToFreeShipping > 0 ? (
                  <span className="text-stone-700">
                    Add <strong className="font-mono font-bold text-indigo-600">${amountToFreeShipping.toFixed(2)}</strong> for free worldwide shipping
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> You unlocked free express shipping!
                  </span>
                )}
                <span className="font-mono text-stone-400 text-[11px]">{shippingProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Your bag is empty</h3>
                  <p className="text-xs text-stone-500 max-w-xs mt-1">
                    Explore our curated collection of architectural desk gear, acoustics, and precision timepieces.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExploreCatalog();
                  }}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const price = item.product.salePrice ?? item.product.price;
                const lineTotal = price * item.quantity;
                const isMaxStock = item.quantity >= item.product.stock;

                return (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3.5 bg-white rounded-xl border border-stone-200/80 shadow-xs"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-18 h-18 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-mono text-stone-400">
                            {item.product.brand}
                          </span>
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.product.name}</h4>
                          <span className="text-[11px] font-mono text-stone-500">
                            ${price.toFixed(2)} each
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Stepper & Line Total */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1.5 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-semibold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            disabled={isMaxStock}
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1.5 text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors cursor-pointer"
                            title={isMaxStock ? 'Max available stock reached' : 'Increase quantity'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-bold text-stone-900 tabular-nums">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-stone-200 space-y-4">
              
              {/* Promo Code Input */}
              <div className="space-y-1.5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied: <strong>{appliedCoupon}</strong> (-${discount.toFixed(2)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-stone-400 hover:text-stone-700 text-[11px] font-semibold cursor-pointer underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Promo code (try WELCOME10)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs uppercase font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponMsg && (
                  <p className={`text-[11px] flex items-center gap-1 ${couponMsg.error ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {couponMsg.error ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Order Cost Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-stone-900 tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-mono tabular-nums">
                    {shippingFee === 0 ? <strong className="text-emerald-600 uppercase font-bold">Free</strong> : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Sales Tax (8.25%)</span>
                  <span className="font-mono text-stone-900 tabular-nums">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-stone-950 tabular-nums">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedToCheckout();
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-center text-[11px] text-stone-500 pt-1">
                  <span>Guaranteed safe checkout</span>
                  <button
                    onClick={clearCart}
                    className="hover:text-rose-600 underline cursor-pointer"
                  >
                    Clear Bag
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
