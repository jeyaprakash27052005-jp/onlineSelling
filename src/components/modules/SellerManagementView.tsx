import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  Star,
  AlertTriangle,
  FileText,
  Search,
  ArrowUpRight,
  CreditCard,
  Building,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { Seller, PayoutRequest } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const SellerManagementView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sellers' | 'payouts'>('sellers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [modalAction, setModalAction] = useState<{
    type: 'approve' | 'reject' | 'commission' | 'pay_payout' | null;
    seller?: Seller;
    payout?: PayoutRequest;
  }>({ type: null });

  const [commissionRateInput, setCommissionRateInput] = useState('10.0');
  const [payoutTxRef, setPayoutTxRef] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sellersRes, payoutsRes] = await Promise.all([
        api.getSellers({ search: searchTerm, status: selectedStatus }),
        api.getPayoutRequests(),
      ]);
      setSellers(sellersRes);
      setPayouts(payoutsRes);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch sellers data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedStatus]);

  const handleApproveSeller = async (seller: Seller) => {
    try {
      await api.approveSeller(seller.id);
      setFeedback({ type: 'success', message: `Merchant account "${seller.storeName}" has been approved!` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRejectSellerConfirm = async (reason?: string) => {
    if (!modalAction.seller) return;
    try {
      await api.rejectSeller(modalAction.seller.id, reason || 'Compliance failure');
      setFeedback({ type: 'success', message: `Seller application rejected with audit record.` });
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSetCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction.seller) return;
    try {
      await api.setSellerCommission(modalAction.seller.id, parseFloat(commissionRateInput));
      setFeedback({
        type: 'success',
        message: `Commission rate for "${modalAction.seller.storeName}" set to ${commissionRateInput}%`,
      });
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleMarkPayoutPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction.payout) return;
    try {
      await api.markPayoutPaid(modalAction.payout.id, payoutTxRef || undefined);
      setFeedback({
        type: 'success',
        message: `Payout of $${modalAction.payout.amount.toFixed(2)} marked as PAID. Balance deducted.`,
      });
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Seller Management & Payouts</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review merchant onboarding applications, monitor seller fulfillment rating, and disburse escrow payouts.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'sellers' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sellers ({sellers.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'payouts' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Payout Requests ({payouts.filter((p) => p.status === 'pending').length} pending)
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-neutral-200">
            ✕
          </button>
        </div>
      )}

      {activeTab === 'sellers' ? (
        <>
          {/* Filter Bar */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search store name, owner, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Application</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Sellers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-neutral-400">
                Loading marketplace vendors...
              </div>
            ) : sellers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-neutral-500">
                No sellers found.
              </div>
            ) : (
              sellers.map((s) => (
                <div
                  key={s.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatar}
                          alt={s.storeName}
                          className="w-11 h-11 rounded-lg object-cover border border-neutral-700 shrink-0"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight">{s.storeName}</h3>
                          <div className="text-xs text-neutral-400">{s.ownerName}</div>
                        </div>
                      </div>

                      {s.status === 'approved' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-semibold">
                          Approved
                        </span>
                      ) : s.status === 'pending' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-semibold">
                          Pending KYC
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono uppercase font-semibold">
                          Rejected
                        </span>
                      )}
                    </div>

                    {/* Performance metrics grid */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                        <div className="text-[9px] uppercase font-semibold text-neutral-500 font-sans">
                          GMV Sales
                        </div>
                        <div className="font-bold text-white mt-0.5">
                          ${(s.totalSales / 1000).toFixed(1)}k
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                        <div className="text-[9px] uppercase font-semibold text-neutral-500 font-sans">
                          Rating
                        </div>
                        <div className="font-bold text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{s.rating > 0 ? s.rating.toFixed(1) : 'New'}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                        <div className="text-[9px] uppercase font-semibold text-neutral-500 font-sans">
                          Take Fee
                        </div>
                        <div className="font-bold text-indigo-400 mt-0.5">{s.commissionRate}%</div>
                      </div>
                    </div>

                    {/* Balance & Bank info */}
                    <div className="mt-3 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Available Balance:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          ${s.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Bank Account:</span>
                        <span className="font-mono">{s.bankDetails.bankName}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Reg Number:</span>
                        <span className="font-mono">{s.businessRegNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                    {s.status === 'pending' && hasPermission('sellers:approve') ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => handleApproveSeller(s)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve KYC</span>
                        </button>
                        <button
                          onClick={() => setModalAction({ type: 'reject', seller: s })}
                          className="py-1.5 px-3 bg-neutral-800 hover:bg-rose-500/20 text-rose-400 border border-neutral-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setCommissionRateInput(String(s.commissionRate));
                            setModalAction({ type: 'commission', seller: s });
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Edit Commission</span>
                        </button>
                        <span className="text-[11px] text-neutral-500">
                          {s.ordersFulfilled} fulfilled
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Payout Requests Tab */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Seller Store</th>
                <th className="py-3 px-4">Requested Payout</th>
                <th className="py-3 px-4">Disbursement Bank</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-850/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{p.sellerName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                    ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-neutral-300 font-mono text-[11px]">
                    {p.bankDetailsSummary}
                  </td>
                  <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                    {new Date(p.requestedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'paid' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-semibold">
                        Paid ({p.transactionRef})
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-semibold">
                        Pending Release
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.status === 'pending' && hasPermission('sellers:payout') ? (
                      <button
                        onClick={() => {
                          setPayoutTxRef(`WIRE-DISB-${Date.now().toString().slice(-6)}`);
                          setModalAction({ type: 'pay_payout', payout: p });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Authorize & Mark Paid
                      </button>
                    ) : (
                      <span className="text-neutral-500 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Seller Modal */}
      <ConfirmationModal
        isOpen={modalAction.type === 'reject'}
        title="Reject Seller Merchant Application"
        message={`Are you sure you want to reject the merchant application from "${modalAction.seller?.storeName}"?`}
        confirmLabel="Reject Application"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Provide rejection reason (e.g. Invalid business registration, failed identity verification)..."
        onConfirm={handleRejectSellerConfirm}
        onClose={() => setModalAction({ type: null })}
      />

      {/* Commission Modal */}
      {modalAction.type === 'commission' && modalAction.seller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white">Adjust Seller Commission</h3>
            <p className="text-xs text-neutral-400 mt-1">{modalAction.seller.storeName}</p>

            <form onSubmit={handleSetCommission} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAction({ type: null })}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Payout Modal */}
      {modalAction.type === 'pay_payout' && modalAction.payout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white">Disburse Seller Earnings</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Disbursing <strong>${modalAction.payout.amount.toFixed(2)}</strong> to {modalAction.payout.sellerName}
            </p>

            <form onSubmit={handleMarkPayoutPaid} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Bank Reference ID / Wire Confirmation
                </label>
                <input
                  type="text"
                  required
                  value={payoutTxRef}
                  onChange={(e) => setPayoutTxRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAction({ type: null })}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Confirm Payout Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
