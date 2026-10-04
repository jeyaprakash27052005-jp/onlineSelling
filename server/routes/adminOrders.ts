import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';
import { Order, OrderStatus, PaymentStatus } from '../types.js';

const router = express.Router();

// GET /api/admin/orders - List with status, date, payment filter, search
router.get('/', authenticateAdmin, requirePermission('orders:view'), (req, res) => {
  const { search, status, paymentMethod, paymentStatus, startDate, endDate, page = '1', limit = '10' } = req.query;

  let filtered = [...db.orders];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(o =>
      o.orderNumber.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerEmail.toLowerCase().includes(s) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(s))
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(o => o.status === status);
  }

  if (paymentMethod && paymentMethod !== 'all') {
    filtered = filtered.filter(o => o.paymentMethod === paymentMethod);
  }

  if (paymentStatus && paymentStatus !== 'all') {
    filtered = filtered.filter(o => o.paymentStatus === paymentStatus);
  }

  if (startDate) {
    filtered = filtered.filter(o => o.createdAt >= String(startDate));
  }

  if (endDate) {
    filtered = filtered.filter(o => o.createdAt <= String(endDate));
  }

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = filtered.length;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    orders: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// GET /api/admin/orders/:id - Single order details
router.get('/:id', authenticateAdmin, requirePermission('orders:view'), (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  return res.json(order);
});

// POST /api/admin/orders/:id/status - Update order status
router.post('/:id/status', authenticateAdmin, requirePermission('orders:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const previousStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'UPDATE_ORDER_STATUS',
    'Orders',
    `Updated status for ${order.orderNumber} from ${previousStatus.toUpperCase()} to ${status.toUpperCase()}`,
    order.id,
    order.orderNumber,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, order });
});

// POST /api/admin/orders/:id/assign-delivery - Assign courier and tracking
router.post('/:id/assign-delivery', authenticateAdmin, requirePermission('orders:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { courier, trackingNumber } = req.body;
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.courier = courier;
  order.trackingNumber = trackingNumber;
  if (order.status === 'processing' || order.status === 'pending') {
    order.status = 'shipped';
  }
  order.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'ASSIGN_DELIVERY',
    'Orders',
    `Assigned courier "${courier}" (Tracking: ${trackingNumber}) to ${order.orderNumber}`,
    order.id,
    order.orderNumber,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, order });
});

// POST /api/admin/orders/:id/refund - Process refund
router.post('/:id/refund', authenticateAdmin, requirePermission('orders:refund'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const refundAmt = parseFloat(amount) || order.total;
  order.paymentStatus = refundAmt >= order.total ? 'refunded' : 'partially_refunded';
  order.refundAmount = refundAmt;
  order.refundReason = reason || 'Customer requested return / refund';
  order.status = 'returned';
  order.updatedAt = new Date().toISOString();

  // Create refund transaction
  const refundTx = {
    id: `tx-ref-${Date.now()}`,
    orderId: order.id,
    sellerId: order.items[0]?.sellerId,
    sellerName: order.items[0]?.sellerName,
    type: 'refund' as const,
    amount: refundAmt,
    status: 'completed' as const,
    paymentGateway: (order.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe') as any,
    referenceId: `REF-${Date.now().toString().slice(-6)}`,
    description: `Refund for ${order.orderNumber}: ${reason || 'Approved refund'}`,
    createdAt: new Date().toISOString()
  };
  db.transactions.unshift(refundTx);

  db.logAudit(
    req.adminUser!,
    'PROCESS_REFUND',
    'Orders',
    `Processed refund of $${refundAmt.toFixed(2)} for ${order.orderNumber}. Reason: ${order.refundReason}`,
    order.id,
    order.orderNumber,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, order, refundTransaction: refundTx });
});

// POST /api/admin/orders/:id/cancel - Process cancellation
router.post('/:id/cancel', authenticateAdmin, requirePermission('orders:cancel'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = 'cancelled';
  order.cancellationReason = reason || 'Cancelled by admin administrator';
  order.updatedAt = new Date().toISOString();

  // Restock products
  for (const item of order.items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock += item.quantity;
    }
  }

  db.logAudit(
    req.adminUser!,
    'CANCEL_ORDER',
    'Orders',
    `Cancelled order ${order.orderNumber} and restored inventory. Reason: ${order.cancellationReason}`,
    order.id,
    order.orderNumber,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, order });
});

export default router;
