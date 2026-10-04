import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLoginView } from './components/auth/AdminLoginView';
import { Sidebar, NavModule } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { DashboardView } from './components/modules/DashboardView';
import { ProductManagementView } from './components/modules/ProductManagementView';
import { CategoryManagementView } from './components/modules/CategoryManagementView';
import { OrderManagementView } from './components/modules/OrderManagementView';
import { CustomerManagementView } from './components/modules/CustomerManagementView';
import { SellerManagementView } from './components/modules/SellerManagementView';
import { PaymentsView } from './components/modules/PaymentsView';
import { MarketingView } from './components/modules/MarketingView';
import { ReviewsAndReportsView } from './components/modules/ReviewsAndReportsView';
import { SupportTicketsView } from './components/modules/SupportTicketsView';
import { SettingsView } from './components/modules/SettingsView';
import { StorefrontPreviewModal } from './components/common/StorefrontPreviewModal';
import { DocumentationModal } from './components/common/DocumentationModal';
import { api } from './services/api';

const MainLayout: React.FC = () => {
  const { admin, token, isLoading } = useAuth();
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [badges, setBadges] = useState<{
    pendingProducts?: number;
    pendingSellers?: number;
    pendingOrders?: number;
    openTickets?: number;
  }>({});

  const loadBadges = async () => {
    try {
      const stats = await api.getDashboard();
      setBadges({
        pendingProducts: stats.pendingProducts,
        pendingSellers: stats.pendingSellers,
        pendingOrders: stats.recentOrders.filter((o) => o.status === 'pending').length,
        openTickets: 2,
      });
    } catch (err) {
      // Ignored if unauthenticated
    }
  };

  useEffect(() => {
    if (token) {
      loadBadges();
    }
  }, [token, activeModule]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Initializing MarketHub Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!token || !admin) {
    return <AdminLoginView />;
  }

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={(mod) => {
          if (mod === 'documentation') {
            setIsDocsOpen(true);
          } else {
            setActiveModule(mod);
          }
        }}
        onOpenStorefrontPreview={() => setIsStorefrontOpen(true)}
        badges={badges}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenStorefront={() => setIsStorefrontOpen(true)}
          onOpenDocs={() => setIsDocsOpen(true)}
        />

        {/* Scrollable Module Workspace */}
        <main className="flex-1 overflow-y-auto bg-neutral-950">
          {activeModule === 'dashboard' && (
            <DashboardView
              onNavigateModule={(mod) => setActiveModule(mod)}
            />
          )}
          {activeModule === 'products' && <ProductManagementView />}
          {activeModule === 'categories' && <CategoryManagementView />}
          {activeModule === 'orders' && <OrderManagementView />}
          {activeModule === 'customers' && <CustomerManagementView />}
          {activeModule === 'sellers' && <SellerManagementView />}
          {activeModule === 'payments' && <PaymentsView />}
          {activeModule === 'marketing' && <MarketingView />}
          {activeModule === 'reviews' && <ReviewsAndReportsView />}
          {activeModule === 'support' && <SupportTicketsView />}
          {activeModule === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Storefront Customer Simulator (Shared Backend DB) */}
      <StorefrontPreviewModal
        isOpen={isStorefrontOpen}
        onClose={() => setIsStorefrontOpen(false)}
        onOrderPlaced={() => {
          loadBadges();
        }}
      />

      {/* Complete Deliverables Documentation Modal */}
      <DocumentationModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
