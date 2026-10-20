import React from 'react';
import { 
  TrendingUp, 
  Receipt, 
  CheckCircle, 
  AlertTriangle, 
  IndianRupee,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';

export default function FinancialSummary({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const {
    totalAmount = 0,
    expenseCount = 0,
    avgAmount = 0,
    minAmount = 0,
    maxAmount = 0,
    statusBreakdown = {}
  } = summary || {};

  const reconciledCount = statusBreakdown.reconciled || 0;
  const unreconciledCount = statusBreakdown.unreconciled || 0;
  const totalRecon = reconciledCount + unreconciledCount;
  const reconPercentage = totalRecon > 0 ? Math.round((reconciledCount / totalRecon) * 100) : 0;
  const anomalyCount = statusBreakdown.anomalyFlagged || 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* 1. Total Expenses */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Restaurant Spend
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {formatCurrency(totalAmount)}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
            <span>{expenseCount} Total Records</span>
            <span className="text-emerald-400 font-medium">Deterministic Sum</span>
          </div>
        </div>
      </div>

      {/* 2. Average Transaction */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Transaction
          </span>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {formatCurrency(avgAmount)}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
            <span>Min: {formatCurrency(minAmount)}</span>
            <span>Max: {formatCurrency(maxAmount)}</span>
          </div>
        </div>
      </div>

      {/* 3. Reconciliation Status */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-teal-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Reconciliation Rate
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {reconPercentage}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              ({reconciledCount} Matched)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${reconPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[11px] text-slate-400">
            <span>{unreconciledCount} Pending Match</span>
            <span>Phase 12 Preview</span>
          </div>
        </div>
      </div>

      {/* 4. Anomaly & Duplicate Watch */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-amber-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            AI Anomaly Watch
          </span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            anomalyCount > 0 
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' 
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {anomalyCount}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              anomalyCount > 0 
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {anomalyCount > 0 ? 'Review Needed' : 'Normal Baseline'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 truncate">
            {anomalyCount > 0 
              ? 'Flagged unusual high values or repairs' 
              : 'Zero anomalous expenditures detected'}
          </p>
        </div>
      </div>

    </div>
  );
}
