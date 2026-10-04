import {
  AdminUser,
  DashboardData,
  Product,
  Category,
  Order,
  CustomerUser,
  Seller,
  Transaction,
  PayoutRequest,
  Coupon,
  PromotionalBanner,
  Review,
  DisputeReport,
  SupportTicket,
  SiteSettings,
  AuditLog,
  AdminRole
} from '../types';

const TOKEN_KEY = 'markethub_admin_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string, otp?: string) =>
    request<{ token?: string; requires2FA?: boolean; email?: string; admin?: AdminUser; permissions?: string[] }>(
      '/api/admin/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password, otp }) }
    ),

  getMe: () =>
    request<{ admin: AdminUser; permissions: string[] }>('/api/admin/auth/me'),

  toggle2FA: () =>
    request<{ success: boolean; twoFactorEnabled: boolean; message: string }>('/api/admin/auth/toggle-2fa', { method: 'POST' }),

  switchDemoRole: (role: AdminRole) =>
    request<{ token: string; admin: AdminUser; permissions: string[] }>('/api/admin/auth/switch-demo-role', {
      method: 'POST',
      body: JSON.stringify({ role })
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/api/admin/dashboard'),

  // Products
  getProducts: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ products: Product[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/admin/products${query ? `?${query}` : ''}`
    );
  },

  createProduct: (data: Partial<Product>) =>
    request<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  approveProduct: (id: string) =>
    request<{ success: boolean; product: Product }>(`/api/admin/products/${id}/approve`, { method: 'POST' }),

  rejectProduct: (id: string, reason: string) =>
    request<{ success: boolean; product: Product }>(`/api/admin/products/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  toggleFeatureProduct: (id: string) =>
    request<{ success: boolean; isFeatured: boolean }>(`/api/admin/products/${id}/toggle-featured`, { method: 'POST' }),

  toggleHideProduct: (id: string) =>
    request<{ success: boolean; status: string }>(`/api/admin/products/${id}/toggle-hide`, { method: 'POST' }),

  adjustStock: (id: string, payload: { adjustment?: number; newStock?: number }) =>
    request<{ success: boolean; stock: number }>(`/api/admin/products/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteProduct: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  bulkUploadProductsCSV: (csvData: string) =>
    request<{ success: boolean; importedCount: number; products: Product[] }>('/api/admin/products/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ csvData })
    }),

  // Categories
  getCategories: () => request<Category[]>('/api/admin/products/categories/all'),

  createCategory: (data: Partial<Category>) =>
    request<Category>('/api/admin/products/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id: string, data: Partial<Category>) =>
    request<Category>(`/api/admin/products/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCategory: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/products/categories/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ orders: Order[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/admin/orders${query ? `?${query}` : ''}`
    );
  },

  getOrderById: (id: string) => request<Order>(`/api/admin/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    request<{ success: boolean; order: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),

  assignDelivery: (id: string, courier: string, trackingNumber: string) =>
    request<{ success: boolean; order: Order }>(`/api/admin/orders/${id}/assign-delivery`, {
      method: 'POST',
      body: JSON.stringify({ courier, trackingNumber })
    }),

  refundOrder: (id: string, amount: number, reason: string) =>
    request<{ success: boolean; order: Order; refundTransaction: any }>(`/api/admin/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason })
    }),

  cancelOrder: (id: string, reason: string) =>
    request<{ success: boolean; order: Order }>(`/api/admin/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Customers
  getCustomers: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<CustomerUser[]>(`/api/admin/customers${query ? `?${query}` : ''}`);
  },

  getCustomerDetails: (id: string) =>
    request<{ customer: CustomerUser; orders: Order[] }>(`/api/admin/customers/${id}`),

  toggleBlockCustomer: (id: string, reason?: string) =>
    request<{ success: boolean; customer: CustomerUser }>(`/api/admin/customers/${id}/toggle-block`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  resetCustomerPassword: (id: string) =>
    request<{ success: boolean; message: string; temporaryPassword: string }>(`/api/admin/customers/${id}/reset-password`, {
      method: 'POST'
    }),

  // Sellers
  getSellers: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<Seller[]>(`/api/admin/sellers${query ? `?${query}` : ''}`);
  },

  getSellerDetails: (id: string) =>
    request<{ seller: Seller; products: Product[]; payouts: PayoutRequest[] }>(`/api/admin/sellers/${id}`),

  approveSeller: (id: string) =>
    request<{ success: boolean; seller: Seller }>(`/api/admin/sellers/${id}/approve`, { method: 'POST' }),

  rejectSeller: (id: string, reason: string) =>
    request<{ success: boolean; seller: Seller }>(`/api/admin/sellers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  setSellerCommission: (id: string, rate: number) =>
    request<{ success: boolean; seller: Seller }>(`/api/admin/sellers/${id}/commission`, {
      method: 'POST',
      body: JSON.stringify({ rate })
    }),

  getPayoutRequests: () => request<PayoutRequest[]>('/api/admin/sellers/payouts/all'),

  markPayoutPaid: (id: string, transactionRef?: string) =>
    request<{ success: boolean; payout: PayoutRequest }>(`/api/admin/sellers/payouts/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ transactionRef })
    }),

  // Payments & Finance
  getTransactions: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<Transaction[]>(`/api/admin/payments/transactions${query ? `?${query}` : ''}`);
  },

  getCommissionReport: () =>
    request<{
      totalCommission: number;
      totalGMV: number;
      effectiveTakeRate: string;
      sellers: { sellerName: string; gmv: number; commission: number; orderCount: number }[];
    }>('/api/admin/payments/commission-report'),

  // Marketing
  getCoupons: () => request<Coupon[]>('/api/admin/marketing/coupons'),

  createCoupon: (data: Partial<Coupon>) =>
    request<Coupon>('/api/admin/marketing/coupons', { method: 'POST', body: JSON.stringify(data) }),

  deleteCoupon: (id: string) =>
    request<{ success: boolean }>(`/api/admin/marketing/coupons/${id}`, { method: 'DELETE' }),

  getBanners: () => request<PromotionalBanner[]>('/api/admin/marketing/banners'),

  createBanner: (data: Partial<PromotionalBanner>) =>
    request<PromotionalBanner>('/api/admin/marketing/banners', { method: 'POST', body: JSON.stringify(data) }),

  deleteBanner: (id: string) =>
    request<{ success: boolean }>(`/api/admin/marketing/banners/${id}`, { method: 'DELETE' }),

  sendBroadcastNotification: (payload: { targetAudience: string; channel: string; title: string; message: string }) =>
    request<{ success: boolean; recipientsDispatched: number; message: string }>('/api/admin/marketing/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Reviews & Reports
  getReviews: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<Review[]>(`/api/admin/reviews${query ? `?${query}` : ''}`);
  },

  updateReviewStatus: (id: string, status: string) =>
    request<{ success: boolean; review: Review }>(`/api/admin/reviews/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),

  replyToReview: (id: string, reply: string) =>
    request<{ success: boolean; review: Review }>(`/api/admin/reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply })
    }),

  getDisputes: () => request<DisputeReport[]>('/api/admin/reviews/disputes/all'),

  resolveDispute: (id: string, status: string, resolutionNote: string) =>
    request<{ success: boolean; dispute: DisputeReport }>(`/api/admin/reviews/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, resolutionNote })
    }),

  // Support
  getSupportTickets: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<SupportTicket[]>(`/api/admin/support/tickets${query ? `?${query}` : ''}`);
  },

  getSupportTicketById: (id: string) => request<SupportTicket>(`/api/admin/support/tickets/${id}`),

  replySupportTicket: (id: string, message: string, isInternalNote = false, newStatus?: string) =>
    request<{ success: boolean; ticket: SupportTicket }>(`/api/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message, isInternalNote, newStatus })
    }),

  updateTicketStatus: (id: string, status?: string, priority?: string) =>
    request<{ success: boolean; ticket: SupportTicket }>(`/api/admin/support/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, priority })
    }),

  // Settings
  getSettings: () => request<SiteSettings>('/api/admin/settings'),

  updateSettings: (data: Partial<SiteSettings>) =>
    request<{ success: boolean; settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdmins: () => request<AdminUser[]>('/api/admin/settings/admins'),

  createAdmin: (data: { name: string; email: string; role: AdminRole; password: string }) =>
    request<AdminUser>('/api/admin/settings/admins', { method: 'POST', body: JSON.stringify(data) }),

  updateAdminRole: (id: string, role?: AdminRole, status?: 'active' | 'suspended') =>
    request<{ success: boolean; admin: AdminUser }>(`/api/admin/settings/admins/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, status })
    }),

  getAuditLogs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ logs: AuditLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/admin/settings/audit-logs${query ? `?${query}` : ''}`
    );
  },

  // Customer Storefront Simulator (Demonstrating shared database)
  getCustomerCatalog: () => request<Product[]>('/api/public/products'),
  placeCustomerOrder: (payload: any) =>
    request<{ success: boolean; order: Order; message: string }>('/api/public/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
