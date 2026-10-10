import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, Compass, Star, Check } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';

interface HomeViewProps {
  onSelectProduct: (product: Product) => void;
  onExploreCatalog: (category?: string) => void;
  onQuickView: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectProduct,
  onExploreCatalog,
  onQuickView,
  onBuyNow,
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.getProducts({ limit: '12' }),
          api.getCategories(),
        ]);
        setFeaturedProducts(prodRes.products.filter((p) => p.featured).slice(0, 4));
        setBestsellers(prodRes.products.filter((p) => p.isBestseller).slice(0, 4));
        setCategories(catRes.categories);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Campaign Section (Single dominant visual anchor, split-screen desktop) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-stone-900 rounded-3xl overflow-hidden shadow-xl text-white">
          
          {/* Copy Column */}
          <div className="lg:col-span-6 p-8 sm:p-12 md:p-16 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300 uppercase tracking-widest">
                <span>The 2026 Collection</span>
                <span>·</span>
                <span>Architectural Objects</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance">
                Precision tools for focused living.
              </h1>
              
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-lg">
                Engineered from billet aluminum, raw titanium, and high-purity acoustic minerals. Everyday instruments crafted without superfluous decoration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => onExploreCatalog()}
                className="bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md hover:scale-102 cursor-pointer"
              >
                <span>Explore The Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onExploreCatalog('cat-audio')}
                className="bg-stone-800/80 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm py-3.5 px-6 rounded-xl border border-stone-700 transition-colors cursor-pointer"
              >
                Studio Acoustics
              </button>
            </div>

            {/* Micro guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-800 text-xs text-stone-400 font-mono">
              <div>
                <strong className="block text-white font-bold">200m</strong>
                Water-resistant horology
              </div>
              <div>
                <strong className="block text-white font-bold">CRI 98</strong>
                Full-spectrum lighting
              </div>
              <div>
                <strong className="block text-white font-bold">42 Hrs</strong>
                Lossless audio playback
              </div>
            </div>
          </div>

          {/* Image Showcase Column */}
          <div className="lg:col-span-6 relative min-h-[380px] lg:min-h-full bg-stone-950">
            <img
              src="/src/assets/images/hero_modern_lifestyle_1791623269890.jpg"
              alt="AURA studio instruments on travertine stone"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </section>

      {/* 2. Curated Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Explore by Taxonomy</h2>
            <p className="text-xs text-stone-500 mt-1">Disciplines of everyday industrial design</p>
          </div>
          <button
            onClick={() => onExploreCatalog()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            View Complete Index &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onExploreCatalog(cat.id)}
              className="group bg-white border border-[#E5E5DF] rounded-2xl p-3 sm:p-4 hover:border-stone-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden mb-3">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] font-mono text-stone-400 block mt-0.5">
                  {cat.itemCount ?? 0} pieces
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Studio Objects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-indigo-600 font-semibold mb-1">
              Curated Highlights
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Studio Signature Pieces</h2>
          </div>
          <button
            onClick={() => onExploreCatalog()}
            className="text-xs font-bold text-stone-900 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            Shop All &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
              onQuickView={onQuickView}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* 4. Craftsmanship & Philosophy (Editorial Split) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F4F4F0] rounded-3xl p-8 sm:p-14 border border-[#E5E5DF] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500 font-semibold">
              The Materiality Principle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
              Every detail is calibrated to eliminate distraction and endure decades.
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              We reject the planned obsolescence of modern consumer technology. Our mechanical components are CNC-machined from single-billet metals rather than cast plastics. Our timepieces house repairable automatic mechanical movements, and our acoustics utilize inert natural minerals to damp parasitic vibration.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero subscription locks or forced software obsolescence.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Replaceable modular cables, bands, and serviceable batteries.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-stone-200">
            <img
              src="/src/assets/images/product_titanium_watch_1791623305701.jpg"
              alt="Titanium watch macro detail"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Bestselling Objects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-amber-600 font-semibold mb-1">
              Popular Selections
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Bestselling Hardware</h2>
          </div>
          <button
            onClick={() => onExploreCatalog()}
            className="text-xs font-bold text-stone-900 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            Explore Catalog &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
              onQuickView={onQuickView}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* 6. Authentic Testimonials / Social Proof (Adjacency rule) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E5E5DF] pt-14">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-xl font-bold text-stone-900">Evaluated by Practitioners</h3>
            <p className="text-xs text-stone-500 mt-1">Real feedback from architects, sound designers, and studio engineers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5DF] shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  "The Aether headphones have replaced my studio monitors for late-night mastering sessions. The transient speed and comfort are unequaled."
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100 mt-4 text-xs">
                <strong className="block text-stone-900 font-bold">Elena Rostova</strong>
                <span className="text-stone-400 text-[11px]">Audio Mastering Engineer · Berlin</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E5DF] shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  "The titanium field watch has survived 6 months of daily site inspections, rain, and travel. Bead-blast finish looks as clean as day one."
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100 mt-4 text-xs">
                <strong className="block text-stone-900 font-bold">Marcus Vance</strong>
                <span className="text-stone-400 text-[11px]">Principal Architect · San Francisco</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E5DF] shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  "The cantilever studio lamp's 98 CRI light makes digital and physical sketching completely seamless. Truly exceptional industrial craftsmanship."
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100 mt-4 text-xs">
                <strong className="block text-stone-900 font-bold">Sophia Chen</strong>
                <span className="text-stone-400 text-[11px]">Industrial Designer · New York</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
