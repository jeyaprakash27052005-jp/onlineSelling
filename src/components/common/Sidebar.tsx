import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Store,
  CreditCard,
  Megaphone,
  MessageSquare,
  LifeBuoy,
  Settings,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavModule =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'sellers'
  | 'payments'
  | 'marketing'
  | 'reviews'
  | 'support'
  | 'settings'
  | 'documentation';

interface SidebarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  onOpenStorefrontPreview: () => void;
  badges?: {
    pendingProducts?: number;
    pendingSellers?: number;
    pendingOrders?: number;
    openTickets?: number;
    lowStock?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  onOpenStorefrontPreview,
  badges = {},
}) => {
  const { admin, hasPermission } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavModule,
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard:view',
    },
    {
      id: 'products' as NavModule,
      label: 'Products',
      icon: Package,
      permission: 'products:view',
      badge: badges.pendingProducts ? `${badges.pendingProducts} new` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'categories' as NavModule,
      label: 'Categories',
      icon: Layers,
      permission: 'categories:manage',
    },
    {
      id: 'orders' as NavModule,
      label: 'Orders',
      icon: ShoppingBag,
      permission: 'orders:view',
      badge: badges.pendingOrders ? `${badges.pendingOrders}` : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      id: 'customers' as NavModule,
      label: 'Customers',
      icon: Users,
      permission: 'customers:view',
    },
    {
      id: 'sellers' as NavModule,
      label: 'Sellers & Payouts',
      icon: Store,
      permission: 'sellers:view',
      badge: badges.pendingSellers ? `${badges.pendingSellers} review` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'payments' as NavModule,
      label: 'Payments & Fees',
      icon: CreditCard,
      permission: 'payments:view',
    },
    {
      id: 'marketing' as NavModule,
      label: 'Marketing & Promo',
      icon: Megaphone,
      permission: 'marketing:manage',
    },
    {
      id: 'reviews' as NavModule,
      label: 'Reviews & Disputes',
      icon: MessageSquare,
      permission: 'reviews:moderate',
    },
    {
      id: 'support' as NavModule,
      label: 'Support Tickets',
      icon: LifeBuoy,
      permission: 'support:manage',
      badge: badges.openTickets ? `${badges.openTickets}` : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-400',
    },
    {
      id: 'settings' as NavModule,
      label: 'Settings & Audit',
      icon: Settings,
      permission: 'settings:general',
    },
    {
      id: 'documentation' as NavModule,
      label: 'API & RBAC Matrix',
      icon: BookOpen,
      permission: 'dashboard:view',
    },
  ];

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold tracking-tight">
            M
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              MarketHub
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">ADMIN</span>
            </div>
            <div className="text-[11px] text-neutral-400 font-normal">Global Marketplace</div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Core Operations
        </div>

        {navItems.map((item) => {
          const allowed = hasPermission(item.permission);
          const isActive = activeModule === item.id;
          const Icon = item.icon;

          if (!allowed) {
            return (
              <div
                key={item.id}
                title={`Requires permission: ${item.permission}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-neutral-600 text-xs cursor-not-allowed opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-neutral-600 font-mono">Locked</span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-neutral-400 group-hover:text-neutral-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shared Database Storefront Preview */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60">
        <button
          onClick={onOpenStorefrontPreview}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/50 hover:border-indigo-700/60 transition-all group"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Storefront Simulator</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="mt-1.5 px-1 text-[10px] text-neutral-500 leading-tight">
          Live customer portal testing shared DB
        </p>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900/40 flex items-center gap-2.5">
        <img
          src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
          alt={admin?.name}
          className="w-8 h-8 rounded-full object-cover border border-neutral-700"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-200 truncate">{admin?.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider truncate">
              {admin?.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
