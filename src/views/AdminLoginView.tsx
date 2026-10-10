import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const { adminLogin } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('root');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (username !== 'admin') {
        throw new Error('Invalid administrator username.');
      }
      await adminLogin(password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoCreds = () => {
    setUsername('admin');
    setPassword('root');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Security Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Studio Admin Gateway
          </h1>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Authorized administrative staff only. Governs product inventory, orders, analytics, and coupons.
          </p>
        </div>

        {/* Local Demo Credentials Banner (Prompt requirement Section 3) */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Key className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Local Development Credentials:</span>
          </div>
          <div className="font-mono text-xs bg-amber-100/60 p-2.5 rounded-lg border border-amber-200 flex justify-between items-center">
            <div>
              <span>User: <strong>admin</strong></span>
              <span className="mx-2">·</span>
              <span>Pass: <strong>root</strong></span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCreds}
              className="text-[11px] font-sans font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline"
            >
              Autofill
            </button>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <strong>Security Notice:</strong> Default development credentials must be rotated before deploying to a production cluster.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
              Administrator Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-500 uppercase font-semibold mb-1">
              Secret Passphrase
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Enter Admin Console'}</span>
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-stone-500 hover:text-stone-900 text-xs cursor-pointer underline"
            >
              &larr; Return to Customer Storefront
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
