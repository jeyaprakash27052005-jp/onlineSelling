import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Search,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { api } from '../../services/api';
import { Transaction } from '../../types';
import { exportToCsv } from '../../utils/exportCsv';

export const PaymentsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissionReport, setCommissionReport] = useState<{
    totalCommission: number;
    totalGMV: number;
    effectiveTakeRate: string;
    sellers: { sellerName: string; gmv: number; commission: number; orderCount: number }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'commission'>('transactions');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [txRes, commRes] = await Promise.all([
        api.getTransactions({ type: typeFilter, search }),
        api.getCommissionReport(),
      ]);
      setTransactions(txRes);
      setCommissionReport(commRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, search]);

  const handleExportTransactions = () => {
    const rows = transactions.map((t) => ({
      TransactionID: t.id,
      Reference: t.referenceId,
      Type: t.type.toUpperCase(),
      Amount: t.amount,
      Status: t.status.toUpperCase(),
      Gateway: t.paymentGateway,
      Seller: t.sellerName || 'N/A',
      Description: t.description,
      Date: t.createdAt,
    }));
    exportToCsv('markethub_transactions_ledger', rows);
  };

  const handleExportCommissions = () => {
    if (!commissionReport) return;
    const rows = commissionReport.sellers.map((s) => ({
      Seller: s.sellerName,
      GrossVolume: s.gmv,
      OrdersCount: s.orderCount,
      CommissionRetained: s.commission,
      AverageTakeRate: `${((s.commission / (s.gmv || 1)) * 100).toFixed(1)}%`,
    }));
    exportToCsv('markethub_commission_report', rows);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payments & Financial Ledger</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Reconcile payment transactions, review marketplace commissions, and export tax summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'transactions' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Transaction Ledger
            </button>
            <button
              onClick={() => setActiveTab('commission')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'commission' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Commission Reports
            </button>
          </div>

          <button
            onClick={activeTab === 'transactions' ? handleExportTransactions : handleExportCommissions}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      {commissionReport && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-xs font-medium text-neutral-400">Total Marketplace GMV</div>
            <div className="mt-2 text-2xl font-bold text-white font-mono">
              ${commissionReport.totalGMV.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Gross buyer payment volume</div>
          </div>

          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-xs font-medium text-neutral-400">Platform Commission Earned</div>
            <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono">
              ${commissionReport.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Retained platform net revenue</div>
          </div>

          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-xs font-medium text-neutral-400">Effective Take Rate</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
              {commissionReport.effectiveTakeRate}%
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Average margin across categories</div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' ? (
        <>
          {/* Filter Bar */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reference # or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="sale">Customer Sales</option>
                <option value="payout">Seller Payouts</option>
                <option value="refund">Refunds</option>
                <option value="commission_fee">Platform Fees</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Reference & Gateway</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Beneficiary / Order</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      Loading financial ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      No transactions recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = tx.type === 'sale' || tx.type === 'commission_fee';

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white text-xs">{tx.referenceId}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">{tx.paymentGateway}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] uppercase text-neutral-300 font-medium">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-neutral-300">{tx.description}</div>
                          {tx.sellerName && (
                            <div className="text-[11px] text-neutral-500">Seller: {tx.sellerName}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-semibold">
                            {tx.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right text-neutral-400 font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Commission Reports Tab */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Seller Store</th>
                <th className="py-3 px-4">Orders Count</th>
                <th className="py-3 px-4">Gross Sales Volume</th>
                <th className="py-3 px-4">Commission Retained</th>
                <th className="py-3 px-4 text-right">Effective Take Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {commissionReport?.sellers.map((s, idx) => (
                <tr key={idx} className="hover:bg-neutral-850/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{s.sellerName}</td>
                  <td className="py-3 px-4 text-neutral-300 font-mono">{s.orderCount} orders</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ${s.gmv.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                    +${s.commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                    {((s.commission / (s.gmv || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
