import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { api } from '../lib/api';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon: string | null;
  shippingFee: number;
  tax: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  shippingThreshold: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aura_cart_v1';
const COUPON_STORAGE_KEY = 'aura_cart_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    return localStorage.getItem(COUPON_STORAGE_KEY) || null;
  });

  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Recalculate subtotal
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Validate applied coupon whenever subtotal changes
  useEffect(() => {
    if (!appliedCoupon || subtotal <= 0) {
      setCouponDiscount(0);
      return;
    }
    api.validateCoupon(appliedCoupon, subtotal)
      .then((res) => {
        if (res.valid) {
          setCouponDiscount(res.discountAmount);
        } else {
          setCouponDiscount(0);
        }
      })
      .catch(() => {
        setCouponDiscount(0);
      });
  }, [appliedCoupon, subtotal]);

  const shippingThreshold = 150.00;
  const standardShippingFee = 12.00;
  const shippingFee = subtotal > 0 && subtotal >= shippingThreshold ? 0.00 : subtotal > 0 ? standardShippingFee : 0.00;
  
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const tax = parseFloat(((taxableAmount * 8.25) / 100).toFixed(2));
  const total = parseFloat((taxableAmount + shippingFee + tax).toFixed(2));

  const addToCart = (product: Product, quantity = 1): { success: boolean; message?: string } => {
    if (!product.isActive) {
      return { success: false, message: 'This product is currently unavailable.' };
    }
    if (product.stock <= 0) {
      return { success: false, message: 'This product is currently out of stock.' };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const targetQty = currentQty + quantity;

    if (targetQty > product.stock) {
      return {
        success: false,
        message: `Only ${product.stock} units available in stock. You currently have ${currentQty} in cart.`,
      };
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity = targetQty;
      // also ensure latest product data is stored
      updated[existingIndex].product = product;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity }]);
    }

    setIsCartOpen(true);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === productId);
    if (existingIndex === -1) return { success: false, message: 'Item not in cart' };

    const item = cart[existingIndex];
    if (quantity > item.product.stock) {
      return {
        success: false,
        message: `Only ${item.product.stock} unit(s) available in stock.`,
      };
    }

    const updated = [...cart];
    updated[existingIndex].quantity = quantity;
    setCart(updated);
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.valid) {
        setAppliedCoupon(res.code);
        setCouponDiscount(res.discountAmount);
        localStorage.setItem(COUPON_STORAGE_KEY, res.code);
        return { success: true, message: `Promo code "${res.code}" applied: -$${res.discountAmount.toFixed(2)}` };
      }
      return { success: false, message: 'Invalid promo code.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed applying coupon.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(couponDiscount.toFixed(2)),
        appliedCoupon,
        shippingFee: parseFloat(shippingFee.toFixed(2)),
        tax,
        total,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        shippingThreshold,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
