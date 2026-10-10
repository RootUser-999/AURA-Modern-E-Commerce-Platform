import React, { useState } from 'react';
import { ShoppingBag, Eye, Zap, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onQuickView,
  onBuyNow,
}) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      addToCart(product, 1);
    }
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group flex flex-col bg-white border border-[#E5E5DF] rounded-xl overflow-hidden hover:border-[#111827]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/3] bg-[#F4F4F0] overflow-hidden flex items-center justify-center">
        {!imageError && product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
          />
        ) : (
          /* Styled Fallback Container */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-stone-400 bg-stone-100">
            <span className="text-xs uppercase tracking-widest font-mono font-medium text-stone-500">
              {product.brand}
            </span>
            <span className="text-sm font-semibold text-stone-800 text-center mt-1">
              {product.name}
            </span>
          </div>
        )}

        {/* Quiet status badges (unboxed text or small status pill) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {hasDiscount && (
            <span className="bg-[#111827] text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-sm">
              SAVE ${(product.price - product.salePrice!).toFixed(0)}
            </span>
          )}
          {product.isNewArrival && !hasDiscount && (
            <span className="bg-white/90 backdrop-blur-sm text-stone-900 border border-stone-200 text-[11px] font-semibold px-2 py-0.5 rounded-sm shadow-xs">
              NEW RELEASE
            </span>
          )}
        </div>

        {/* Hover Quick Actions Overlay */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="flex-1 bg-white/95 hover:bg-white text-stone-900 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm backdrop-blur-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
              Quick View
            </button>
          )}

          <button
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Instant Buy Now Checkout"
          >
            <Zap className="w-3.5 h-3.5" />
            Buy Now
          </button>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Unboxed clean metadata with dot separator */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="font-mono uppercase tracking-wider text-[11px]">{product.brand}</span>
            <div className="flex items-center gap-1 text-stone-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-mono text-xs font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-stone-400 text-[11px]">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="font-bold text-[15px] sm:text-base text-stone-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Price and Add to Cart Section */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-base sm:text-lg font-bold text-stone-900 tabular-nums">
                ${(product.salePrice ?? product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="font-mono text-xs text-stone-400 line-through tabular-nums">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Inventory Status Text */}
            <div className="text-[11px] mt-0.5">
              {isOutOfStock ? (
                <span className="text-rose-600 font-medium">Sold Out</span>
              ) : isLowStock ? (
                <span className="text-amber-600 font-medium">Only {product.stock} units left</span>
              ) : (
                <span className="text-emerald-600 font-medium">In Stock</span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`p-2.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : isAdding
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs hover:scale-102 active:scale-98'
            }`}
            title={isOutOfStock ? 'Item is out of stock' : 'Add to Shopping Bag'}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{isAdding ? 'Added' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
