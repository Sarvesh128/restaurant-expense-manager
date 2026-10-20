import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const CATEGORIES = [
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
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CREDIT_CARD',
  'CHEQUE',
  'OTHER'
];

export default function ExpenseModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    description: '',
    vendor: '',
    amount: '',
    currency: 'INR',
    category: 'Raw Materials',
    paymentMethod: 'UPI',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description || '',
        vendor: initialData.vendor || '',
        amount: initialData.amount || '',
        currency: initialData.currency || 'INR',
        category: initialData.category || 'Raw Materials',
        paymentMethod: initialData.paymentMethod || 'UPI',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        invoiceNumber: initialData.invoiceNumber || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        description: '',
        vendor: '',
        amount: '',
        currency: 'INR',
        category: 'Raw Materials',
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!formData.vendor.trim()) {
      setError('Vendor is required.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        ...formData,
        amount: Number(formData.amount)
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {initialData ? 'Edit Expense Record' : 'Record New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Harvest Vegetables"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount (₹ INR) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bought 50kg fresh onions and potatoes"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white bg-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white bg-slate-900"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm} className="bg-slate-900 text-white">
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white bg-slate-900"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-042"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Notes
            </label>
            <textarea
              rows="2"
              placeholder="Additional remarks or warranty details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : (initialData ? 'Update Expense' : 'Create Expense')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
