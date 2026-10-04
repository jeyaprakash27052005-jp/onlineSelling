import express from 'express';
import { db } from '../db.js';
import {
  signAdminToken,
  authenticateAdmin,
  AuthenticatedAdminRequest,
  ROLE_PERMISSIONS,
  AdminTokenPayload
} from '../auth.js';

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admin = db.getAdminByEmail(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (admin.status === 'suspended') {
    return res.status(403).json({ error: 'Your admin account has been suspended' });
  }

  const isPasswordValid = db.verifyAdminPassword(email, password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check 2FA requirement
  if (admin.twoFactorEnabled) {
    if (!otp) {
      return res.status(200).json({
        requires2FA: true,
        email: admin.email,
        message: 'Two-factor authentication code required (use 123456 for demo)'
      });
    }

    // Demo OTP validation: accepts 123456 or 654321
    if (otp !== '123456' && otp !== '654321') {
      return res.status(400).json({ error: 'Invalid two-factor authentication code' });
    }
  }

  // Update last login
  admin.lastLogin = new Date().toISOString();

  const token = signAdminToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role
  });

  db.logAudit(
    { id: admin.id, name: admin.name, role: admin.role },
    'ADMIN_LOGIN',
    'Auth',
    `Successful login via web console. 2FA: ${admin.twoFactorEnabled ? 'Verified' : 'Bypassed'}`,
    admin.id,
    admin.name,
    req.ip || '127.0.0.1'
  );

  return res.json({
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      twoFactorEnabled: admin.twoFactorEnabled
    },
    permissions: ROLE_PERMISSIONS[admin.role]
  });
});

// GET /api/admin/auth/me
router.get('/me', authenticateAdmin, (req: AuthenticatedAdminRequest, res) => {
  const admin = req.adminUser!;
  return res.json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      twoFactorEnabled: admin.twoFactorEnabled,
      lastLogin: admin.lastLogin
    },
    permissions: ROLE_PERMISSIONS[admin.role]
  });
});

// POST /api/admin/auth/toggle-2fa
router.post('/toggle-2fa', authenticateAdmin, (req: AuthenticatedAdminRequest, res) => {
  const admin = req.adminUser!;
  admin.twoFactorEnabled = !admin.twoFactorEnabled;

  db.logAudit(
    { id: admin.id, name: admin.name, role: admin.role },
    'TOGGLE_2FA',
    'Security',
    `Two-factor authentication ${admin.twoFactorEnabled ? 'enabled' : 'disabled'}.`,
    admin.id,
    admin.name,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    twoFactorEnabled: admin.twoFactorEnabled,
    message: `Two-factor authentication is now ${admin.twoFactorEnabled ? 'active' : 'disabled'}`
  });
});

// POST /api/admin/auth/switch-demo-role
// For testing & evaluating the 3 RBAC roles: Super Admin, Manager, Support
router.post('/switch-demo-role', (req, res) => {
  const { role } = req.body;
  const targetAdmin = db.adminUsers.find(a => a.role === role);

  if (!targetAdmin) {
    return res.status(404).json({ error: `Demo user for role ${role} not found` });
  }

  const token = signAdminToken({
    id: targetAdmin.id,
    email: targetAdmin.email,
    name: targetAdmin.name,
    role: targetAdmin.role
  });

  return res.json({
    token,
    admin: {
      id: targetAdmin.id,
      name: targetAdmin.name,
      email: targetAdmin.email,
      role: targetAdmin.role,
      avatar: targetAdmin.avatar,
      twoFactorEnabled: targetAdmin.twoFactorEnabled
    },
    permissions: ROLE_PERMISSIONS[targetAdmin.role]
  });
});

export default router;
