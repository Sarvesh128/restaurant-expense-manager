import React from 'react';
import { 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  Tag
} from 'lucide-react';

const CATEGORY_COLORS = {
  'Raw Materials': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Utilities': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Salaries': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Rent': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Packaging': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Maintenance': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Transportation': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Miscellaneous': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

export default function ExpenseTable({ 
  expenses = [], 
  loading, 
  pagination, 
  onPageChange, 
  onEditExpense, 
  onDeleteExpense 
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center animate-pulse">
        <div className="space-y-4">
          <div className="h-10 bg-slate-800/60 rounded-xl" />
          <div className="h-12 bg-slate-800/40 rounded-xl" />
          <div className="h-12 bg-slate-800/40 rounded-xl" />
          <div className="h-12 bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 border border-slate-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <Receipt className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No Expenses Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          No records match your active query filters. Try adjusting the search term or clearing date/category filters.
        </p>
      </div>
    );
  }

  const { page = 1, totalPages = 1, totalCount = 0, limit = 10 } = pagination || {};

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden mb-8">
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Vendor & Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-sm">
            {expenses.map((exp) => {
              const catClass = CATEGORY_COLORS[exp.category] || 'bg-slate-800 text-slate-300 border-slate-700';
              const isFlagged = exp.anomalyStatus === 'ANOMALY_FLAGGED';
              const isMatched = exp.reconciliationStatus === 'MATCHED';

              return (
                <tr 
                  key={exp._id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Vendor & Description */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100 flex items-center space-x-2">
                      <span>{exp.vendor}</span>
                      {exp.invoiceNumber && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {exp.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                      {exp.description}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${catClass}`}>
                      {exp.category}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-300 text-xs font-mono">
                    {formatDate(exp.date)}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-base">
                    {formatCurrency(exp.amount)}
                  </td>

                  {/* Payment Method */}
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {exp.paymentMethod || 'OTHER'}
                    </span>
                  </td>

                  {/* Status Flags */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center space-x-1.5">
                      {isMatched ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Reconciliation Matched">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700" title="Pending Reconciliation">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}

                      {isFlagged && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Anomaly Detected">
                          <AlertCircle className="w-3 h-3 mr-0.5" />
                          Flagged
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onEditExpense(exp)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Edit Expense"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(exp._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{expenses.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalCount}</span> expenses
          {totalPages > 1 && (
            <span> (Page {page} of {totalPages})</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 font-mono font-bold">
            {page} / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
