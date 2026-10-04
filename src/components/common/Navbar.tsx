import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  ChevronDown,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminRole } from '../../types';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onOpenStorefront: () => void;
  onOpenDocs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onOpenStorefront, onOpenDocs }) => {
  const { admin, logout, switchDemoRole, toggle2FA, theme, toggleTheme } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Low Stock Alert',
      desc: 'Geneva 1968 Heritage Watch is down to 2 units.',
      time: '10m ago',
      type: 'warning',
    },
    {
      id: 2,
      title: 'New Seller Application',
      desc: 'LuxeLeathers Atelier submitted verification documents.',
      time: '25m ago',
      type: 'info',
    },
    {
      id: 3,
      title: 'Dispute Flagged',
      desc: 'Order MK-88401 reported for delivery verification.',
      time: '1h ago',
      type: 'danger',
    },
  ];

  return (
    <header className="h-16 bg-neutral-900 border-b border-neutral-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search listings, orders, sellers, or customers (Ctrl + K)..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Quick Switcher for RBAC evaluation */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/60 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Role:</span>
            <span className="font-semibold text-indigo-300">
              {admin?.role === 'SUPER_ADMIN'
                ? 'Super Admin'
                : admin?.role === 'MANAGER'
                ? 'Manager'
                : 'Support'}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1 z-40 text-xs">
              <div className="px-3 py-1.5 font-semibold text-[10px] text-neutral-400 uppercase tracking-wider">
                Switch Test Role (RBAC)
              </div>
              {(['SUPER_ADMIN', 'MANAGER', 'SUPPORT'] as AdminRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchDemoRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    admin?.role === r
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="capitalize">{r.replace('_', ' ').toLowerCase()}</div>
                    <div className="text-[10px] text-neutral-400">
                      {r === 'SUPER_ADMIN'
                        ? 'Full owner privileges & finance'
                        : r === 'MANAGER'
                        ? 'Operations, listings & orders'
                        : 'Support tickets & customer care'}
                    </div>
                  </div>
                  {admin?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2FA Status Badge & quick toggle */}
        <button
          onClick={async () => {
            const next = await toggle2FA();
          }}
          title={admin?.twoFactorEnabled ? '2FA Enabled: Click to disable' : '2FA Disabled: Click to enable'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
            admin?.twoFactorEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {admin?.twoFactorEnabled ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>2FA: ON</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>2FA: OFF</span>
            </>
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 ring-2 ring-neutral-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-40">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200">Admin Alerts</span>
                <span className="text-[10px] text-indigo-400 font-medium">3 unread</span>
              </div>
              <div className="divide-y divide-neutral-800/60 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-neutral-800/50 rounded-lg text-xs transition-colors">
                    <div className="flex items-center justify-between text-neutral-300 font-medium">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-neutral-500">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Docs & Architecture Trigger */}
        <button
          onClick={onOpenDocs}
          title="Architecture, Endpoints & RBAC Matrix"
          className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <img
              src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
              alt={admin?.name}
              className="w-7 h-7 rounded-full object-cover border border-neutral-700"
            />
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1 z-40 text-xs">
              <div className="px-3 py-2 border-b border-neutral-800">
                <div className="font-semibold text-neutral-200 truncate">{admin?.name}</div>
                <div className="text-[11px] text-neutral-400 truncate">{admin?.email}</div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenDocs();
                  }}
                  className="w-full text-left px-3 py-2 text-neutral-300 hover:bg-neutral-800 rounded-lg flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-neutral-400" />
                  <span>API & Permissions</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
