import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  RotateCcw,
  XCircle,
  Printer,
  Download,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PackageCheck,
  QrCode
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/exportCsv';
import { useAuth } from '../../context/AuthContext';

export const OrderManagementView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [modalAction, setModalAction] = useState<{
    type: 'status' | 'delivery' | 'refund' | 'cancel' | 'invoice' | 'shipping_label' | null;
    order?: Order;
  }>({ type: null });

  // Delivery input
  const [courierName, setCourierName] = useState('FedEx Express');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Refund input
  const [refundAmount, setRefundAmount] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.getOrders({
        search: searchTerm,
        status: selectedStatus,
        paymentMethod: selectedPayment,
        page,
        limit: 8,
      });
      setOrders(res.orders);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch orders' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [searchTerm, selectedStatus, selectedPayment, page]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setFeedback({ type: 'success', message: `Order status changed to ${newStatus.toUpperCase()}` });
      loadOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction.order) return;
    try {
      await api.assignDelivery(modalAction.order.id, courierName, trackingNumber);
      setFeedback({ type: 'success', message: `Assigned ${courierName} tracking ${trackingNumber}` });
      setModalAction({ type: null });
      loadOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRefundConfirm = async (reason?: string) => {
    if (!modalAction.order) return;
    try {
      const amt = parseFloat(refundAmount) || modalAction.order.total;
      await api.refundOrder(modalAction.order.id, amt, reason || 'Customer requested return');
      setFeedback({ type: 'success', message: `Refund of $${amt.toFixed(2)} processed successfully.` });
      setModalAction({ type: null });
      loadOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!modalAction.order) return;
    try {
      await api.cancelOrder(modalAction.order.id, reason || 'Admin cancelled order');
      setFeedback({ type: 'success', message: `Order cancelled and inventory replenished.` });
      setModalAction({ type: null });
      loadOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleExportCsv = () => {
    const rows = orders.map((o) => ({
      OrderNumber: o.orderNumber,
      Customer: o.customerName,
      CustomerEmail: o.customerEmail,
      Status: o.status,
      PaymentStatus: o.paymentStatus,
      PaymentMethod: o.paymentMethod,
      ItemsCount: o.items.length,
      Subtotal: o.subtotal,
      Tax: o.tax,
      Total: o.total,
      CommissionEarned: o.commissionTotal,
      Courier: o.courier || '',
      Tracking: o.trackingNumber || '',
      Date: o.createdAt,
    }));
    exportToCsv('markethub_orders', rows);
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Order Management</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Dispatch items, generate official invoices, assign courier tracking and issue refunds.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
          <span>Export Orders CSV</span>
        </button>
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

      {/* Filter Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer, or tracking..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned / Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="credit_card">Credit Card (Stripe)</option>
            <option value="paypal">PayPal</option>
            <option value="bank_transfer">Wire Transfer</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>

        <div className="text-xs text-neutral-400">
          Total: <strong className="text-white">{totalCount}</strong> orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Order Number & Customer</th>
                <th className="py-3 px-4">Purchased Items</th>
                <th className="py-3 px-4">Total & Fee</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4">Courier / Tracking</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const statusColors: Record<OrderStatus, string> = {
                    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    processing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    shipped: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    cancelled: 'bg-neutral-800 text-neutral-400 border-neutral-700',
                    returned: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  };

                  return (
                    <tr key={ord.id} className="hover:bg-neutral-850/50 transition-colors">
                      {/* Order number & Customer */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white text-sm">{ord.orderNumber}</div>
                        <div className="text-neutral-300 font-medium mt-0.5">{ord.customerName}</div>
                        <div className="text-[11px] text-neutral-500">{ord.customerEmail}</div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-6 h-6 rounded object-cover border border-neutral-800 shrink-0"
                              />
                              <span className="truncate max-w-[180px] text-neutral-300">
                                {item.quantity}x {item.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white text-sm">${ord.total.toFixed(2)}</div>
                        <div className="text-[11px] text-indigo-400 font-medium">
                          Comm: +${ord.commissionTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase mt-0.5">
                          {ord.paymentMethod.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {hasPermission('orders:manage') ? (
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase border ${statusColors[ord.status]} bg-neutral-950 focus:outline-none`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="returned">Returned</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase border ${statusColors[ord.status]}`}
                          >
                            {ord.status}
                          </span>
                        )}
                      </td>

                      {/* Courier & Tracking */}
                      <td className="py-3 px-4">
                        {ord.trackingNumber ? (
                          <div>
                            <div className="font-medium text-neutral-300 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{ord.courier}</span>
                            </div>
                            <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                              {ord.trackingNumber}
                            </div>
                          </div>
                        ) : (
                          <div className="text-neutral-500 italic">No courier assigned</div>
                        )}

                        {hasPermission('orders:manage') && (
                          <button
                            onClick={() => {
                              setCourierName(ord.courier || 'FedEx Express');
                              setTrackingNumber(ord.trackingNumber || `FX-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
                              setModalAction({ type: 'delivery', order: ord });
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline mt-1 block"
                          >
                            {ord.trackingNumber ? 'Edit tracking' : '+ Assign delivery'}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Invoice */}
                          <button
                            onClick={() => setModalAction({ type: 'invoice', order: ord })}
                            title="Generate Formal Invoice"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Print Shipping Label */}
                          <button
                            onClick={() => setModalAction({ type: 'shipping_label', order: ord })}
                            title="Generate Shipping Dispatch Label"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Refund */}
                          {hasPermission('orders:refund') && ord.paymentStatus === 'paid' && (
                            <button
                              onClick={() => {
                                setRefundAmount(String(ord.total));
                                setModalAction({ type: 'refund', order: ord });
                              }}
                              title="Process Refund"
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel */}
                          {hasPermission('orders:cancel') && ord.status !== 'cancelled' && ord.status !== 'delivered' && (
                            <button
                              onClick={() => setModalAction({ type: 'cancel', order: ord })}
                              title="Cancel Order"
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/40">
          <div>
            Page {page} of {Math.max(1, totalPages)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assign Delivery Modal */}
      {modalAction.type === 'delivery' && modalAction.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white">Assign Dispatch Courier</h3>
            <p className="text-xs text-neutral-400 mt-1">Order #{modalAction.order.orderNumber}</p>

            <form onSubmit={handleAssignDelivery} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Carrier / Courier</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FedEx Express Priority">FedEx Express Priority</option>
                  <option value="UPS Ground">UPS Ground</option>
                  <option value="DHL Express Worldwide">DHL Express Worldwide</option>
                  <option value="USPS Priority Mail">USPS Priority Mail</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Tracking Number</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. FX-99812901US"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAction({ type: null })}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Dispatch Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalAction.type === 'refund'}
        title="Authorize Order Refund"
        message={`Authorize refund of $${refundAmount || modalAction.order?.total.toFixed(2)} to customer ${modalAction.order?.customerName}. This transaction will be logged in the financial audit ledger.`}
        confirmLabel="Authorize Refund"
        variant="warning"
        requireReason={true}
        reasonPlaceholder="Specify reason (e.g. Return received, defective goods, buyer remorse)..."
        onConfirm={handleRefundConfirm}
        onClose={() => setModalAction({ type: null })}
      />

      {/* Cancel Order Modal */}
      <ConfirmationModal
        isOpen={modalAction.type === 'cancel'}
        title="Cancel Customer Order"
        message={`Are you sure you want to cancel ${modalAction.order?.orderNumber}? This will restore listing inventory and flag the order as cancelled.`}
        confirmLabel="Confirm Cancellation"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Cancellation reason (e.g. Out of stock, buyer request, fraud risk)..."
        onConfirm={handleCancelConfirm}
        onClose={() => setModalAction({ type: null })}
      />

      {/* Printable Invoice Modal */}
      {modalAction.type === 'invoice' && modalAction.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-neutral-900 rounded-xl p-8 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
              <div>
                <div className="text-xl font-bold tracking-tight text-neutral-900">MARKETHUB GLOBAL</div>
                <div className="text-xs text-neutral-500">Official Marketplace Sales Receipt & Tax Invoice</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-bold text-neutral-900">{modalAction.order.orderNumber}</div>
                <div className="text-xs text-neutral-500">
                  {new Date(modalAction.order.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Recipient info */}
            <div className="grid grid-cols-2 gap-6 my-6 text-xs">
              <div>
                <div className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px]">
                  Billed & Shipped To:
                </div>
                <div className="font-bold text-neutral-900 mt-1">{modalAction.order.customerName}</div>
                <div className="text-neutral-600">{modalAction.order.shippingAddress.street}</div>
                <div className="text-neutral-600">
                  {modalAction.order.shippingAddress.city}, {modalAction.order.shippingAddress.state} {modalAction.order.shippingAddress.zip}
                </div>
                <div className="text-neutral-600">{modalAction.order.shippingAddress.country}</div>
              </div>

              <div>
                <div className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px]">
                  Payment & Delivery:
                </div>
                <div className="text-neutral-800 mt-1">
                  <strong>Payment Method:</strong> {modalAction.order.paymentMethod.toUpperCase()}
                </div>
                <div className="text-neutral-800">
                  <strong>Payment Ref:</strong> {modalAction.order.paymentTransactionId}
                </div>
                <div className="text-neutral-800">
                  <strong>Carrier:</strong> {modalAction.order.courier || 'Standard Logistics'}
                </div>
                <div className="text-neutral-800">
                  <strong>Tracking:</strong> {modalAction.order.trackingNumber || 'Pending'}
                </div>
              </div>
            </div>

            {/* Table of items */}
            <table className="w-full text-xs text-left border-collapse my-6">
              <thead>
                <tr className="border-b-2 border-neutral-300 text-neutral-600 uppercase text-[10px]">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">Vendor</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {modalAction.order.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium text-neutral-900">{it.title}</td>
                    <td className="py-2 text-neutral-600">{it.sellerName}</td>
                    <td className="py-2 text-right font-mono">${it.price.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono">{it.quantity}</td>
                    <td className="py-2 text-right font-mono font-bold">${(it.price * it.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end text-xs font-mono space-y-1">
              <div className="w-64 space-y-1.5 pt-2 border-t border-neutral-200">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span>${modalAction.order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax (8.5%):</span>
                  <span>${modalAction.order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping:</span>
                  <span>${modalAction.order.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-900">
                  <span>Total Paid:</span>
                  <span>${modalAction.order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Print / Close controls */}
            <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between print:hidden">
              <span className="text-[11px] text-neutral-500">MarketHub Platform Invoice Generator</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalAction({ type: null })}
                  className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
                <button
                  onClick={printDocument}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Shipping Label Modal */}
      {modalAction.type === 'shipping_label' && modalAction.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white text-neutral-900 rounded-xl p-6 shadow-2xl relative font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <span className="font-extrabold text-xl tracking-tighter">PRIORITY EXPEDITE</span>
                <div className="text-[10px] text-neutral-600 uppercase font-mono">
                  Carrier: {modalAction.order.courier || 'FedEx Express'}
                </div>
              </div>
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-lg rounded">
                P
              </div>
            </div>

            {/* Sender / Receiver */}
            <div className="my-4 text-xs space-y-3">
              <div className="border-b border-neutral-300 pb-2">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  FROM (ORIGIN HUB):
                </span>
                <span className="font-bold text-neutral-800">
                  {modalAction.order.items[0]?.sellerName || 'MarketHub Fulfillment Center'}
                </span>
                <div className="text-neutral-600 text-[11px]">800 Industrial Parkway, Dock #4</div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  DELIVER TO:
                </span>
                <span className="font-extrabold text-sm text-neutral-900 block">
                  {modalAction.order.customerName}
                </span>
                <div className="text-neutral-700 text-xs font-medium">
                  {modalAction.order.shippingAddress.street}
                </div>
                <div className="text-neutral-700 text-xs font-bold uppercase mt-0.5">
                  {modalAction.order.shippingAddress.city}, {modalAction.order.shippingAddress.state} {modalAction.order.shippingAddress.zip}
                </div>
                <div className="text-neutral-600 text-[11px] font-semibold">
                  {modalAction.order.shippingAddress.country}
                </div>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="my-4 pt-3 border-t-2 border-black flex flex-col items-center">
              <div className="h-14 w-full flex items-center justify-center gap-1 bg-neutral-100 p-2 rounded">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{
                      width: `${(i % 3) + 1.5}px`,
                      marginRight: `${(i % 2) * 1.5}px`,
                    }}
                  />
                ))}
              </div>
              <div className="font-mono text-xs font-bold tracking-widest mt-1">
                {modalAction.order.trackingNumber || `TRACK-${modalAction.order.orderNumber}`}
              </div>
            </div>

            {/* Footer controls */}
            <div className="mt-6 pt-3 border-t border-neutral-200 flex items-center justify-between print:hidden">
              <span className="text-[10px] text-neutral-500">4x6 Thermal Label Ready</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalAction({ type: null })}
                  className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
                <button
                  onClick={printDocument}
                  className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Label</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
