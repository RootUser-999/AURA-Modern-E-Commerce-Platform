import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickSearchModal } from './components/QuickSearchModal';
import { QuickViewModal } from './components/QuickViewModal';
import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { ProductDetailView } from './views/ProductDetailView';
import { CheckoutView } from './views/CheckoutView';
import { AccountView } from './views/AccountView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { Product, Order } from './types';

function MainApp() {
  const { isAdmin } = useAuth();
  const { setIsCartOpen } = useCart();

  // Primary navigation view state
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<{ product: Product; quantity: number } | null>(null);
  
  // Search modal state
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [catalogInitialCategory, setCatalogInitialCategory] = useState('all');
  const [catalogInitialQuery, setCatalogInitialQuery] = useState('');

  // Scroll to top on view transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProduct]);

  // Navigate to product detail
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
  };

  // Quick view trigger
  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  // Instant Buy Now trigger
  const handleBuyNow = (product: Product, quantity = 1) => {
    setBuyNowItem({ product, quantity });
    setCurrentView('checkout');
  };

  // Explore catalog with optional category
  const handleExploreCatalog = (category?: string) => {
    setCatalogInitialCategory(category || 'all');
    setCatalogInitialQuery('');
    setCurrentView('catalog');
  };

  // Search results to catalog
  const handleViewAllSearchResults = (query: string) => {
    setCatalogInitialQuery(query);
    setCatalogInitialCategory('all');
    setCurrentView('catalog');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#111827]">
      {/* Top Navigation Bar (Hidden when inside Admin Console for focused workspace) */}
      {currentView !== 'admin' && (
        <Navbar
          currentView={currentView}
          setCurrentView={(v) => {
            if (v === 'catalog') {
              setCatalogInitialCategory('all');
              setCatalogInitialQuery('');
            }
            setCurrentView(v);
          }}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onSelectProduct={handleSelectProduct}
            onExploreCatalog={handleExploreCatalog}
            onQuickView={handleQuickView}
            onBuyNow={(p) => handleBuyNow(p, 1)}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            initialCategory={catalogInitialCategory}
            initialQuery={catalogInitialQuery}
            onSelectProduct={handleSelectProduct}
            onQuickView={handleQuickView}
            onBuyNow={(p) => handleBuyNow(p, 1)}
          />
        )}

        {currentView === 'product-detail' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onBackToCatalog={() => setCurrentView('catalog')}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutView
            buyNowItem={buyNowItem}
            onOrderSuccess={(order: Order) => {
              setBuyNowItem(null);
            }}
            onContinueShopping={() => {
              setBuyNowItem(null);
              setCurrentView('catalog');
            }}
          />
        )}

        {currentView === 'account' && (
          <AccountView
            onSelectProduct={handleSelectProduct}
            onExploreCatalog={() => setCurrentView('catalog')}
            onGoToCheckout={() => setCurrentView('checkout')}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLoginView
            onLoginSuccess={() => setCurrentView('admin')}
            onBackToStore={() => setCurrentView('home')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardView onBackToStore={() => setCurrentView('home')} />
        )}
      </div>

      {/* Cart Drawer Overlay */}
      <CartDrawer
        onProceedToCheckout={() => {
          setBuyNowItem(null);
          setCurrentView('checkout');
        }}
        onExploreCatalog={() => setCurrentView('catalog')}
      />

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        onSelectProduct={handleSelectProduct}
        onViewAllResults={handleViewAllSearchResults}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onSelectProduct={handleSelectProduct}
        onBuyNow={handleBuyNow}
      />

      {/* Footer (Hidden when in Admin Console) */}
      {currentView !== 'admin' && (
        <Footer setCurrentView={setCurrentView} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
