import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardData, Product, Order } from '../../types';

interface DashboardViewProps {
  onNavigateModule: (module: any) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateModule }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly'>('weekly');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-400">Loading marketplace analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <span>{error || 'Unable to fetch dashboard.'}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentSales =
    timeframe === 'today'
      ? data.todaySales
      : timeframe === 'weekly'
      ? data.weeklySales
      : data.monthlySales;

  // Max value calculation for SVG trend graph
  const maxTrend = Math.max(...data.salesTrend.map((t) => t.sales), 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Timeframe Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Marketplace Overview</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time multi-vendor performance metrics, platform commissions, and inventory health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeframe === 'today' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeframe === 'weekly' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeframe === 'monthly' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh statistics"
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Low Stock Urgent Alert Banner */}
      {data.lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-200">
                Inventory Alert: {data.lowStockCount} listing{data.lowStockCount > 1 ? 's are' : ' is'} below minimum threshold
              </div>
              <div className="text-xs text-amber-400/80 mt-0.5">
                {data.lowStockAlerts.map((p) => `${p.title} (${p.stock} left)`).join(' · ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateModule('products')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-semibold text-xs hover:bg-amber-400 transition-colors shrink-0"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Gross Sales ({timeframe})</span>
            <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[11px] flex items-center gap-0.5">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            ${currentSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Total GMV across all verified sellers
          </div>
        </div>

        {/* Marketplace Commission Earned */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Commission Net Revenue</span>
            <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[11px] flex items-center gap-0.5">
              Take rate: ~10.4%
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-400 font-mono">
            ${data.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            MarketHub fee captured in escrow
          </div>
        </div>

        {/* Orders Processed */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {data.totalOrdersCount}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Fulfilled via FedEx, UPS & DHL
          </div>
        </div>

        {/* Platform Network */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Network Scale</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-white font-mono">{data.totalUsers}</span>
            <span className="text-xs text-neutral-400">Buyers</span>
            <span className="text-neutral-600">/</span>
            <span className="text-2xl font-bold text-white font-mono">{data.totalSellers}</span>
            <span className="text-xs text-neutral-400">Sellers</span>
          </div>
          <div className="mt-1 text-xs text-amber-400/90">
            {data.pendingSellers > 0 && `${data.pendingSellers} seller KYC awaiting approval`}
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Custom interactive SVG) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Daily Sales & Commission Trajectory</h3>
                <p className="text-xs text-neutral-400">7-day performance curve with daily order volumes</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> High Demand
              </span>
            </div>

            {/* SVG Visual Representation */}
            <div className="h-56 w-full pt-4">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="600" y2="160" stroke="#27272a" strokeDasharray="3 3" />

                {/* Shaded Area */}
                <path
                  d={`M 0 180 ${data.salesTrend
                    .map((item, idx) => {
                      const x = (idx / (data.salesTrend.length - 1)) * 600;
                      const y = 180 - (item.sales / maxTrend) * 150;
                      return `L ${x} ${y}`;
                    })
                    .join(' ')} L 600 180 Z`}
                  fill="url(#salesGradient)"
                  opacity="0.25"
                />

                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Line Path */}
                <path
                  d={`M ${data.salesTrend
                    .map((item, idx) => {
                      const x = (idx / (data.salesTrend.length - 1)) * 600;
                      const y = 180 - (item.sales / maxTrend) * 150;
                      return `${idx === 0 ? '' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}`}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Interactive Points */}
                {data.salesTrend.map((item, idx) => {
                  const x = (idx / (data.salesTrend.length - 1)) * 600;
                  const y = 180 - (item.sales / maxTrend) * 150;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="11"
                        fontFamily="monospace"
                        className="opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                      >
                        ${item.sales}
                      </text>
                      <text
                        x={x}
                        y="196"
                        textAnchor="middle"
                        fill="#71717a"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {item.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Period Average: <strong className="text-white">${Math.round(data.totalRevenue / 7)}/day</strong></span>
            <button
              onClick={() => onNavigateModule('payments')}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View detailed financial ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Revenue Breakdown */}
        <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Top Sales by Category</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Contribution to marketplace GMV</p>

            <div className="mt-5 space-y-4">
              {data.categoryBreakdown.map((cat, idx) => {
                const totalCatRev = data.categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0) || 1;
                const percentage = Math.round((cat.revenue / totalCatRev) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-300 font-medium">{cat.name}</span>
                      <span className="font-mono text-neutral-400 font-medium">
                        ${cat.revenue.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-neutral-800/80">
            <button
              onClick={() => onNavigateModule('categories')}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Manage Categories & Commission Rules →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Leaderboard */}
        <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Selling Products</h3>
              <p className="text-xs text-neutral-400">Ranked by volume & fulfillment velocity</p>
            </div>
            <button
              onClick={() => onNavigateModule('products')}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              All Listings
            </button>
          </div>

          <div className="divide-y divide-neutral-800">
            {data.topProducts.map((prod) => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prod.images[0]}
                    alt={prod.title}
                    className="w-10 h-10 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-200 truncate">{prod.title}</p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {prod.sellerName} · {prod.categoryName}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-semibold text-white">${prod.price.toFixed(2)}</div>
                  <div className="text-[11px] text-emerald-400 font-mono">{prod.salesCount} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Stream */}
        <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Customer Orders</h3>
              <p className="text-xs text-neutral-400">Real-time purchase stream from shared customer DB</p>
            </div>
            <button
              onClick={() => onNavigateModule('orders')}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              View All ({data.totalOrdersCount})
            </button>
          </div>

          <div className="divide-y divide-neutral-800">
            {data.recentOrders.map((ord) => {
              const statusColor =
                ord.status === 'delivered'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : ord.status === 'shipped'
                  ? 'text-sky-400 bg-sky-500/10'
                  : ord.status === 'processing'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-neutral-400 bg-neutral-800';

              return (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{ord.orderNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${statusColor}`}>
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {ord.customerName} · {ord.items.length} item{ord.items.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">${ord.total.toFixed(2)}</div>
                    <div className="text-[10px] text-neutral-500">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
