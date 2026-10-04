import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AdminRole, AdminUser } from './types.js';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'markethub-admin-super-secure-jwt-key-2026';

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is2FAVerified: boolean;
  iat: number;
  exp: number;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminTokenPayload;
  adminUser?: AdminUser;
}

// Simple base64url encode/decode
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function signAdminToken(admin: { id: string; email: string; name: string; role: AdminRole }, is2FAVerified = true): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    is2FAVerified,
    iat: now,
    exp: now + 60 * 60 * 24, // 24 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (expectedSig !== signature) return null;

    const decodedPayload: AdminTokenPayload = JSON.parse(base64UrlDecode(payload));
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      return null;
    }
    return decodedPayload;
  } catch (err) {
    return null;
  }
}

// Role Hierarchy and Matrix
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: [
    'dashboard:view',
    'products:view', 'products:manage', 'products:delete', 'products:approve',
    'categories:manage',
    'orders:view', 'orders:manage', 'orders:refund', 'orders:cancel',
    'customers:view', 'customers:manage', 'customers:block',
    'sellers:view', 'sellers:manage', 'sellers:approve', 'sellers:payout',
    'payments:view', 'payments:refund', 'payments:export',
    'marketing:manage',
    'reviews:moderate', 'disputes:resolve',
    'support:manage',
    'settings:general', 'settings:finance', 'settings:admins', 'settings:audit'
  ],
  MANAGER: [
    'dashboard:view',
    'products:view', 'products:manage', 'products:approve',
    'categories:manage',
    'orders:view', 'orders:manage',
    'customers:view',
    'sellers:view', 'sellers:manage',
    'payments:view',
    'marketing:manage',
    'reviews:moderate', 'disputes:resolve',
    'support:manage',
    'settings:general'
  ],
  SUPPORT: [
    'dashboard:view',
    'products:view',
    'orders:view', 'orders:manage',
    'customers:view',
    'sellers:view',
    'reviews:moderate', 'disputes:resolve',
    'support:manage'
  ]
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// Express Middleware: Authenticate Admin
export function authenticateAdmin(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  const adminUser = db.getAdminById(payload.id);
  if (!adminUser || adminUser.status === 'suspended') {
    return res.status(403).json({ error: 'Admin account not found or suspended' });
  }

  req.admin = payload;
  req.adminUser = adminUser;
  next();
}

// Express Middleware: Require specific roles
export function requireRole(allowedRoles: AdminRole[]) {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Current role is ${req.admin.role}.`
      });
    }

    next();
  };
}

// Express Middleware: Require specific permission
export function requirePermission(permission: string) {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!hasPermission(req.admin.role, permission)) {
      return res.status(403).json({
        error: `Access denied. Role ${req.admin.role} lacks permission: ${permission}`
      });
    }

    next();
  };
}
