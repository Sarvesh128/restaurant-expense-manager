import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Layers } from 'lucide-react';

const CATEGORY_COLORS = {
  'Raw Materials': '#10b981',   // Emerald
  'Utilities': '#06b6d4',       // Cyan
  'Salaries': '#8b5cf6',        // Violet
  'Rent': '#f59e0b',            // Amber
  'Packaging': '#ec4899',       // Pink
  'Maintenance': '#f97316',     // Orange
  'Transportation': '#3b82f6',  // Blue
  'Miscellaneous': '#64748b'    // Slate
};

export default function CategoryCharts({ categoryBreakdown = [], totalAmount = 0 }) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return null;
  }

  const chartData = categoryBreakdown.map((item) => ({
    name: item.category,
    amount: item.totalAmount,
    count: item.count,
    percentage: totalAmount > 0 ? Math.round((item.totalAmount / totalAmount) * 100) : 0,
    color: CATEGORY_COLORS[item.category] || '#10b981'
  }));

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <div className="text-xs font-semibold text-slate-300">{data.name}</div>
          <div className="text-sm font-bold text-white font-mono mt-1">
            {formatCurrency(data.amount)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {data.count} items ({data.percentage}% of spend)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Bar Chart: Spending by Category */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Deterministic Category Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400">Values in INR</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Visual Ranked Distribution List */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Budget Distribution %
            </h3>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {chartData.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span>{cat.name}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-200 font-semibold">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.max(cat.percentage, 3)}%`,
                      backgroundColor: cat.color 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{chartData.length} Unique Categories</span>
          <span className="text-emerald-400 font-medium font-mono">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

    </div>
  );
}
