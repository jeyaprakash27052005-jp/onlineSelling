import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';
import { Seller } from '../types.js';

const router = express.Router();

// GET /api/admin/sellers - List sellers
router.get('/', authenticateAdmin, requirePermission('sellers:view'), (req, res) => {
  const { status, search } = req.query;

  let filtered = [...db.sellers];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(seller =>
      seller.storeName.toLowerCase().includes(s) ||
      seller.ownerName.toLowerCase().includes(s) ||
      seller.email.toLowerCase().includes(s)
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(s => s.status === status);
  }

  return res.json(filtered);
});

// GET /api/admin/sellers/:id - Details + products + orders
router.get('/:id', authenticateAdmin, requirePermission('sellers:view'), (req, res) => {
  const seller = db.sellers.find(s => s.id === req.params.id);
  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  const products = db.products.filter(p => p.sellerId === seller.id);
  const sellerPayouts = db.payoutRequests.filter(p => p.sellerId === seller.id);

  return res.json({
    seller,
    products,
    payouts: sellerPayouts
  });
});

// POST /api/admin/sellers/:id/approve - Approve seller application
router.post('/:id/approve', authenticateAdmin, requirePermission('sellers:approve'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const seller = db.sellers.find(s => s.id === id);

  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  seller.status = 'approved';
  delete seller.rejectionReason;

  db.logAudit(
    req.adminUser!,
    'APPROVE_SELLER',
    'Sellers',
    `Approved seller merchant account "${seller.storeName}" (${seller.ownerName})`,
    seller.id,
    seller.storeName,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, seller });
});

// POST /api/admin/sellers/:id/reject - Reject seller application
router.post('/:id/reject', authenticateAdmin, requirePermission('sellers:approve'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const seller = db.sellers.find(s => s.id === id);

  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  seller.status = 'rejected';
  seller.rejectionReason = reason || 'KYC documentation failed compliance review';

  db.logAudit(
    req.adminUser!,
    'REJECT_SELLER',
    'Sellers',
    `Rejected seller application for "${seller.storeName}". Reason: ${seller.rejectionReason}`,
    seller.id,
    seller.storeName,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, seller });
});

// POST /api/admin/sellers/:id/commission - Set commission percentage
router.post('/:id/commission', authenticateAdmin, requirePermission('sellers:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { rate } = req.body;
  const seller = db.sellers.find(s => s.id === id);

  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  const oldRate = seller.commissionRate;
  seller.commissionRate = parseFloat(rate) || 10.0;

  db.logAudit(
    req.adminUser!,
    'SET_SELLER_COMMISSION',
    'Sellers',
    `Adjusted commission rate for "${seller.storeName}" from ${oldRate}% to ${seller.commissionRate}%`,
    seller.id,
    seller.storeName,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, seller });
});

// GET /api/admin/sellers/payouts/all - All payout requests
router.get('/payouts/all', authenticateAdmin, requirePermission('sellers:view'), (req, res) => {
  return res.json(db.payoutRequests);
});

// POST /api/admin/sellers/payouts/:id/mark-paid - Mark payout as paid
router.post('/payouts/:id/mark-paid', authenticateAdmin, requirePermission('sellers:payout'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { transactionRef } = req.body;
  const payout = db.payoutRequests.find(p => p.id === id);

  if (!payout) {
    return res.status(404).json({ error: 'Payout request not found' });
  }

  payout.status = 'paid';
  payout.processedDate = new Date().toISOString();
  payout.transactionRef = transactionRef || `WIRE-DISB-${Date.now().toString().slice(-6)}`;

  // Deduct from seller balance
  const seller = db.sellers.find(s => s.id === payout.sellerId);
  if (seller) {
    seller.balance = Math.max(0, seller.balance - payout.amount);
  }

  // Create transaction record
  db.transactions.unshift({
    id: `tx-po-${Date.now()}`,
    sellerId: payout.sellerId,
    sellerName: payout.sellerName,
    type: 'payout',
    amount: payout.amount,
    status: 'completed',
    paymentGateway: 'Bank Wire',
    referenceId: payout.transactionRef || `WIRE-DISB-${Date.now().toString().slice(-6)}`,
    description: `Disbursed payout to ${payout.sellerName}`,
    createdAt: new Date().toISOString()
  });

  db.logAudit(
    req.adminUser!,
    'DISBURSE_PAYOUT',
    'Sellers',
    `Approved and marked payout $${payout.amount.toFixed(2)} as PAID to ${payout.sellerName} (Ref: ${payout.transactionRef})`,
    payout.id,
    payout.sellerName,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, payout });
});

export default router;
