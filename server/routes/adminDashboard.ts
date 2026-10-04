import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';

const router = express.Router();

// GET /api/admin/dashboard
router.get('/', authenticateAdmin, requirePermission('dashboard:view'), (req: AuthenticatedAdminRequest, res) => {
  const stats = db.getDashboardStats();
  return res.json(stats);
});

export default router;
