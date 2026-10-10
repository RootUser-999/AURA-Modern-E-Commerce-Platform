import React, { useState } from 'react';
import { X, ShoppingBag, Zap, Star, Check, Shield, Truck } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onSelectProduct,
  onBuyNow,
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const price = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    onBuyNow(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-center justify-center">
      <div onClick={onClose} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 rounded-full shadow-sm transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Gallery */}
        <div className="md:w-1/2 bg-[#F4F4F0] flex items-center justify-center p-6 relative">
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-72 md:h-96 object-cover rounded-xl shadow-xs"
          />
        </div>

        {/* Product Details & Purchase Controls */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-mono uppercase tracking-wider text-[11px]">{product.brand}</span>
              <span className="font-mono text-stone-400">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl font-bold text-stone-900">{product.name}</h2>

            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-stone-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-mono font-medium text-stone-700">{product.rating}</span>
              <span className="text-xs text-stone-400">({product.reviewCount} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-mono text-2xl font-bold text-stone-950 tabular-nums">
                ${price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="font-mono text-sm text-stone-400 line-through tabular-nums">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {product.description}
            </p>

            {/* Inventory indicator */}
            <div className="text-xs font-medium pt-1">
              {isOutOfStock ? (
                <span className="text-rose-600">Currently out of stock</span>
              ) : product.stock <= product.lowStockThreshold ? (
                <span className="text-amber-600">Only {product.stock} units left in studio storage</span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> In stock · Ships within 24 hours
                </span>
              )}
            </div>
          </div>

          {/* Stepper and CTAs */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-200 disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-xs font-bold text-stone-800">
                  {quantity}
                </span>
                <button
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-200 disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  isOutOfStock
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{added ? 'Added to Bag' : 'Add to Bag'}</span>
              </button>
            </div>

            <button
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Instant Buy Now</span>
            </button>

            <button
              onClick={() => {
                onSelectProduct(product);
                onClose();
              }}
              className="w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-900 pt-1 cursor-pointer"
            >
              View Full Technical Specifications &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
