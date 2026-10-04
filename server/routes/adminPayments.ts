import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';

const router = express.Router();

// GET /api/admin/payments/transactions
router.get('/transactions', authenticateAdmin, requirePermission('payments:view'), (req, res) => {
  const { type, status, search } = req.query;

  let filtered = [...db.transactions];

  if (type && type !== 'all') {
    filtered = filtered.filter(t => t.type === type);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(t => t.status === status);
  }

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(t =>
      t.referenceId.toLowerCase().includes(s) ||
      (t.sellerName && t.sellerName.toLowerCase().includes(s)) ||
      t.description.toLowerCase().includes(s)
    );
  }

  return res.json(filtered);
});

// GET /api/admin/payments/commission-report
router.get('/commission-report', authenticateAdmin, requirePermission('payments:view'), (req, res) => {
  const totalCommission = db.orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.commissionTotal, 0);

  const totalGMV = db.orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  // Seller commission breakdown
  const sellerBreakdown: Record<string, { sellerName: string; gmv: number; commission: number; orderCount: number }> = {};
  for (const ord of db.orders) {
    if (ord.paymentStatus !== 'paid') continue;
    for (const item of ord.items) {
      const seller = db.sellers.find(s => s.id === item.sellerId);
      const sName = seller?.storeName || item.sellerName || 'Unknown Seller';
      if (!sellerBreakdown[sName]) {
        sellerBreakdown[sName] = { sellerName: sName, gmv: 0, commission: 0, orderCount: 0 };
      }
      const itemTotal = item.price * item.quantity;
      const rate = (seller?.commissionRate || 10) / 100;
      sellerBreakdown[sName].gmv += itemTotal;
      sellerBreakdown[sName].commission += itemTotal * rate;
      sellerBreakdown[sName].orderCount += 1;
    }
  }

  return res.json({
    totalCommission,
    totalGMV,
    effectiveTakeRate: totalGMV > 0 ? ((totalCommission / totalGMV) * 100).toFixed(2) : '10.00',
    sellers: Object.values(sellerBreakdown)
  });
});

export default router;
