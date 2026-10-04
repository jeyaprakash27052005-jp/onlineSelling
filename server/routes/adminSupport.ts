import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';

const router = express.Router();

// GET /api/admin/support/tickets
router.get('/tickets', authenticateAdmin, requirePermission('support:manage'), (req, res) => {
  const { status, priority, category } = req.query;

  let filtered = [...db.supportTickets];

  if (status && status !== 'all') {
    filtered = filtered.filter(t => t.status === status);
  }

  if (priority && priority !== 'all') {
    filtered = filtered.filter(t => t.priority === priority);
  }

  if (category && category !== 'all') {
    filtered = filtered.filter(t => t.category === category);
  }

  return res.json(filtered);
});

// GET /api/admin/support/tickets/:id
router.get('/tickets/:id', authenticateAdmin, requirePermission('support:manage'), (req, res) => {
  const ticket = db.supportTickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  return res.json(ticket);
});

// POST /api/admin/support/tickets/:id/reply
router.post('/tickets/:id/reply', authenticateAdmin, requirePermission('support:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { message, isInternalNote, newStatus } = req.body;
  const ticket = db.supportTickets.find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message body cannot be empty' });
  }

  const newMessage = {
    id: `m-${Date.now()}`,
    sender: 'agent' as const,
    senderName: `${req.adminUser!.name} (${req.adminUser!.role})`,
    message,
    timestamp: new Date().toISOString(),
    isInternalNote: Boolean(isInternalNote)
  };

  ticket.messages.push(newMessage);
  if (newStatus) {
    ticket.status = newStatus;
  }
  ticket.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'REPLY_TICKET',
    'Support',
    `Sent ${isInternalNote ? 'internal note' : 'reply'} to ticket #${ticket.ticketNumber} (${ticket.subject})`,
    ticket.id,
    ticket.ticketNumber,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, ticket });
});

// POST /api/admin/support/tickets/:id/status
router.post('/tickets/:id/status', authenticateAdmin, requirePermission('support:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { status, priority } = req.body;
  const ticket = db.supportTickets.find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  ticket.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'UPDATE_TICKET',
    'Support',
    `Updated ticket #${ticket.ticketNumber} to Status: ${ticket.status}, Priority: ${ticket.priority}`,
    ticket.id,
    ticket.ticketNumber,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, ticket });
});

export default router;
