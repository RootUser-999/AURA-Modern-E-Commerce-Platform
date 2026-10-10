import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Star } from 'lucide-react';
import { Product } from '../types';
import { api } from '../lib/api';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onViewAllResults: (query: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({ q: query.trim(), limit: '6' });
        setResults(res.products);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div onClick={onClose} className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity" />

      <div className="relative mx-auto max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-stone-200 bg-stone-50">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audio, watches, desk gear, SKU, or brand..."
            className="w-full py-4 px-3 bg-transparent text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400 font-mono">Searching catalog...</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-stone-400">{product.brand}</span>
                      <span className="text-[10px] font-mono text-stone-400">· SKU: {product.sku}</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-indigo-600 truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-stone-900">
                        ${(product.salePrice ?? product.price).toFixed(2)}
                      </span>
                      {product.stock <= 0 && <span className="text-rose-600 text-[10px]">Sold Out</span>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors shrink-0" />
                </div>
              ))}
              <div className="pt-2 px-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    onViewAllResults(query);
                    onClose();
                  }}
                  className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  View all results in Catalog &rarr;
                </button>
              </div>
            </div>
          ) : query.trim() ? (
            <div className="py-10 text-center">
              <p className="text-xs text-stone-500">No matching products found for "{query}".</p>
              <p className="text-[11px] text-stone-400 mt-1">Try searching "Aether", "Titanium", "Lamp", or "Backpack".</p>
            </div>
          ) : (
            <div className="p-4 text-xs text-stone-400 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                Quick Search Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Headphones', 'Titanium Watch', 'Desk Lamp', 'Backpack', 'Charger', 'Acoustic'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
