import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requireRole, requirePermission, AuthenticatedAdminRequest } from '../auth.js';
import { AdminUser, AdminRole } from '../types.js';

const router = express.Router();

// GET /api/admin/settings
router.get('/', authenticateAdmin, (req, res) => {
  return res.json(db.settings);
});

// PUT /api/admin/settings
router.put('/', authenticateAdmin, requireRole(['SUPER_ADMIN']), (req: AuthenticatedAdminRequest, res) => {
  db.settings = {
    ...db.settings,
    ...req.body
  };

  db.logAudit(
    req.adminUser!,
    'UPDATE_SETTINGS',
    'Settings',
    'Updated marketplace configuration (taxes, shipping, site identity, or payment gateways).',
    undefined,
    undefined,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, settings: db.settings });
});

// GET /api/admin/settings/admins - List admin users
router.get('/admins', authenticateAdmin, requireRole(['SUPER_ADMIN']), (req, res) => {
  return res.json(db.adminUsers);
});

// POST /api/admin/settings/admins - Add new admin user
router.post('/admins', authenticateAdmin, requireRole(['SUPER_ADMIN']), (req: AuthenticatedAdminRequest, res) => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: 'Name, email, role, and password are required' });
  }

  const existing = db.getAdminByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An admin with this email already exists' });
  }

  const newAdmin: AdminUser = {
    id: `adm-${Date.now()}`,
    name,
    email: email.toLowerCase().trim(),
    role: role as AdminRole,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  db.adminUsers.push(newAdmin);
  db.adminPasswords[newAdmin.email] = password;

  db.logAudit(
    req.adminUser!,
    'CREATE_ADMIN',
    'Security',
    `Created new staff account "${newAdmin.name}" with role ${newAdmin.role}`,
    newAdmin.id,
    newAdmin.name,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json(newAdmin);
});

// PUT /api/admin/settings/admins/:id/role
router.put('/admins/:id/role', authenticateAdmin, requireRole(['SUPER_ADMIN']), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  const admin = db.adminUsers.find(a => a.id === id);

  if (!admin) {
    return res.status(404).json({ error: 'Admin user not found' });
  }

  if (role) admin.role = role;
  if (status) admin.status = status;

  db.logAudit(
    req.adminUser!,
    'UPDATE_ADMIN_ROLE',
    'Security',
    `Updated staff "${admin.name}" to Role: ${admin.role}, Status: ${admin.status}`,
    admin.id,
    admin.name,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, admin });
});

// GET /api/admin/settings/audit-logs
router.get('/audit-logs', authenticateAdmin, requirePermission('settings:audit'), (req, res) => {
  const { search, module, page = '1', limit = '20' } = req.query;

  let filtered = [...db.auditLogs];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(l =>
      l.adminName.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s) ||
      l.details.toLowerCase().includes(s)
    );
  }

  if (module && module !== 'all') {
    filtered = filtered.filter(l => l.module === module);
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const total = filtered.length;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    logs: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

export default router;
