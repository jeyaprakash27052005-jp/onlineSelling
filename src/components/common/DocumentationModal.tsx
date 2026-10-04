import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Shield,
  Layers,
  FileCode,
  Terminal,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { ROLE_PERMISSIONS } from '../../../server/auth';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'endpoints' | 'structure' | 'setup'>('matrix');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const endpointList = [
    { method: 'POST', path: '/api/admin/auth/login', role: 'PUBLIC ADMIN', desc: 'Authenticate admin credentials with 2FA requirement evaluation' },
    { method: 'GET', path: '/api/admin/auth/me', role: 'AUTHENTICATED', desc: 'Current admin session & permissions list' },
    { method: 'POST', path: '/api/admin/auth/toggle-2fa', role: 'AUTHENTICATED', desc: 'Enable or disable 2-Factor Authentication' },
    { method: 'POST', path: '/api/admin/auth/switch-demo-role', role: 'PUBLIC ADMIN', desc: 'RBAC role evaluation switcher' },

    { method: 'GET', path: '/api/admin/dashboard', role: 'ALL ROLES', desc: 'Sales GMV, commissions, orders count, low-stock alerts, 7-day trend' },

    { method: 'GET', path: '/api/admin/products', role: 'ALL ROLES', desc: 'List marketplace listings with filters & pagination' },
    { method: 'POST', path: '/api/admin/products', role: 'SUPER_ADMIN, MANAGER', desc: 'Create listing directly' },
    { method: 'PUT', path: '/api/admin/products/:id', role: 'SUPER_ADMIN, MANAGER', desc: 'Edit listing details, pricing or metadata' },
    { method: 'POST', path: '/api/admin/products/:id/approve', role: 'SUPER_ADMIN, MANAGER', desc: 'Approve vendor submission for public storefront' },
    { method: 'POST', path: '/api/admin/products/:id/reject', role: 'SUPER_ADMIN, MANAGER', desc: 'Reject submission with mandatory compliance audit note' },
    { method: 'POST', path: '/api/admin/products/:id/toggle-featured', role: 'SUPER_ADMIN, MANAGER', desc: 'Toggle homepage featured spotlight' },
    { method: 'POST', path: '/api/admin/products/:id/toggle-hide', role: 'SUPER_ADMIN, MANAGER', desc: 'Hide/Unhide listing from storefront' },
    { method: 'POST', path: '/api/admin/products/:id/stock', role: 'SUPER_ADMIN, MANAGER', desc: 'Quick adjust available warehouse/vendor inventory' },
    { method: 'DELETE', path: '/api/admin/products/:id', role: 'SUPER_ADMIN ONLY', desc: 'Permanently remove listing from database' },
    { method: 'POST', path: '/api/admin/products/bulk-upload', role: 'SUPER_ADMIN, MANAGER', desc: 'Parse and batch insert products from CSV data' },

    { method: 'GET', path: '/api/admin/products/categories/all', role: 'AUTHENTICATED', desc: 'List categories and subcategories' },
    { method: 'POST', path: '/api/admin/products/categories', role: 'SUPER_ADMIN, MANAGER', desc: 'Create marketplace department & commission rate' },
    { method: 'PUT', path: '/api/admin/products/categories/:id', role: 'SUPER_ADMIN, MANAGER', desc: 'Update category commission or image' },
    { method: 'DELETE', path: '/api/admin/products/categories/:id', role: 'SUPER_ADMIN, MANAGER', desc: 'Delete category' },

    { method: 'GET', path: '/api/admin/orders', role: 'ALL ROLES', desc: 'Search and filter orders by status, date, and payment method' },
    { method: 'POST', path: '/api/admin/orders/:id/status', role: 'SUPER_ADMIN, MANAGER', desc: 'Advance fulfillment status' },
    { method: 'POST', path: '/api/admin/orders/:id/assign-delivery', role: 'SUPER_ADMIN, MANAGER', desc: 'Assign courier (FedEx, UPS, DHL) and tracking code' },
    { method: 'POST', path: '/api/admin/orders/:id/refund', role: 'SUPER_ADMIN ONLY', desc: 'Authorize partial or full refund with audit trail' },
    { method: 'POST', path: '/api/admin/orders/:id/cancel', role: 'SUPER_ADMIN ONLY', desc: 'Cancel order and restock inventory' },

    { method: 'GET', path: '/api/admin/customers', role: 'ALL ROLES', desc: 'List buyer profiles and order spend metrics' },
    { method: 'POST', path: '/api/admin/customers/:id/toggle-block', role: 'SUPER_ADMIN ONLY', desc: 'Enforce fraud or compliance account block' },
    { method: 'POST', path: '/api/admin/customers/:id/reset-password', role: 'SUPER_ADMIN, MANAGER', desc: 'Trigger buyer password reset workflow' },

    { method: 'GET', path: '/api/admin/sellers', role: 'ALL ROLES', desc: 'List merchant vendor accounts & KYC applications' },
    { method: 'POST', path: '/api/admin/sellers/:id/approve', role: 'SUPER_ADMIN ONLY', desc: 'Approve vendor merchant application' },
    { method: 'POST', path: '/api/admin/sellers/:id/reject', role: 'SUPER_ADMIN ONLY', desc: 'Reject merchant onboarding with reason' },
    { method: 'POST', path: '/api/admin/sellers/:id/commission', role: 'SUPER_ADMIN, MANAGER', desc: 'Configure custom commission rate % per seller' },
    { method: 'GET', path: '/api/admin/sellers/payouts/all', role: 'ALL ROLES', desc: 'List vendor disbursement requests' },
    { method: 'POST', path: '/api/admin/sellers/payouts/:id/mark-paid', role: 'SUPER_ADMIN ONLY', desc: 'Authorize and mark wire disbursement as paid' },

    { method: 'GET', path: '/api/admin/payments/transactions', role: 'ALL ROLES', desc: 'Reconcile transaction ledger (sales, payouts, refunds)' },
    { method: 'GET', path: '/api/admin/payments/commission-report', role: 'SUPER_ADMIN, MANAGER', desc: 'Aggregated take-rate and seller margin report' },

    { method: 'GET', path: '/api/admin/marketing/coupons', role: 'SUPER_ADMIN, MANAGER', desc: 'List active and scheduled discount vouchers' },
    { method: 'POST', path: '/api/admin/marketing/coupons', role: 'SUPER_ADMIN, MANAGER', desc: 'Create coupon code with min spend and limit' },
    { method: 'POST', path: '/api/admin/marketing/notifications/send', role: 'SUPER_ADMIN, MANAGER', desc: 'Broadcast push or email campaign to buyers or sellers' },

    { method: 'GET', path: '/api/admin/reviews', role: 'ALL ROLES', desc: 'List customer feedback and flagged reviews' },
    { method: 'POST', path: '/api/admin/reviews/:id/status', role: 'SUPER_ADMIN, MANAGER, SUPPORT', desc: 'Moderate review (Approve, Flag, Hide)' },
    { method: 'POST', path: '/api/admin/reviews/:id/reply', role: 'SUPER_ADMIN, MANAGER, SUPPORT', desc: 'Post official marketplace administrative reply' },
    { method: 'POST', path: '/api/admin/reviews/disputes/:id/resolve', role: 'SUPER_ADMIN, MANAGER, SUPPORT', desc: 'Resolve buyer-seller disputes with audit record' },

    { method: 'GET', path: '/api/admin/support/tickets', role: 'ALL ROLES', desc: 'Help desk queue with priority and status tags' },
    { method: 'POST', path: '/api/admin/support/tickets/:id/reply', role: 'ALL ROLES', desc: 'Reply to customer or post hidden internal staff note' },

    { method: 'GET', path: '/api/admin/settings', role: 'AUTHENTICATED', desc: 'Retrieve marketplace settings, tax rates and shipping' },
    { method: 'PUT', path: '/api/admin/settings', role: 'SUPER_ADMIN ONLY', desc: 'Update taxation, commission, and gateway credentials' },
    { method: 'GET', path: '/api/admin/settings/admins', role: 'SUPER_ADMIN ONLY', desc: 'List admin staff users' },
    { method: 'POST', path: '/api/admin/settings/admins', role: 'SUPER_ADMIN ONLY', desc: 'Provision new staff user' },
    { method: 'GET', path: '/api/admin/settings/audit-logs', role: 'SUPER_ADMIN ONLY', desc: 'Immutable chronological audit trail of all staff operations' },

    { method: 'GET', path: '/api/public/products', role: 'PUBLIC STORE', desc: 'Public customer storefront catalog (shared DB)' },
    { method: 'POST', path: '/api/public/orders', role: 'PUBLIC STORE', desc: 'Public customer order placement (shared DB)' }
  ];

  const permissionsList = [
    { key: 'dashboard:view', name: 'View Dashboard & Analytics' },
    { key: 'products:view', name: 'View Catalog Listings' },
    { key: 'products:manage', name: 'Create & Edit Listings / Stock' },
    { key: 'products:approve', name: 'Approve & Reject Vendor Listings' },
    { key: 'products:delete', name: 'Delete Listings' },
    { key: 'categories:manage', name: 'Manage Categories & Subcategories' },
    { key: 'orders:view', name: 'View Orders' },
    { key: 'orders:manage', name: 'Update Order Status & Dispatch' },
    { key: 'orders:refund', name: 'Authorize Customer Refunds' },
    { key: 'orders:cancel', name: 'Cancel Orders & Restock' },
    { key: 'customers:view', name: 'Browse Customer Accounts' },
    { key: 'customers:manage', name: 'Reset Buyer Passwords' },
    { key: 'customers:block', name: 'Enforce Account Blocks' },
    { key: 'sellers:view', name: 'View Sellers & Payout Requests' },
    { key: 'sellers:approve', name: 'Approve / Reject KYC Applications' },
    { key: 'sellers:manage', name: 'Configure Seller Commissions' },
    { key: 'sellers:payout', name: 'Disburse Payouts & Mark as Paid' },
    { key: 'payments:view', name: 'View Financial Ledger & Transactions' },
    { key: 'payments:refund', name: 'Process Gateway Refunds' },
    { key: 'marketing:manage', name: 'Manage Coupons, Banners & Broadcasts' },
    { key: 'reviews:moderate', name: 'Moderate Reviews & Official Responses' },
    { key: 'disputes:resolve', name: 'Resolve Buyer-Seller Disputes' },
    { key: 'support:manage', name: 'Handle Support Tickets & Internal Notes' },
    { key: 'settings:general', name: 'View Marketplace Identity' },
    { key: 'settings:finance', name: 'Configure Tax, Shipping & Gateways' },
    { key: 'settings:admins', name: 'Provision Staff & Modify RBAC Roles' },
    { key: 'settings:audit', name: 'Inspect & Export Full Audit Log' }
  ];

  const folderStructureText = `markethub-admin/
├── .env.example                     # Environment template (PORT, JWT_SECRET)
├── metadata.json                    # Application metadata & capabilities
├── package.json                     # Server & Client scripts (tsx server.ts, build)
├── index.html                       # HTML entry point with Plus Jakarta Sans & JetBrains Mono
├── tsconfig.json                    # Strict TypeScript configuration
├── vite.config.ts                   # Vite client bundler config
├── server.ts                        # Express server entry point mounting Vite middlewares
├── server/
│   ├── types.ts                     # Full backend TypeScript domain interfaces
│   ├── auth.ts                      # JWT signing/verifying, RBAC matrices, 2FA handler
│   ├── db.ts                        # Shared in-memory persistent database & audit logger
│   └── routes/
│       ├── adminAuth.ts             # Admin login, 2FA verify, demo role switcher
│       ├── adminDashboard.ts        # Aggregated sales, GMV, commissions, top products
│       ├── adminProducts.ts         # Listings CRUD, approval, CSV bulk upload, stock
│       ├── adminOrders.ts           # Order fulfillment, couriers, refunds, invoices
│       ├── adminCustomers.ts        # Buyer directory, block/unblock, password reset
│       ├── adminSellers.ts          # Seller KYC onboarding, commissions, payouts
│       ├── adminPayments.ts         # Ledger reconciliation, commission reports
│       ├── adminMarketing.ts        # Coupons, banners, broadcast email/push campaigns
│       ├── adminReviews.ts          # Review moderation, fraud reports, disputes
│       ├── adminSupport.ts          # Ticket conversations & hidden internal notes
│       ├── adminSettings.ts         # Tax rates, shipping rules, staff RBAC, audit log
│       └── customerRoutes.ts        # Public customer catalog & order placement (shared DB)
└── src/
    ├── main.tsx                     # React client mount
    ├── index.css                    # Tailwind CSS v4 styling rules
    ├── App.tsx                      # Primary router & layout container
    ├── types.ts                     # Frontend domain types
    ├── context/
    │   └── AuthContext.tsx          # Authentication, JWT store, RBAC checker, dark mode
    ├── services/
    │   └── api.ts                   # Typed API client with automatic Bearer token injection
    ├── utils/
    │   └── exportCsv.ts             # Generic high-performance CSV exporter
    └── components/
        ├── auth/
        │   └── AdminLoginView.tsx   # Separate Admin login with 2FA & demo quick-logins
        ├── common/
        │   ├── Navbar.tsx           # Global search, RBAC switcher, notifications, theme
        │   ├── Sidebar.tsx          # Operational navigation with badge counts
        │   ├── ConfirmationModal.tsx# Standard confirmation modal with reason audit notes
        │   ├── StorefrontPreviewModal.tsx # Live customer website test on shared backend
        │   └── DocumentationModal.tsx# In-app API catalog, RBAC matrix, and instructions
        └── modules/
            ├── DashboardView.tsx    # Sales cards, SVG trend chart, low-stock warnings
            ├── ProductManagementView.tsx # Catalog table, CSV upload, stock modal
            ├── CategoryManagementView.tsx# Department manager & commission fee overrides
            ├── OrderManagementView.tsx   # Orders table, courier assign, invoice/label print
            ├── CustomerManagementView.tsx# Buyer profiles & order history
            ├── SellerManagementView.tsx  # KYC verification & payout approval
            ├── PaymentsView.tsx     # Financial transactions ledger & commission report
            ├── MarketingView.tsx    # Coupons, hero banners & targeted notifications
            ├── ReviewsAndReportsView.tsx # Review moderation & dispute resolutions
            ├── SupportTicketsView.tsx    # Support inbox with internal notes
            └── SettingsView.tsx     # Tax/shipping config, admin staff, audit trail`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">System Architecture & Deliverables</h3>
              <p className="text-xs text-neutral-400">
                Complete API endpoints catalog, Role-Based Access Control matrix, and setup guide.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-neutral-950/60 border-b border-neutral-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'matrix' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            RBAC Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'endpoints' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Admin API Endpoints ({endpointList.length})
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'structure' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Folder Structure
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'setup' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Setup & .env Example
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* Tab 1: RBAC Matrix */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-neutral-400">
                  Granular role permissions enforced by the backend Express middleware (`requirePermission`, `requireRole`) and reflected across the client UI:
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Super Admin (Owner)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Manager (Ops)</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">Support (Care)</span>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-800 text-[11px] font-semibold uppercase text-neutral-400">
                      <th className="py-2.5 px-4">Permission Key</th>
                      <th className="py-2.5 px-4">Operation Description</th>
                      <th className="py-2.5 px-4 text-center">Super Admin</th>
                      <th className="py-2.5 px-4 text-center">Manager</th>
                      <th className="py-2.5 px-4 text-center">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {permissionsList.map((perm) => {
                      const superHas = true;
                      const mgrHas = ROLE_PERMISSIONS['MANAGER'].includes(perm.key);
                      const supHas = ROLE_PERMISSIONS['SUPPORT'].includes(perm.key);

                      return (
                        <tr key={perm.key} className="hover:bg-neutral-900/50">
                          <td className="py-2 px-4 font-mono text-[11px] text-indigo-400">{perm.key}</td>
                          <td className="py-2 px-4 text-neutral-300">{perm.name}</td>
                          <td className="py-2 px-4 text-center font-bold text-emerald-400">✓</td>
                          <td className="py-2 px-4 text-center font-bold">
                            {mgrHas ? <span className="text-emerald-400">✓</span> : <span className="text-neutral-600">—</span>}
                          </td>
                          <td className="py-2 px-4 text-center font-bold">
                            {supHas ? <span className="text-emerald-400">✓</span> : <span className="text-neutral-600">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Endpoints */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <p className="text-neutral-400">
                All admin routes are protected with JWT authentication (`Authorization: Bearer &lt;token&gt;`). All mutating actions automatically write an entry to the Audit Log.
              </p>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-800 text-[11px] font-semibold uppercase text-neutral-400">
                      <th className="py-2.5 px-4">HTTP</th>
                      <th className="py-2.5 px-4">Endpoint Path</th>
                      <th className="py-2.5 px-4">RBAC Role</th>
                      <th className="py-2.5 px-4">Action Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {endpointList.map((ep, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/50">
                        <td className="py-2 px-4">
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              ep.method === 'GET'
                                ? 'bg-sky-500/20 text-sky-400'
                                : ep.method === 'POST'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : ep.method === 'PUT'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {ep.method}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-mono text-[11px] text-neutral-200">{ep.path}</td>
                        <td className="py-2 px-4 font-mono text-[10px] text-indigo-400">{ep.role}</td>
                        <td className="py-2 px-4 text-neutral-300">{ep.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Folder Structure */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-neutral-400">Complete modular codebase folder hierarchy:</p>
                <button
                  onClick={() => copyToClipboard(folderStructureText, 'structure')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[11px] flex items-center gap-1.5"
                >
                  {copiedKey === 'structure' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'structure' ? 'Copied' : 'Copy Tree'}</span>
                </button>
              </div>

              <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 font-mono text-xs overflow-x-auto leading-relaxed">
                {folderStructureText}
              </pre>
            </div>
          )}

          {/* Tab 4: Setup & .env */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Environment Configuration (.env.example)</h4>
                <p className="text-neutral-400">
                  Configure the JWT signature secret and listening port:
                </p>
                <div className="relative">
                  <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 font-mono text-xs">
{`# MarketHub Server Port
PORT=3000

# Secret key used for signing administrative JWT tokens
JWT_SECRET="your-super-secret-jwt-signing-key-change-in-production"

# Application URL
APP_URL="http://localhost:3000"`}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Setup & Running Instructions</h4>
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-neutral-500"># 1. Install dependencies</span>
                    <div className="text-emerald-400 mt-0.5">npm install</div>
                  </div>
                  <div>
                    <span className="text-neutral-500"># 2. Run in development mode (starts Express + mounts Vite middleware on port 3000)</span>
                    <div className="text-emerald-400 mt-0.5">npm run dev</div>
                  </div>
                  <div>
                    <span className="text-neutral-500"># 3. Build for production</span>
                    <div className="text-emerald-400 mt-0.5">npm run build</div>
                  </div>
                  <div>
                    <span className="text-neutral-500"># 4. Run in production</span>
                    <div className="text-emerald-400 mt-0.5">npm run start</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Pre-seeded Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-semibold text-white">Super Admin (Owner)</span>
                    <div className="text-neutral-400 mt-1 font-mono text-[11px]">admin@markethub.com</div>
                    <div className="text-neutral-500 font-mono text-[11px]">Pass: admin123</div>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-semibold text-white">Manager (Ops)</span>
                    <div className="text-neutral-400 mt-1 font-mono text-[11px]">manager@markethub.com</div>
                    <div className="text-neutral-500 font-mono text-[11px]">Pass: manager123 (OTP: 123456)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="font-semibold text-white">Support Specialist</span>
                    <div className="text-neutral-400 mt-1 font-mono text-[11px]">support@markethub.com</div>
                    <div className="text-neutral-500 font-mono text-[11px]">Pass: support123</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
