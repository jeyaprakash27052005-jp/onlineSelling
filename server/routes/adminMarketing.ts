import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';
import { Coupon, PromotionalBanner } from '../types.js';

const router = express.Router();

// GET /api/admin/marketing/coupons
router.get('/coupons', authenticateAdmin, requirePermission('marketing:manage'), (req, res) => {
  return res.json(db.coupons);
});

// POST /api/admin/marketing/coupons
router.post('/coupons', authenticateAdmin, requirePermission('marketing:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { code, type, value, minPurchaseAmount, maxDiscount, startDate, endDate, usageLimit } = req.body;

  if (!code || !value) {
    return res.status(400).json({ error: 'Coupon code and discount value are required' });
  }

  const existing = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'A coupon with this code already exists' });
  }

  const newCoupon: Coupon = {
    id: `coup-${Date.now()}`,
    code: code.toUpperCase().trim(),
    type: type || 'percentage',
    value: parseFloat(value),
    minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || '2026-12-31',
    usageLimit: parseInt(usageLimit, 10) || 500,
    usedCount: 0,
    isActive: true
  };

  db.coupons.unshift(newCoupon);

  db.logAudit(
    req.adminUser!,
    'CREATE_COUPON',
    'Marketing',
    `Created promotional voucher code "${newCoupon.code}" (${newCoupon.value}${newCoupon.type === 'percentage' ? '%' : '$'} OFF)`,
    newCoupon.id,
    newCoupon.code,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json(newCoupon);
});

// DELETE /api/admin/marketing/coupons/:id
router.delete('/coupons/:id', authenticateAdmin, requirePermission('marketing:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const index = db.coupons.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Coupon not found' });
  }

  const removed = db.coupons.splice(index, 1)[0];

  db.logAudit(
    req.adminUser!,
    'DELETE_COUPON',
    'Marketing',
    `Deleted coupon code "${removed.code}"`,
    removed.id,
    removed.code,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true });
});

// GET /api/admin/marketing/banners
router.get('/banners', authenticateAdmin, requirePermission('marketing:manage'), (req, res) => {
  return res.json(db.banners);
});

// POST /api/admin/marketing/banners
router.post('/banners', authenticateAdmin, requirePermission('marketing:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { title, subtitle, imageUrl, linkUrl, position } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Banner title and image URL are required' });
  }

  const newBanner: PromotionalBanner = {
    id: `ban-${Date.now()}`,
    title,
    subtitle: subtitle || '',
    imageUrl,
    linkUrl: linkUrl || '/',
    position: position || 'hero_main',
    isActive: true,
    displayOrder: db.banners.length + 1
  };

  db.banners.push(newBanner);

  db.logAudit(
    req.adminUser!,
    'CREATE_BANNER',
    'Marketing',
    `Published marketing banner "${newBanner.title}" in position ${newBanner.position}`,
    newBanner.id,
    newBanner.title,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json(newBanner);
});

// DELETE /api/admin/marketing/banners/:id
router.delete('/banners/:id', authenticateAdmin, requirePermission('marketing:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const index = db.banners.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Banner not found' });
  }

  const removed = db.banners.splice(index, 1)[0];

  db.logAudit(
    req.adminUser!,
    'DELETE_BANNER',
    'Marketing',
    `Removed banner "${removed.title}"`,
    removed.id,
    removed.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true });
});

// POST /api/admin/marketing/notifications/send - Send email or push broadcast
router.post('/notifications/send', authenticateAdmin, requirePermission('marketing:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { targetAudience, channel, title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Notification title and message are required' });
  }

  const recipientCount = targetAudience === 'sellers'
    ? db.sellers.length
    : targetAudience === 'customers'
    ? db.customers.length
    : db.sellers.length + db.customers.length;

  db.logAudit(
    req.adminUser!,
    'BROADCAST_NOTIFICATION',
    'Marketing',
    `Dispatched ${channel || 'email'} campaign "${title}" to ${recipientCount} ${targetAudience || 'all'} users.`,
    undefined,
    undefined,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    recipientsDispatched: recipientCount,
    message: `Campaign broadcast successfully delivered via ${channel || 'email'} to ${recipientCount} recipients.`
  });
});

export default router;
