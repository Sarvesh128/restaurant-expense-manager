import React, { useState } from 'react';
import { X, Lock, Mail, User, Store, Sparkles, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, onRegisterSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await onLoginSuccess('chef@bistro.com', 'password123');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await onRegisterSuccess({
          name,
          email,
          password,
          restaurantName,
          role: 'ADMIN'
        });
      } else {
        await onLoginSuccess(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRegister ? 'Register Restaurant Account' : 'Restaurant Portal Access'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister 
              ? 'Multi-tenant registration with tenant-isolated database' 
              : 'Sign in to access Phase 4 Expense Management'}
          </p>
        </div>

        {/* 1-Click Demo Login Box */}
        {!isRegister && (
          <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Demo Access</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Chef Marco &middot; The Golden Bistro (50+ Expenses)
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow transition-all active:scale-95"
              >
                Sign In Demo
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gordon Ramsay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Restaurant Business Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Dine Bistro"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="chef@bistro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-md shadow-emerald-500/20 transition-all font-sans active:scale-95"
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Register & Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new restaurant instance?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Register
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
