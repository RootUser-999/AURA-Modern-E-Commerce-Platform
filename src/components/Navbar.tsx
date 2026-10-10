import React, { useState } from 'react';
import { ShoppingBag, Search, User as UserIcon, Shield, X, Heart, Menu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenQuickSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, onOpenQuickSearch }) => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div className="bg-[#111827] text-white text-xs py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2">
        <span>Complimentary expedited shipping on international studio orders over $150</span>
        <span className="text-stone-400">·</span>
        <span className="text-amber-300 font-mono">CODE: WELCOME10</span>
      </div>

      {/* Main Navigation: 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#E5E5DF] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
          
          {/* Zone 1: Wordmark Brand Title (1 element, single line) */}
          <button
            onClick={() => {
              setCurrentView('home');
              setMobileMenuOpen(false);
            }}
            className="group flex items-center gap-2 text-left cursor-pointer focus:outline-none"
          >
            <span className="font-extrabold text-2xl tracking-tighter text-[#111827] group-hover:text-indigo-600 transition-colors">
              AURA<span className="text-indigo-600">.</span>
            </span>
          </button>

          {/* Zone 2: Navigation Links (single-line, clean hover states) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4B5563]">
            <button
              onClick={() => setCurrentView('catalog')}
              className={`hover:text-[#111827] transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'catalog' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-audio' }));
              }}
              className="hover:text-[#111827] transition-colors whitespace-nowrap cursor-pointer"
            >
              Acoustics
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-workspace' }));
              }}
              className="hover:text-[#111827] transition-colors whitespace-nowrap cursor-pointer"
            >
              Studio Gear
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-timepieces' }));
              }}
              className="hover:text-[#111827] transition-colors whitespace-nowrap cursor-pointer"
            >
              Horology
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-carry' }));
              }}
              className="hover:text-[#111827] transition-colors whitespace-nowrap cursor-pointer"
            >
              Carry & Living
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Search Trigger */}
            <button
              onClick={onOpenQuickSearch}
              className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#EFEFEA] rounded-lg transition-colors cursor-pointer"
              title="Search products (SKU, name, category)"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account / User */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!user) {
                    setCurrentView('account');
                  } else {
                    setUserDropdownOpen(!userDropdownOpen);
                  }
                }}
                className={`flex items-center gap-2 p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#EFEFEA] rounded-lg transition-colors cursor-pointer ${
                  currentView === 'account' ? 'text-indigo-600 bg-[#EFEFEA]' : ''
                }`}
                title={user ? `${user.fullName} (${user.role})` : 'Account Login'}
              >
                <UserIcon className="w-5 h-5" />
                {user && (
                  <span className="hidden xl:inline text-xs font-semibold max-w-[100px] truncate text-[#111827]">
                    {user.fullName.split(' ')[0]}
                  </span>
                )}
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && user && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs font-semibold text-stone-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[11px] font-mono uppercase font-semibold text-indigo-600">
                      Role: {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView('account');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    My Orders & History
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setCurrentView('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin Dashboard
                    </button>
                  )}
                  <div className="border-t border-stone-100 my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      setCurrentView('home');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#111827] hover:bg-[#EFEFEA] rounded-lg transition-colors cursor-pointer group"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#111827] group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-mono text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Quick Admin Suite Switcher Button */}
            <button
              onClick={() => {
                if (currentView === 'admin') {
                  setCurrentView('home');
                } else {
                  setCurrentView(isAdmin ? 'admin' : 'admin-login');
                }
              }}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentView === 'admin'
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  : 'bg-[#111827] text-white hover:bg-[#1E293B] shadow-sm'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {currentView === 'admin' ? 'Storefront View' : 'Admin Console'}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E5DF] bg-white px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setCurrentView('catalog');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-[#111827]"
            >
              All Products
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-audio' }));
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-[#4B5563]"
            >
              Tech & Studio Audio
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-workspace' }));
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-[#4B5563]"
            >
              Studio & Desk Gear
            </button>
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.dispatchEvent(new CustomEvent('filter-category', { detail: 'cat-timepieces' }));
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-[#4B5563]"
            >
              Precision Horology
            </button>
            <button
              onClick={() => {
                setCurrentView('account');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-[#4B5563]"
            >
              My Account & Orders
            </button>
            <button
              onClick={() => {
                setCurrentView(isAdmin ? 'admin' : 'admin-login');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-center py-2.5 text-xs font-bold text-white bg-[#111827] rounded-lg mt-2"
            >
              Admin Dashboard
            </button>
          </div>
        )}
      </header>
    </>
  );
};
