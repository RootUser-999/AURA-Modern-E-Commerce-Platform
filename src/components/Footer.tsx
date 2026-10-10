import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Award, Check } from 'lucide-react';

interface FooterProps {
  setCurrentView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#111827] text-white pt-16 pb-12 border-t border-stone-800">
      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-stone-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-3.5">
            <Truck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Global Express Courier</h4>
              <p className="text-xs text-stone-400 mt-0.5">Complimentary delivery on all studio orders above $150.</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <RefreshCw className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">30-Day In-Studio Trial</h4>
              <p className="text-xs text-stone-400 mt-0.5">Test any object in your workflow with hassle-free returns.</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <Award className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">2-Year Atelier Warranty</h4>
              <p className="text-xs text-stone-400 mt-0.5">Comprehensive coverage on all machined and dynamic parts.</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Encrypted Transactions</h4>
              <p className="text-xs text-stone-400 mt-0.5">Bank-grade security supporting major cards, COD, and Stripe.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Brand column */}
        <div className="md:col-span-4 space-y-4">
          <span className="font-extrabold text-2xl tracking-tighter text-white">
            AURA<span className="text-indigo-400">.</span>
          </span>
          <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
            A contemporary design lab crafting precision horology, acoustic monitors, machined desk instruments, and architectural everyday objects. Engineered for discerning practitioners.
          </p>
          <div className="text-xs text-stone-500 pt-2 font-mono">
            Designed for longevity · Minimalist ergonomics
          </div>
        </div>

        {/* Catalog Navigation */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-stone-300">Collections</h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <button onClick={() => setCurrentView('catalog')} className="hover:text-white transition-colors cursor-pointer">
                Complete Catalog
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('catalog');
                  window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-audio' }));
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Tech & Studio Audio
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('catalog');
                  window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-workspace' }));
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Studio & Desk Gear
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('catalog');
                  window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-timepieces' }));
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Precision Horology
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('catalog');
                  window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-carry' }));
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Technical Carry
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-stone-300">Client Service</h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>
              <button onClick={() => setCurrentView('account')} className="hover:text-white transition-colors cursor-pointer">
                Order Tracking
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('account')} className="hover:text-white transition-colors cursor-pointer">
                Customer Portal
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('admin-login')} className="hover:text-amber-300 transition-colors font-medium cursor-pointer">
                Admin Console
              </button>
            </li>
            <li>
              <span className="text-stone-500">concierge@aurastudio.com</span>
            </li>
            <li>
              <span className="text-stone-500">+1 (800) 555-AURA</span>
            </li>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-stone-300">The Studio Dispatch</h4>
          <p className="text-xs text-stone-400">
            Receive early access to limited edition production runs, engineering journals, and archival releases.
          </p>
          {subscribed ? (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Thank you. You are on the priority studio list.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="bg-stone-900 border border-stone-800 text-white placeholder-stone-500 text-xs rounded-lg px-3.5 py-2.5 w-full focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-stone-900 hover:bg-stone-100 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                Join
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
          <p className="text-[11px] text-stone-500">Zero spam. You can unsubscribe anytime with one click.</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div>© 2026 AURA Studio Inc. All rights reserved. Registered trademark.</div>
        <div className="flex items-center gap-4 text-stone-400">
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span>·</span>
          <span className="hover:text-white cursor-pointer">Terms of Service</span>
          <span>·</span>
          <span className="hover:text-white cursor-pointer">Shipping & Returns</span>
        </div>
      </div>
    </footer>
  );
};
