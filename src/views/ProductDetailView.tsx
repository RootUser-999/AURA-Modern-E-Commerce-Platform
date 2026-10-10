import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Zap,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowLeft,
  Share2,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailViewProps {
  product: Product;
  onBackToCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product: initialProduct,
  onBackToCatalog,
  onSelectProduct,
  onBuyNow,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product>(initialProduct);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>(initialProduct.images[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'shipping'>('specs');

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch full details and reviews
  useEffect(() => {
    setProduct(initialProduct);
    setSelectedImage(initialProduct.images[0] || '');
    setQuantity(1);

    api.getProduct(initialProduct.id).then((res) => {
      setProduct(res.product);
      setReviews(res.reviews);
      setRelated(res.related);
    }).catch(console.error);
  }, [initialProduct.id]);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const price = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 1200);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    onBuyNow(product, quantity);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await api.addReview(product.id, {
        rating: reviewRating,
        title: reviewTitle.trim() || 'Product Review',
        comment: reviewComment.trim(),
        userName: user?.fullName || 'Verified Collector',
      });
      setReviews([res.review, ...reviews]);
      setReviewComment('');
      setReviewTitle('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb Bar */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-1.5 font-semibold text-stone-700 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
          <span>SKU: {product.sku}</span>
          <span>·</span>
          <span>Brand: {product.brand}</span>
        </div>
      </div>

      {/* Main PDP Grid: Gallery Left, Sticky Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Image Gallery (6 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Visual */}
          <div className="aspect-[4/3] bg-[#F4F4F0] rounded-2xl overflow-hidden border border-[#E5E5DF] flex items-center justify-center relative">
            <img
              src={selectedImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-stone-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">
                SAVE ${(product.price - product.salePrice!).toFixed(0)}
              </span>
            )}
          </div>

          {/* Secondary Thumbnail Row */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedImage === img ? 'border-indigo-600 shadow-sm' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* In-depth Editorial Narrative */}
          <div className="pt-8 space-y-4 border-t border-stone-200">
            <h3 className="text-sm font-mono uppercase tracking-wider text-stone-900 font-bold">
              Engineering Narrative
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module (5 cols, sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5DF] shadow-xs">
          
          {/* Title & Brand */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-widest text-indigo-600 font-bold text-[11px]">
                {product.brand}
              </span>
              <span className="font-mono text-stone-400 text-[11px]">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-stone-300'}`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-bold text-stone-800">{product.rating}</span>
              <span className="text-xs text-stone-500">· {reviews.length || product.reviewCount} verified collector evaluations</span>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="p-4 bg-stone-50 rounded-2xl flex items-baseline justify-between border border-stone-100">
            <div>
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Studio Price</span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="font-mono text-3xl font-extrabold text-stone-950 tabular-nums">
                  ${price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="font-mono text-sm text-stone-400 line-through tabular-nums">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {hasDiscount && (
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                Save ${((product.price - product.salePrice!) / product.price * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* Live Inventory Status */}
          <div className="text-xs space-y-1">
            <div className="font-medium">
              {isOutOfStock ? (
                <span className="text-rose-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" /> Currently Sold Out in Production
                </span>
              ) : isLowStock ? (
                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" /> Only {product.stock} units remaining in studio storage
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> In stock · Ships within 24 hours ({product.stock} units ready)
                </span>
              )}
            </div>
          </div>

          {/* Purchase Stepper & CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                <button
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-3 text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-xs font-bold text-stone-900">
                  {quantity}
                </span>
                <button
                  disabled={quantity >= product.stock || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-3 text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Bag */}
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : addedToast
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white hover:scale-101'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{addedToast ? 'Added to Bag' : 'Add to Bag'}</span>
              </button>
            </div>

            {/* Instant Buy Now Button */}
            <button
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Instant Buy Now Checkout</span>
            </button>
          </div>

          {/* Guarantees List */}
          <div className="pt-6 border-t border-stone-100 space-y-3 text-xs text-stone-600">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Complimentary insured shipping on orders over $150</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>30-Day risk-free trial in your own studio workflow</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>2-Year manufacturer guarantee on mechanical hardware</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Technical Specifications & Reviews */}
      <div className="pt-10 border-t border-stone-200">
        <div className="flex gap-4 border-b border-stone-200 mb-8">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'specs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Specifications */}
        {activeTab === 'specs' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
              {Object.entries(product.specifications || {}).map(([key, val]) => (
                <div key={key} className="grid grid-cols-2 p-4 text-xs">
                  <span className="font-mono text-stone-500 font-semibold">{key}</span>
                  <span className="font-medium text-stone-900">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Reviews & Add Review Form */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Reviews List */}
            <div className="md:col-span-7 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-stone-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[11px] text-stone-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900">{rev.title}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                    <div className="pt-2 text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{rev.userName} · Verified Collector Purchase</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-stone-50 rounded-2xl text-xs text-stone-500">
                  No evaluations submitted yet for this product. Be the first to share your impression.
                </div>
              )}
            </div>

            {/* Write a Review Form */}
            <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 h-fit space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Submit Collector Evaluation
              </h3>

              {reviewSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Evaluation submitted successfully. Thank you for your review.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unrivaled soundstage and finish"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
                      Evaluation Notes
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Detail build quality, everyday ergonomics, or performance..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Evaluation'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Carousel / Grid */}
      {related.length > 0 && (
        <div className="pt-12 border-t border-stone-200 space-y-6">
          <h3 className="text-xl font-bold text-stone-900">Complementary Objects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onSelectProduct={onSelectProduct}
                onBuyNow={(p) => onBuyNow(p, 1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
