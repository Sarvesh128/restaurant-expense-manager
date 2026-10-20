import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  RotateCcw, 
  Calendar, 
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Raw Materials',
  'Utilities',
  'Salaries',
  'Rent',
  'Packaging',
  'Maintenance',
  'Transportation',
  'Miscellaneous'
];

const PAYMENT_METHODS = [
  'All Payment Methods',
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CREDIT_CARD',
  'CHEQUE',
  'OTHER'
];

export default function ExpenseFilters({ 
  filters, 
  onFilterChange, 
  onResetFilters, 
  onOpenCreateModal 
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value, page: 1 });
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 mb-6">
      
      {/* Top Search & Primary Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, description, or invoice #..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
          />
          {filters.search && (
            <button
              onClick={() => handleInputChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Category Dropdown */}
        <div className="w-full sm:w-48">
          <select
            value={filters.category || 'All Categories'}
            onChange={(e) => handleInputChange('category', e.target.value === 'All Categories' ? '' : e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl glass-input text-sm text-slate-200 bg-slate-900 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border flex items-center justify-center space-x-2 transition-all ${
            showAdvanced
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Reset Filters Button */}
        <button
          onClick={onResetFilters}
          title="Reset All Filters"
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Action: Add New Expense */}
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Expense</span>
        </button>
      </div>

      {/* Advanced Filter Expansion Drawer */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
          
          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Payment Method
            </label>
            <select
              value={filters.paymentMethod || 'All Payment Methods'}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value === 'All Payment Methods' ? '' : e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 bg-slate-900"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm} className="bg-slate-900 text-slate-200">
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 bg-slate-900"
            />
          </div>

          {/* Date Range: End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 bg-slate-900"
            />
          </div>

          {/* Amount: Min & Max */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Amount Range (₹)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount || ''}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                className="w-1/2 px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount || ''}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                className="w-1/2 px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
