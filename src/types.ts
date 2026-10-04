export type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'blocked';
  blockedReason?: string;
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface Seller {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  kycDocumentUrl?: string;
  businessRegNumber: string;
  commissionRate: number;
  balance: number;
  totalSales: number;
  rating: number;
  ordersFulfilled: number;
  disputeCount: number;
  joinedDate: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    routingCode: string;
    accountHolder: string;
  };
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  commissionRate: number;
  subcategories: SubCategory[];
  productCount: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  title: string;
  sku: string;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  categoryName: string;
  subCategoryName?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  status: 'active' | 'pending_approval' | 'rejected' | 'hidden';
  rejectionReason?: string;
  isFeatured: boolean;
  images: string[];
  description: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'partially_refunded' | 'failed';
export type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer' | 'cod';

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  total: number;
  commissionTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentTransactionId: string;
  shippingAddress: {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  courier?: string;
  trackingNumber?: string;
  refundAmount?: number;
  refundReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  orderId?: string;
  sellerId?: string;
  sellerName?: string;
  type: 'sale' | 'payout' | 'refund' | 'commission_fee';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentGateway: 'Stripe' | 'PayPal' | 'Bank Wire';
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  requestedDate: string;
  processedDate?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  rejectionReason?: string;
  bankDetailsSummary: string;
  transactionRef?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchaseAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  position: 'hero_main' | 'top_strip' | 'middle_grid' | 'sidebar';
  isActive: boolean;
  displayOrder: number;
}

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  comment: string;
  status: 'approved' | 'flagged' | 'hidden';
  createdAt: string;
  adminReply?: string;
}

export interface DisputeReport {
  id: string;
  type: 'reported_listing' | 'reported_user' | 'order_dispute';
  targetId: string;
  targetTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: 'counterfeit' | 'scam' | 'abusive_behavior' | 'item_not_received' | 'damaged_goods' | 'other';
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userType: 'customer' | 'seller';
  subject: string;
  category: 'order_issue' | 'payout' | 'account' | 'listing' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: 'user' | 'agent';
    senderName: string;
    message: string;
    timestamp: string;
    isInternalNote?: boolean;
  }[];
}

export interface SiteSettings {
  general: {
    siteName: string;
    siteLogo: string;
    supportEmail: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
  };
  finance: {
    defaultCommissionRate: number;
    taxRatePercentage: number;
    shippingBaseRate: number;
    freeShippingThreshold: number;
  };
  paymentGateways: {
    stripeEnabled: boolean;
    stripeTestMode: boolean;
    stripePublishableKey: string;
    paypalEnabled: boolean;
    paypalTestMode: boolean;
    paypalClientId: string;
    codEnabled: boolean;
  };
  notifications: {
    emailOnNewOrder: boolean;
    emailOnLowStock: boolean;
    emailOnSellerRegistration: boolean;
    emailOnDispute: boolean;
  };
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  module: string;
  targetId?: string;
  targetName?: string;
  ipAddress: string;
  details: string;
  timestamp: string;
}

export interface DashboardData {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalRevenue: number;
  totalCommission: number;
  totalOrdersCount: number;
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  pendingProducts: number;
  lowStockCount: number;
  lowStockAlerts: Product[];
  salesTrend: { date: string; sales: number; commission: number; orders: number }[];
  categoryBreakdown: { name: string; revenue: number; ordersCount: number }[];
  topProducts: Product[];
  recentOrders: Order[];
}
