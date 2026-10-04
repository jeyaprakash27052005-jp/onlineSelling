import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  CreditCard,
  Percent,
  Truck,
  UserPlus,
  History,
  Download,
  Search,
  CheckCircle2,
  Lock,
  Mail,
  Save,
  Key
} from 'lucide-react';
import { api } from '../../services/api';
import { SiteSettings, AdminUser, AuditLog, AdminRole } from '../../types';
import { exportToCsv } from '../../utils/exportCsv';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { admin, hasPermission } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'gateways' | 'admins' | 'audit'>('general');

  // Audit filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('all');

  // Add Admin modal
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('MANAGER');
  const [newAdminPassword, setNewAdminPassword] = useState('pass123');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [settRes, audRes] = await Promise.all([
        api.getSettings(),
        api.getAuditLogs({ search: auditSearch, module: auditModule }),
      ]);
      setSettings(settRes);
      setAuditLogs(audRes.logs);

      if (admin?.role === 'SUPER_ADMIN') {
        const staffRes = await api.getAdmins();
        setAdminUsers(staffRes);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [auditSearch, auditModule]);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setFeedback({ type: 'success', message: 'Platform configuration updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdmin({
        name: newAdminName,
        email: newAdminEmail,
        role: newAdminRole,
        password: newAdminPassword,
      });
      setFeedback({ type: 'success', message: `Staff account created for ${newAdminName}!` });
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateAdminRole = async (id: string, role: AdminRole) => {
    try {
      await api.updateAdminRole(id, role);
      setFeedback({ type: 'success', message: 'Staff role updated.' });
      loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleExportAuditLogs = () => {
    const rows = auditLogs.map((l) => ({
      Timestamp: l.timestamp,
      AdminName: l.adminName,
      Role: l.adminRole,
      Module: l.module,
      Action: l.action,
      Target: l.targetName || l.targetId || 'N/A',
      IPAddress: l.ipAddress,
      Details: l.details,
    }));
    exportToCsv('markethub_audit_logs', rows);
  };

  if (isLoading && !settings) {
    return <div className="p-8 text-center text-xs text-neutral-400">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Security</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure marketplace taxation, gateway credentials, staff accounts, and inspect full audit logs.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'general' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'finance' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tax & Shipping
          </button>
          <button
            onClick={() => setActiveTab('gateways')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'gateways' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Gateways
          </button>
          {admin?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'admins' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Staff & RBAC
            </button>
          )}
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'audit' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-neutral-200">
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: General */}
      {activeTab === 'general' && settings && (
        <form onSubmit={handleSaveGeneralSettings} className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white mb-2">Marketplace Identity</h3>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Marketplace Name</label>
            <input
              type="text"
              value={settings.general.siteName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, siteName: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Support Contact Email</label>
            <input
              type="email"
              value={settings.general.supportEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, supportEmail: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Primary Currency</label>
              <select
                value={settings.general.currency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, currency: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Timezone</label>
              <select
                value={settings.general.timezone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="America/New_York">Eastern Time (America/New_York)</option>
                <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                <option value="Europe/London">London (GMT)</option>
              </select>
            </div>
          </div>

          {hasPermission('settings:general') && (
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save General Settings</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Finance, Tax & Shipping */}
      {activeTab === 'finance' && settings && (
        <form onSubmit={handleSaveGeneralSettings} className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white mb-2">Taxation & Logistics Charges</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Sales Tax / GST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.finance.taxRatePercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    finance: { ...settings.finance, taxRatePercentage: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Default Take Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.finance.defaultCommissionRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    finance: { ...settings.finance, defaultCommissionRate: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Flat Base Shipping Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.finance.shippingBaseRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    finance: { ...settings.finance, shippingBaseRate: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Free Shipping Threshold ($)
              </label>
              <input
                type="number"
                step="1"
                value={settings.finance.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    finance: { ...settings.finance, freeShippingThreshold: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {hasPermission('settings:finance') && (
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Financial Rates</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 3: Payment Gateways */}
      {activeTab === 'gateways' && settings && (
        <form onSubmit={handleSaveGeneralSettings} className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Payment Gateway Integrations</h3>

          {/* Stripe */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white text-xs">Stripe Connect (Escrow & Direct Charges)</div>
              <input
                type="checkbox"
                checked={settings.paymentGateways.stripeEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentGateways: { ...settings.paymentGateways, stripeEnabled: e.target.checked },
                  })
                }
                className="rounded border-neutral-800 text-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Stripe Publishable Key
              </label>
              <input
                type="text"
                value={settings.paymentGateways.stripePublishableKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentGateways: { ...settings.paymentGateways, stripePublishableKey: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none"
              />
            </div>
          </div>

          {/* PayPal */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white text-xs">PayPal Commerce Platform</div>
              <input
                type="checkbox"
                checked={settings.paymentGateways.paypalEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentGateways: { ...settings.paymentGateways, paypalEnabled: e.target.checked },
                  })
                }
                className="rounded border-neutral-800 text-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                PayPal Client ID
              </label>
              <input
                type="text"
                value={settings.paymentGateways.paypalClientId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentGateways: { ...settings.paymentGateways, paypalClientId: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none"
              />
            </div>
          </div>

          {hasPermission('settings:finance') && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Gateway Configuration</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 4: Staff & RBAC */}
      {activeTab === 'admins' && admin?.role === 'SUPER_ADMIN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              Manage marketplace staff accounts and assign granular role-based access permissions.
            </div>
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff User</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">2FA Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {adminUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                        />
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-neutral-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs uppercase font-bold text-indigo-400">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {u.twoFactorEnabled ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                          2FA Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 font-mono">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {u.id !== admin?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateAdminRole(u.id, e.target.value as AdminRole)}
                          className="px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none"
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="MANAGER">Manager</option>
                          <option value="SUPPORT">Support</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-neutral-500 font-mono">Current User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter audit actions, staff, or details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={auditModule}
                onChange={(e) => setAuditModule(e.target.value)}
                className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Modules</option>
                <option value="Products">Products</option>
                <option value="Orders">Orders</option>
                <option value="Customers">Customers</option>
                <option value="Sellers">Sellers</option>
                <option value="Marketing">Marketing</option>
                <option value="Security">Security</option>
                <option value="Settings">Settings</option>
              </select>
            </div>

            <button
              onClick={handleExportAuditLogs}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Export Audit Trail</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Module & Action</th>
                  <th className="py-3 px-4">Action Details</th>
                  <th className="py-3 px-4 text-right">IP Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.adminName}</div>
                      <div className="text-[10px] font-mono text-indigo-400">{log.adminRole}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-neutral-950 border border-neutral-800 text-neutral-300 font-semibold">
                        {log.module}
                      </span>
                      <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                        {log.action}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-neutral-300 leading-snug">
                      {log.details}
                      {log.targetName && (
                        <span className="block text-[11px] text-neutral-500 font-mono mt-0.5">
                          Target: {log.targetName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px] text-neutral-500">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white mb-4">Provision Staff Account</h3>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="jordan@markethub.com"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Assigned Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="MANAGER">Manager (Products, Orders, Sellers, Reviews)</option>
                  <option value="SUPPORT">Support (Tickets, Customer lookup)</option>
                  <option value="SUPER_ADMIN">Super Admin (Unrestricted Owner Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Initial Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
