import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';

const router = express.Router();

// GET /api/admin/reviews - All reviews with filter
router.get('/', authenticateAdmin, requirePermission('reviews:moderate'), (req, res) => {
  const { status, rating } = req.query;

  let filtered = [...db.reviews];

  if (status && status !== 'all') {
    filtered = filtered.filter(r => r.status === status);
  }

  if (rating && rating !== 'all') {
    filtered = filtered.filter(r => r.rating === parseInt(rating as string, 10));
  }

  return res.json(filtered);
});

// POST /api/admin/reviews/:id/status - Moderate status (approved, flagged, hidden)
router.post('/:id/status', authenticateAdmin, requirePermission('reviews:moderate'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const review = db.reviews.find(r => r.id === id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const prev = review.status;
  review.status = status;

  db.logAudit(
    req.adminUser!,
    'MODERATE_REVIEW',
    'Reviews',
    `Changed review status for "${review.productTitle}" from ${prev} to ${status}`,
    review.id,
    review.productTitle,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, review });
});

// POST /api/admin/reviews/:id/reply - Official admin reply
router.post('/:id/reply', authenticateAdmin, requirePermission('reviews:moderate'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  const review = db.reviews.find(r => r.id === id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.adminReply = reply;

  db.logAudit(
    req.adminUser!,
    'REPLY_REVIEW',
    'Reviews',
    `Posted official marketplace response to review on "${review.productTitle}"`,
    review.id,
    review.productTitle,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, review });
});

// --- Disputes & Reports ---

// GET /api/admin/reviews/disputes/all
router.get('/disputes/all', authenticateAdmin, requirePermission('disputes:resolve'), (req, res) => {
  return res.json(db.disputes);
});

// POST /api/admin/reviews/disputes/:id/resolve
router.post('/disputes/:id/resolve', authenticateAdmin, requirePermission('disputes:resolve'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { status, resolutionNote } = req.body;
  const dispute = db.disputes.find(d => d.id === id);

  if (!dispute) {
    return res.status(404).json({ error: 'Dispute report not found' });
  }

  dispute.status = status || 'resolved';
  dispute.resolutionNote = resolutionNote || 'Resolved by administrative decision';

  db.logAudit(
    req.adminUser!,
    'RESOLVE_DISPUTE',
    'Disputes',
    `Updated dispute on "${dispute.targetTitle}" to ${dispute.status}. Resolution: ${dispute.resolutionNote}`,
    dispute.id,
    dispute.targetTitle,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, dispute });
});

export default router;
