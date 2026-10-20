import React from 'react';
import { 
  UtensilsCrossed, 
  Activity, 
  Database, 
  ShieldCheck, 
  User, 
  LogOut, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  user, 
  onLogout, 
  onOpenAuth, 
  healthStatus, 
  activeTab, 
  setActiveTab 
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <UtensilsCrossed className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Restaurant Expense AI
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 4 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Deterministic Financial Reconciliation & AI Engine
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Expense Dashboard
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Implementation Roadmap
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              System Architecture
            </button>
          </nav>

          {/* Right Section: System Health & Auth Profile */}
          <div className="flex items-center space-x-3">
            {/* Live Health Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-400">API:</span>
              <span className="text-slate-200 font-mono font-medium">
                {healthStatus?.status === 'ok' ? 'Online' : 'Connecting...'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">DB:</span>
              <span className="text-emerald-400 font-medium truncate max-w-[120px]">
                {healthStatus?.database || 'Ready'}
              </span>
            </div>

            {/* User Profile or Login Trigger */}
            {user ? (
              <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 rounded-xl p-1.5 pl-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    {user.restaurant?.name || (typeof user.restaurantId === 'object' ? user.restaurantId?.name : null) || 'Golden Bistro'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Demo</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
