import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Key,
  ExternalLink,
  ShoppingBag,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Clock,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { CustomerUser, Order } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const CustomerManagementView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Detail drawer / modal
  const [selectedCustomer, setSelectedCustomer] = useState<{
    customer: CustomerUser;
    orders: Order[];
  } | null>(null);

  // Block modal
  const [blockModalTarget, setBlockModalTarget] = useState<CustomerUser | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCustomers({
        search: searchTerm,
        status: selectedStatus,
      });
      setCustomers(res);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load customers' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, selectedStatus]);

  const handleOpenDetails = async (customer: CustomerUser) => {
    try {
      const res = await api.getCustomerDetails(customer.id);
      setSelectedCustomer(res);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleBlock = async (reason?: string) => {
    if (!blockModalTarget) return;
    try {
      const res = await api.toggleBlockCustomer(blockModalTarget.id, reason);
      const wasBlocked = blockModalTarget.status === 'blocked';
      setFeedback({
        type: 'success',
        message: wasBlocked
          ? `Customer ${blockModalTarget.name} has been unblocked.`
          : `Customer ${blockModalTarget.name} has been blocked from placing orders.`,
      });
      setBlockModalTarget(null);
      loadCustomers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleResetPassword = async (customer: CustomerUser) => {
    try {
      const res = await api.resetCustomerPassword(customer.id);
      setFeedback({
        type: 'success',
        message: `${res.message} (Temporary key: ${res.temporaryPassword})`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Accounts</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Browse buyer profiles, review order histories, enforce security blocks and assist with password resets.
          </p>
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

      {/* Filter / Search Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          Total Buyers: <strong className="text-white">{customers.length}</strong>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              <th className="py-3 px-4">Buyer Identity</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Lifetime Orders & Spend</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4">Member Since</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">
                  Loading buyers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-850/50 transition-colors">
                  {/* Identity */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-9 h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">ID: {c.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="text-neutral-300 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <span>{c.email}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-500" />
                      <span>{c.phone}</span>
                    </div>
                  </td>

                  {/* Spend */}
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-white text-sm">
                      ${c.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-neutral-400">{c.totalOrders} completed orders</div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {c.status === 'active' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-semibold">
                        Active
                      </span>
                    ) : (
                      <span
                        title={c.blockedReason}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono uppercase font-semibold cursor-help"
                      >
                        Blocked
                      </span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                    {new Date(c.joinedDate).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDetails(c)}
                        title="View Full Profile & Order History"
                        className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
                      >
                        Profile
                      </button>

                      {hasPermission('customers:block') && (
                        <button
                          onClick={() => setBlockModalTarget(c)}
                          title={c.status === 'blocked' ? 'Unblock customer' : 'Block customer'}
                          className={`p-1.5 rounded-md transition-colors ${
                            c.status === 'blocked'
                              ? 'text-emerald-400 hover:bg-emerald-500/20'
                              : 'text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                        >
                          {c.status === 'blocked' ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <ShieldAlert className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {hasPermission('customers:manage') && (
                        <button
                          onClick={() => handleResetPassword(c)}
                          title="Generate Password Reset"
                          className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Block/Unblock Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(blockModalTarget)}
        title={blockModalTarget?.status === 'blocked' ? 'Unblock Customer Account' : 'Block Customer Account'}
        message={
          blockModalTarget?.status === 'blocked'
            ? `Restore purchasing privileges for ${blockModalTarget?.name}?`
            : `Are you sure you want to block ${blockModalTarget?.name}? They will be prohibited from checkout and saving shipping addresses.`
        }
        confirmLabel={blockModalTarget?.status === 'blocked' ? 'Unblock Account' : 'Confirm Block'}
        variant={blockModalTarget?.status === 'blocked' ? 'primary' : 'danger'}
        requireReason={blockModalTarget?.status !== 'blocked'}
        reasonPlaceholder="Specify compliance or fraud reason..."
        onConfirm={handleToggleBlock}
        onClose={() => setBlockModalTarget(null)}
      />

      {/* Customer Profile & History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCustomer.customer.avatar}
                  alt={selectedCustomer.customer.name}
                  className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCustomer.customer.name}</h3>
                  <p className="text-xs text-neutral-400">{selectedCustomer.customer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Total Spent</div>
                <div className="mt-1 text-base font-bold font-mono text-emerald-400">
                  ${selectedCustomer.customer.totalSpent.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Orders Placed</div>
                <div className="mt-1 text-base font-bold font-mono text-white">
                  {selectedCustomer.customer.totalOrders}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[10px] uppercase font-semibold text-neutral-400">Account Status</div>
                <div className="mt-1 text-xs font-bold font-mono uppercase text-indigo-400">
                  {selectedCustomer.customer.status}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mb-4 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
              <div className="font-semibold text-neutral-400 text-[10px] uppercase mb-1">
                Default Delivery Address
              </div>
              <div className="text-neutral-200">
                {selectedCustomer.customer.shippingAddress.street}, {selectedCustomer.customer.shippingAddress.city},{' '}
                {selectedCustomer.customer.shippingAddress.state} {selectedCustomer.customer.shippingAddress.zip},{' '}
                {selectedCustomer.customer.shippingAddress.country}
              </div>
            </div>

            {/* Order History */}
            <div className="flex-1 overflow-y-auto">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Order History ({selectedCustomer.orders.length})
              </h4>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">No orders on record.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-white">{ord.orderNumber}</div>
                        <div className="text-[11px] text-neutral-400">
                          {new Date(ord.createdAt).toLocaleDateString()} · {ord.items.length} items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">${ord.total.toFixed(2)}</div>
                        <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
