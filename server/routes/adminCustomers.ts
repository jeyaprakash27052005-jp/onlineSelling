import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';

const router = express.Router();

// GET /api/admin/customers
router.get('/', authenticateAdmin, requirePermission('customers:view'), (req, res) => {
  const { search, status } = req.query;

  let filtered = [...db.customers];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.phone.includes(s)
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(c => c.status === status);
  }

  return res.json(filtered);
});

// GET /api/admin/customers/:id
router.get('/:id', authenticateAdmin, requirePermission('customers:view'), (req, res) => {
  const customer = db.customers.find(c => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const customerOrders = db.orders.filter(o => o.customerId === customer.id);
  return res.json({
    customer,
    orders: customerOrders
  });
});

// POST /api/admin/customers/:id/toggle-block
router.post('/:id/toggle-block', authenticateAdmin, requirePermission('customers:block'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const customer = db.customers.find(c => c.id === id);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const wasBlocked = customer.status === 'blocked';
  customer.status = wasBlocked ? 'active' : 'blocked';
  if (!wasBlocked) {
    customer.blockedReason = reason || 'Suspicious or non-compliant account activity';
  } else {
    delete customer.blockedReason;
  }

  db.logAudit(
    req.adminUser!,
    wasBlocked ? 'UNBLOCK_CUSTOMER' : 'BLOCK_CUSTOMER',
    'Customers',
    `${wasBlocked ? 'Unblocked' : 'Blocked'} customer account for "${customer.name}". ${!wasBlocked ? 'Reason: ' + customer.blockedReason : ''}`,
    customer.id,
    customer.name,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, customer });
});

// POST /api/admin/customers/:id/reset-password
router.post('/:id/reset-password', authenticateAdmin, requirePermission('customers:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const customer = db.customers.find(c => c.id === id);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const tempPassword = `Pass#${Math.floor(100000 + Math.random() * 900000)}`;

  db.logAudit(
    req.adminUser!,
    'RESET_CUSTOMER_PASSWORD',
    'Customers',
    `Triggered administrative password reset for ${customer.name} (${customer.email})`,
    customer.id,
    customer.name,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    message: `Password reset email dispatched to ${customer.email}`,
    temporaryPassword: tempPassword
  });
});

export default router;
