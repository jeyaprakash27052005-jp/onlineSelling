import {
  AdminUser,
  CustomerUser,
  Seller,
  Category,
  Product,
  Order,
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
} from './types.js';

class InMemoryDatabase {
  adminUsers: AdminUser[] = [];
  adminPasswords: Record<string, string> = {}; // email -> password
  customers: CustomerUser[] = [];
  sellers: Seller[] = [];
  categories: Category[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  transactions: Transaction[] = [];
  payoutRequests: PayoutRequest[] = [];
  coupons: Coupon[] = [];
  banners: PromotionalBanner[] = [];
  reviews: Review[] = [];
  disputes: DisputeReport[] = [];
  supportTickets: SupportTicket[] = [];
  settings: SiteSettings;
  auditLogs: AuditLog[] = [];

  constructor() {
    this.settings = {
      general: {
        siteName: 'MarketHub Global',
        siteLogo: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=120&auto=format&fit=crop&q=80',
        supportEmail: 'ops@markethub.com',
        currency: 'USD',
        currencySymbol: '$',
        timezone: 'America/New_York'
      },
      finance: {
        defaultCommissionRate: 10,
        taxRatePercentage: 8.5,
        shippingBaseRate: 5.99,
        freeShippingThreshold: 75.00
      },
      paymentGateways: {
        stripeEnabled: true,
        stripeTestMode: true,
        stripePublishableKey: 'pk_test_51MzE4xKj89Q0Lkm9...9x',
        paypalEnabled: true,
        paypalTestMode: true,
        paypalClientId: 'client_id_live_mock_829374021',
        codEnabled: true
      },
      notifications: {
        emailOnNewOrder: true,
        emailOnLowStock: true,
        emailOnSellerRegistration: true,
        emailOnDispute: true
      }
    };

    this.seedDatabase();
  }

  private seedDatabase() {
    // 1. Admin Users
    this.adminUsers = [
      {
        id: 'adm-1',
        name: 'Elena Vance (Owner)',
        email: 'admin@markethub.com',
        role: 'SUPER_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        twoFactorEnabled: false,
        lastLogin: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        createdAt: '2025-01-15T08:00:00Z',
        status: 'active'
      },
      {
        id: 'adm-2',
        name: 'Marcus Sterling',
        email: 'manager@markethub.com',
        role: 'MANAGER',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        twoFactorEnabled: true,
        lastLogin: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
        createdAt: '2025-02-01T10:00:00Z',
        status: 'active'
      },
      {
        id: 'adm-3',
        name: 'Chloe Bennett',
        email: 'support@markethub.com',
        role: 'SUPPORT',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
        twoFactorEnabled: false,
        lastLogin: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        createdAt: '2025-02-15T14:00:00Z',
        status: 'active'
      }
    ];

    this.adminPasswords = {
      'admin@markethub.com': 'admin123',
      'manager@markethub.com': 'manager123',
      'support@markethub.com': 'support123'
    };

    // 2. Categories
    this.categories = [
      {
        id: 'cat-1',
        name: 'Electronics & Audio',
        slug: 'electronics-audio',
        description: 'Premium headphones, audio equipment, portable speakers and gadgets',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
        commissionRate: 8.0,
        productCount: 14,
        isActive: true,
        subcategories: [
          { id: 'sub-1', name: 'Wireless Headphones', slug: 'wireless-headphones', productCount: 6 },
          { id: 'sub-2', name: 'Smart Speakers', slug: 'smart-speakers', productCount: 4 },
          { id: 'sub-3', name: 'Cameras & Drones', slug: 'cameras-drones', productCount: 4 }
        ]
      },
      {
        id: 'cat-2',
        name: 'Fashion & Footwear',
        slug: 'fashion-footwear',
        description: 'Designer sneakers, artisan jackets, streetwear, and vintage apparel',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
        commissionRate: 12.0,
        productCount: 22,
        isActive: true,
        subcategories: [
          { id: 'sub-4', name: 'Sneakers & Athletic', slug: 'sneakers', productCount: 11 },
          { id: 'sub-5', name: 'Jackets & Outerwear', slug: 'outerwear', productCount: 7 },
          { id: 'sub-6', name: 'Bags & Accessories', slug: 'bags-accessories', productCount: 4 }
        ]
      },
      {
        id: 'cat-3',
        name: 'Watches & Timepieces',
        slug: 'watches-timepieces',
        description: 'Luxury mechanical, chronograph and heritage restored timepieces',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
        commissionRate: 14.0,
        productCount: 9,
        isActive: true,
        subcategories: [
          { id: 'sub-7', name: 'Automatic Mechanical', slug: 'automatic', productCount: 5 },
          { id: 'sub-8', name: 'Vintage Chronographs', slug: 'vintage-chronographs', productCount: 4 }
        ]
      },
      {
        id: 'cat-4',
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Modern ceramic vases, minimalist desk lamps, handwoven blankets',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&auto=format&fit=crop&q=80',
        commissionRate: 10.0,
        productCount: 16,
        isActive: true,
        subcategories: [
          { id: 'sub-9', name: 'Artisan Ceramics', slug: 'ceramics', productCount: 8 },
          { id: 'sub-10', name: 'Workspace & Lighting', slug: 'lighting', productCount: 8 }
        ]
      }
    ];

    // 3. Sellers
    this.sellers = [
      {
        id: 'sel-1',
        storeName: 'AeroSound Labs',
        ownerName: 'David Kross',
        email: 'david@aerosound.io',
        phone: '+1 (555) 234-8901',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        status: 'approved',
        businessRegNumber: 'REG-US-89210-AS',
        commissionRate: 8.0,
        balance: 4120.50,
        totalSales: 48950.00,
        rating: 4.9,
        ordersFulfilled: 342,
        disputeCount: 1,
        joinedDate: '2025-01-20',
        bankDetails: {
          bankName: 'JPMorgan Chase',
          accountNumber: '**** **** 4812',
          routingCode: '021000021',
          accountHolder: 'AeroSound Labs LLC'
        }
      },
      {
        id: 'sel-2',
        storeName: 'Kicks & Thread Guild',
        ownerName: 'Maya Rodriguez',
        email: 'maya@kicksthread.co',
        phone: '+1 (555) 782-9912',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
        status: 'approved',
        businessRegNumber: 'REG-CA-33819-KT',
        commissionRate: 11.5,
        balance: 6780.00,
        totalSales: 92400.00,
        rating: 4.8,
        ordersFulfilled: 680,
        disputeCount: 2,
        joinedDate: '2025-01-22',
        bankDetails: {
          bankName: 'Silicon Valley Bank',
          accountNumber: '**** **** 9031',
          routingCode: '121140399',
          accountHolder: 'Kicks & Thread Co'
        }
      },
      {
        id: 'sel-3',
        storeName: 'Horology Heritage',
        ownerName: 'Julian Beaumont',
        email: 'julian@horologyheritage.ch',
        phone: '+41 22 819 4400',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        status: 'approved',
        businessRegNumber: 'CH-660-1289-01',
        commissionRate: 12.0,
        balance: 14250.00,
        totalSales: 165800.00,
        rating: 5.0,
        ordersFulfilled: 124,
        disputeCount: 0,
        joinedDate: '2025-02-01',
        bankDetails: {
          bankName: 'UBS AG',
          accountNumber: '**** **** 7714',
          routingCode: '026002574',
          accountHolder: 'Horology Heritage SA'
        }
      },
      {
        id: 'sel-4',
        storeName: 'Nordic Hearth & Form',
        ownerName: 'Astrid Lind',
        email: 'astrid@nordichearth.com',
        phone: '+1 (555) 441-2091',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        status: 'approved',
        businessRegNumber: 'REG-NY-91823-NH',
        commissionRate: 10.0,
        balance: 2190.20,
        totalSales: 28400.00,
        rating: 4.7,
        ordersFulfilled: 210,
        disputeCount: 1,
        joinedDate: '2025-02-10',
        bankDetails: {
          bankName: 'Citibank N.A.',
          accountNumber: '**** **** 6629',
          routingCode: '021000089',
          accountHolder: 'Nordic Hearth Studio'
        }
      },
      {
        id: 'sel-5',
        storeName: 'PixelWave Custom Drones',
        ownerName: 'Evan Patel',
        email: 'evan@pixelwavedrones.io',
        phone: '+1 (555) 902-3311',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
        status: 'pending',
        kycDocumentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        businessRegNumber: 'REG-TX-77189-PW',
        commissionRate: 9.0,
        balance: 0,
        totalSales: 0,
        rating: 0,
        ordersFulfilled: 0,
        disputeCount: 0,
        joinedDate: '2026-03-28',
        bankDetails: {
          bankName: 'Wells Fargo Bank',
          accountNumber: '**** **** 3319',
          routingCode: '121000247',
          accountHolder: 'Evan Patel'
        }
      },
      {
        id: 'sel-6',
        storeName: 'LuxeLeathers Atelier',
        ownerName: 'Sofia Rossi',
        email: 'sofia@luxeleathers.it',
        phone: '+39 02 8912 3456',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        status: 'pending',
        kycDocumentUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80',
        businessRegNumber: 'IT-09283719001',
        commissionRate: 10.0,
        balance: 0,
        totalSales: 0,
        rating: 0,
        ordersFulfilled: 0,
        disputeCount: 0,
        joinedDate: '2026-03-30',
        bankDetails: {
          bankName: 'UniCredit Banca',
          accountNumber: '**** **** 8812',
          routingCode: 'UNCRITM1',
          accountHolder: 'LuxeLeathers Srl'
        }
      }
    ];

    // 4. Products
    this.products = [
      {
        id: 'prod-1',
        title: 'AeroPulse Studio Wireless ANC Headphones',
        sku: 'AERO-NC-001',
        sellerId: 'sel-1',
        sellerName: 'AeroSound Labs',
        categoryId: 'cat-1',
        categoryName: 'Electronics & Audio',
        subCategoryName: 'Wireless Headphones',
        price: 349.99,
        compareAtPrice: 399.99,
        costPrice: 190.00,
        stock: 3, // LOW STOCK ALERT
        lowStockThreshold: 10,
        status: 'active',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Audiophile planar magnetic drivers, adaptive noise cancellation, 45-hour battery life with aircraft-grade aluminum headband.',
        rating: 4.9,
        reviewCount: 48,
        salesCount: 168,
        createdAt: '2025-01-25T10:00:00Z',
        updatedAt: '2026-03-20T12:00:00Z'
      },
      {
        id: 'prod-2',
        title: 'SonicOrb Hi-Fi Spatial Bluetooth Speaker',
        sku: 'SONIC-ORB-2',
        sellerId: 'sel-1',
        sellerName: 'AeroSound Labs',
        categoryId: 'cat-1',
        categoryName: 'Electronics & Audio',
        subCategoryName: 'Smart Speakers',
        price: 219.00,
        compareAtPrice: 249.00,
        costPrice: 110.00,
        stock: 24,
        lowStockThreshold: 5,
        status: 'active',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80'
        ],
        description: '360-degree acoustic dispersion sphere with dual passive bass radiators and solid walnut wooden base.',
        rating: 4.8,
        reviewCount: 32,
        salesCount: 94,
        createdAt: '2025-02-02T11:00:00Z',
        updatedAt: '2026-03-15T09:00:00Z'
      },
      {
        id: 'prod-3',
        title: 'Apex Runner Pro Edition Neon Citron',
        sku: 'KICK-RUN-99',
        sellerId: 'sel-2',
        sellerName: 'Kicks & Thread Guild',
        categoryId: 'cat-2',
        categoryName: 'Fashion & Footwear',
        subCategoryName: 'Sneakers & Athletic',
        price: 185.00,
        compareAtPrice: 210.00,
        costPrice: 85.00,
        stock: 4, // LOW STOCK ALERT
        lowStockThreshold: 8,
        status: 'active',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Carbon fiber propulsion plate with responsive supercritical foam for marathon comfort and street presence.',
        rating: 4.9,
        reviewCount: 76,
        salesCount: 310,
        createdAt: '2025-01-28T14:30:00Z',
        updatedAt: '2026-03-24T16:00:00Z'
      },
      {
        id: 'prod-4',
        title: 'Waxed Canvas & Horween Leather Explorer Jacket',
        sku: 'KT-JACKET-WAX',
        sellerId: 'sel-2',
        sellerName: 'Kicks & Thread Guild',
        categoryId: 'cat-2',
        categoryName: 'Fashion & Footwear',
        subCategoryName: 'Jackets & Outerwear',
        price: 360.00,
        compareAtPrice: 420.00,
        costPrice: 195.00,
        stock: 18,
        lowStockThreshold: 5,
        status: 'active',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Heavyweight weatherproof British waxed canvas with brass hardware and brushed flannel lining.',
        rating: 4.7,
        reviewCount: 29,
        salesCount: 88,
        createdAt: '2025-02-14T09:15:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
      },
      {
        id: 'prod-5',
        title: 'Geneva 1968 Heritage Chronograph Automatic',
        sku: 'HORO-GEN-68',
        sellerId: 'sel-3',
        sellerName: 'Horology Heritage',
        categoryId: 'cat-3',
        categoryName: 'Watches & Timepieces',
        subCategoryName: 'Vintage Chronographs',
        price: 1850.00,
        compareAtPrice: 2100.00,
        costPrice: 1200.00,
        stock: 2, // LOW STOCK ALERT
        lowStockThreshold: 3,
        status: 'active',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Valjoux-inspired column wheel mechanical chronograph with sapphire box crystal and Italian hand-stitched strap.',
        rating: 5.0,
        reviewCount: 18,
        salesCount: 22,
        createdAt: '2025-02-10T12:00:00Z',
        updatedAt: '2026-03-29T11:00:00Z'
      },
      {
        id: 'prod-6',
        title: 'Minimalist Matte Ceramic Carafe & Tumbler Set',
        sku: 'NH-CER-04',
        sellerId: 'sel-4',
        sellerName: 'Nordic Hearth & Form',
        categoryId: 'cat-4',
        categoryName: 'Home & Living',
        subCategoryName: 'Artisan Ceramics',
        price: 94.00,
        compareAtPrice: 110.00,
        costPrice: 38.00,
        stock: 35,
        lowStockThreshold: 10,
        status: 'active',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Wheel-thrown stoneware with reactive sand glaze. Microwave and dishwasher safe, set of 1 carafe and 2 tumblers.',
        rating: 4.8,
        reviewCount: 15,
        salesCount: 78,
        createdAt: '2025-02-18T15:00:00Z',
        updatedAt: '2026-03-22T14:30:00Z'
      },
      {
        id: 'prod-7',
        title: 'Stealth CineDrone 4K Pro Gimbal (Submitted for Review)',
        sku: 'PW-DRONE-4K',
        sellerId: 'sel-5',
        sellerName: 'PixelWave Custom Drones',
        categoryId: 'cat-1',
        categoryName: 'Electronics & Audio',
        subCategoryName: 'Cameras & Drones',
        price: 890.00,
        compareAtPrice: 999.00,
        costPrice: 550.00,
        stock: 12,
        lowStockThreshold: 3,
        status: 'pending_approval', // Pending admin review
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Foldable quadcopter with 3-axis mechanical stabilization, 1-inch CMOS sensor, and 12km OcuSync range.',
        rating: 0,
        reviewCount: 0,
        salesCount: 0,
        createdAt: '2026-03-31T08:00:00Z',
        updatedAt: '2026-03-31T08:00:00Z'
      },
      {
        id: 'prod-8',
        title: 'Tuscan Full-Grain Leather Briefcase (Submitted for Review)',
        sku: 'LUXE-BAG-09',
        sellerId: 'sel-6',
        sellerName: 'LuxeLeathers Atelier',
        categoryId: 'cat-2',
        categoryName: 'Fashion & Footwear',
        subCategoryName: 'Bags & Accessories',
        price: 480.00,
        compareAtPrice: 550.00,
        costPrice: 240.00,
        stock: 6,
        lowStockThreshold: 2,
        status: 'pending_approval', // Pending admin review
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Vegetable-tanned leather briefcase hand-stitched in Florence. Fits up to 16-inch laptops with dedicated document sleeves.',
        rating: 0,
        reviewCount: 0,
        salesCount: 0,
        createdAt: '2026-04-01T11:20:00Z',
        updatedAt: '2026-04-01T11:20:00Z'
      }
    ];

    // 5. Customers
    this.customers = [
      {
        id: 'cust-1',
        name: 'Rachel Adams',
        email: 'rachel.adams@gmail.com',
        phone: '+1 (555) 345-9812',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        status: 'active',
        joinedDate: '2025-01-18',
        totalOrders: 6,
        totalSpent: 1845.50,
        shippingAddress: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          zip: '97477',
          country: 'United States'
        }
      },
      {
        id: 'cust-2',
        name: 'Liam Chen',
        email: 'liam.chen@outlook.com',
        phone: '+1 (555) 671-8899',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        status: 'active',
        joinedDate: '2025-01-29',
        totalOrders: 9,
        totalSpent: 4210.00,
        shippingAddress: {
          street: '120 Market Street, Apt 14B',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'United States'
        }
      },
      {
        id: 'cust-3',
        name: 'Amara Okafor',
        email: 'amara.okafor@techpulse.io',
        phone: '+1 (555) 890-1234',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        status: 'active',
        joinedDate: '2025-02-05',
        totalOrders: 3,
        totalSpent: 920.00,
        shippingAddress: {
          street: '450 West 33rd Street',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States'
        }
      },
      {
        id: 'cust-4',
        name: 'Tyler Vance',
        email: 'tyler.vance99@yahoo.com',
        phone: '+1 (555) 431-7766',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        status: 'blocked',
        blockedReason: 'Multiple fraudulent chargeback claims on high-value timepieces',
        joinedDate: '2025-02-12',
        totalOrders: 2,
        totalSpent: 3700.00,
        shippingAddress: {
          street: '88 Ocean Boulevard',
          city: 'Miami Beach',
          state: 'FL',
          zip: '33139',
          country: 'United States'
        }
      },
      {
        id: 'cust-5',
        name: 'Clara Oswald',
        email: 'clara.oswald@gmail.com',
        phone: '+44 20 7946 0991',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        status: 'active',
        joinedDate: '2025-02-28',
        totalOrders: 4,
        totalSpent: 1250.00,
        shippingAddress: {
          street: '221B Baker Street',
          city: 'London',
          state: 'Greater London',
          zip: 'NW1 6XE',
          country: 'United Kingdom'
        }
      }
    ];

    // 6. Orders
    this.orders = [
      {
        id: 'ord-101',
        orderNumber: 'MK-88401',
        customerId: 'cust-2',
        customerName: 'Liam Chen',
        customerEmail: 'liam.chen@outlook.com',
        items: [
          {
            id: 'item-1',
            productId: 'prod-5',
            title: 'Geneva 1968 Heritage Chronograph Automatic',
            sku: 'HORO-GEN-68',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
            price: 1850.00,
            quantity: 1,
            sellerId: 'sel-3',
            sellerName: 'Horology Heritage'
          }
        ],
        subtotal: 1850.00,
        tax: 157.25,
        shippingFee: 0.00,
        discount: 0.00,
        total: 2007.25,
        commissionTotal: 222.00, // 12%
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        paymentTransactionId: 'ch_stripe_99218201',
        shippingAddress: {
          recipientName: 'Liam Chen',
          street: '120 Market Street, Apt 14B',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'United States'
        },
        courier: 'FedEx Express Priority',
        trackingNumber: 'FX-8492049102US',
        createdAt: '2026-04-03T14:20:00Z',
        updatedAt: '2026-04-04T09:15:00Z'
      },
      {
        id: 'ord-102',
        orderNumber: 'MK-88402',
        customerId: 'cust-1',
        customerName: 'Rachel Adams',
        customerEmail: 'rachel.adams@gmail.com',
        items: [
          {
            id: 'item-2',
            productId: 'prod-1',
            title: 'AeroPulse Studio Wireless ANC Headphones',
            sku: 'AERO-NC-001',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80',
            price: 349.99,
            quantity: 1,
            sellerId: 'sel-1',
            sellerName: 'AeroSound Labs'
          }
        ],
        subtotal: 349.99,
        tax: 29.75,
        shippingFee: 5.99,
        discount: 35.00,
        total: 350.73,
        commissionTotal: 28.00, // 8%
        status: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        paymentTransactionId: 'ch_stripe_88192019',
        shippingAddress: {
          recipientName: 'Rachel Adams',
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          zip: '97477',
          country: 'United States'
        },
        courier: 'UPS Ground',
        trackingNumber: '1Z9999999999999999',
        createdAt: '2026-04-04T08:15:00Z',
        updatedAt: '2026-04-04T10:30:00Z'
      },
      {
        id: 'ord-103',
        orderNumber: 'MK-88403',
        customerId: 'cust-3',
        customerName: 'Amara Okafor',
        customerEmail: 'amara.okafor@techpulse.io',
        items: [
          {
            id: 'item-3',
            productId: 'prod-3',
            title: 'Apex Runner Pro Edition Neon Citron',
            sku: 'KICK-RUN-99',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
            price: 185.00,
            quantity: 2,
            sellerId: 'sel-2',
            sellerName: 'Kicks & Thread Guild'
          }
        ],
        subtotal: 370.00,
        tax: 31.45,
        shippingFee: 0.00,
        discount: 0.00,
        total: 401.45,
        commissionTotal: 42.55, // 11.5%
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'paypal',
        paymentTransactionId: 'PAYPAL-TX-331902',
        shippingAddress: {
          recipientName: 'Amara Okafor',
          street: '450 West 33rd Street',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States'
        },
        courier: 'DHL Express',
        trackingNumber: 'DHL-98129038',
        createdAt: '2026-04-04T11:45:00Z',
        updatedAt: '2026-04-04T12:00:00Z'
      },
      {
        id: 'ord-104',
        orderNumber: 'MK-88404',
        customerId: 'cust-5',
        customerName: 'Clara Oswald',
        customerEmail: 'clara.oswald@gmail.com',
        items: [
          {
            id: 'item-4',
            productId: 'prod-6',
            title: 'Minimalist Matte Ceramic Carafe & Tumbler Set',
            sku: 'NH-CER-04',
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&auto=format&fit=crop&q=80',
            price: 94.00,
            quantity: 1,
            sellerId: 'sel-4',
            sellerName: 'Nordic Hearth & Form'
          }
        ],
        subtotal: 94.00,
        tax: 7.99,
        shippingFee: 5.99,
        discount: 0.00,
        total: 107.98,
        commissionTotal: 9.40,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'bank_transfer',
        paymentTransactionId: 'WIRE-PENDING-4491',
        shippingAddress: {
          recipientName: 'Clara Oswald',
          street: '221B Baker Street',
          city: 'London',
          state: 'Greater London',
          zip: 'NW1 6XE',
          country: 'United Kingdom'
        },
        createdAt: '2026-04-04T13:10:00Z',
        updatedAt: '2026-04-04T13:10:00Z'
      }
    ];

    // 7. Transactions
    this.transactions = [
      {
        id: 'tx-1',
        orderId: 'ord-101',
        sellerId: 'sel-3',
        sellerName: 'Horology Heritage',
        type: 'sale',
        amount: 2007.25,
        status: 'completed',
        paymentGateway: 'Stripe',
        referenceId: 'ch_stripe_99218201',
        description: 'Customer payment for Order MK-88401',
        createdAt: '2026-04-03T14:20:00Z'
      },
      {
        id: 'tx-2',
        orderId: 'ord-101',
        sellerId: 'sel-3',
        sellerName: 'Horology Heritage',
        type: 'commission_fee',
        amount: 222.00,
        status: 'completed',
        paymentGateway: 'Stripe',
        referenceId: 'fee_mk_88401',
        description: 'Marketplace 12% commission earned on Order MK-88401',
        createdAt: '2026-04-03T14:20:00Z'
      },
      {
        id: 'tx-3',
        orderId: 'ord-102',
        sellerId: 'sel-1',
        sellerName: 'AeroSound Labs',
        type: 'sale',
        amount: 350.73,
        status: 'completed',
        paymentGateway: 'Stripe',
        referenceId: 'ch_stripe_88192019',
        description: 'Customer payment for Order MK-88402',
        createdAt: '2026-04-04T08:15:00Z'
      },
      {
        id: 'tx-4',
        sellerId: 'sel-2',
        sellerName: 'Kicks & Thread Guild',
        type: 'payout',
        amount: 5200.00,
        status: 'completed',
        paymentGateway: 'Bank Wire',
        referenceId: 'WIRE-PO-20260401',
        description: 'Bi-weekly seller earnings disbursement',
        createdAt: '2026-04-01T15:00:00Z'
      }
    ];

    // 8. Payout Requests
    this.payoutRequests = [
      {
        id: 'pay-1',
        sellerId: 'sel-1',
        sellerName: 'AeroSound Labs',
        amount: 4120.50,
        requestedDate: '2026-04-02T10:00:00Z',
        status: 'pending',
        bankDetailsSummary: 'JPMorgan Chase (**** 4812)'
      },
      {
        id: 'pay-2',
        sellerId: 'sel-3',
        sellerName: 'Horology Heritage',
        amount: 14250.00,
        requestedDate: '2026-04-03T16:00:00Z',
        status: 'pending',
        bankDetailsSummary: 'UBS AG (**** 7714)'
      },
      {
        id: 'pay-3',
        sellerId: 'sel-2',
        sellerName: 'Kicks & Thread Guild',
        amount: 5200.00,
        requestedDate: '2026-03-31T09:00:00Z',
        processedDate: '2026-04-01T15:00:00Z',
        status: 'paid',
        bankDetailsSummary: 'Silicon Valley Bank (**** 9031)',
        transactionRef: 'WIRE-PO-20260401'
      }
    ];

    // 9. Coupons
    this.coupons = [
      {
        id: 'coup-1',
        code: 'SPRINGFEST25',
        type: 'percentage',
        value: 15,
        minPurchaseAmount: 100.00,
        maxDiscount: 50.00,
        startDate: '2026-03-15',
        endDate: '2026-04-30',
        usageLimit: 500,
        usedCount: 142,
        isActive: true
      },
      {
        id: 'coup-2',
        code: 'WELCOME10',
        type: 'fixed',
        value: 10,
        minPurchaseAmount: 50.00,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        usageLimit: 2000,
        usedCount: 780,
        isActive: true
      },
      {
        id: 'coup-3',
        code: 'FLASH50',
        type: 'fixed',
        value: 50,
        minPurchaseAmount: 300.00,
        startDate: '2026-04-01',
        endDate: '2026-04-05',
        usageLimit: 50,
        usedCount: 46,
        isActive: true
      }
    ];

    // 10. Promotional Banners
    this.banners = [
      {
        id: 'ban-1',
        title: 'Spring Heritage Watch Showcase',
        subtitle: 'Rare mechanical and chronograph restorations with certified authenticity',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80',
        linkUrl: '/category/watches-timepieces',
        position: 'hero_main',
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'ban-2',
        title: 'Sound In Motion: ANC Studio Line',
        subtitle: 'Immersive sound engineering curated for creators and travelers',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
        linkUrl: '/category/electronics-audio',
        position: 'top_strip',
        isActive: true,
        displayOrder: 2
      }
    ];

    // 11. Reviews
    this.reviews = [
      {
        id: 'rev-1',
        productId: 'prod-1',
        productTitle: 'AeroPulse Studio Wireless ANC Headphones',
        customerId: 'cust-1',
        customerName: 'Rachel Adams',
        sellerId: 'sel-1',
        sellerName: 'AeroSound Labs',
        rating: 5,
        comment: 'Outstanding build quality and comfort! Noise cancellation easily rivals flagship brands.',
        status: 'approved',
        createdAt: '2026-03-29T10:14:00Z',
        adminReply: 'Thank you for supporting verified artisan audio creators on MarketHub!'
      },
      {
        id: 'rev-2',
        productId: 'prod-3',
        productTitle: 'Apex Runner Pro Edition Neon Citron',
        customerId: 'cust-3',
        customerName: 'Amara Okafor',
        sellerId: 'sel-2',
        sellerName: 'Kicks & Thread Guild',
        rating: 4,
        comment: 'Ran 15km right out of the box. Super light and bouncy. Sizing runs half a size small.',
        status: 'approved',
        createdAt: '2026-04-01T12:00:00Z'
      },
      {
        id: 'rev-3',
        productId: 'prod-6',
        productTitle: 'Minimalist Matte Ceramic Carafe & Tumbler Set',
        customerId: 'cust-5',
        customerName: 'Clara Oswald',
        sellerId: 'sel-4',
        sellerName: 'Nordic Hearth & Form',
        rating: 1,
        comment: 'SPAM TEST: Click here for discount gift cards bit.ly/free-cards-now',
        status: 'flagged',
        createdAt: '2026-04-02T19:30:00Z'
      }
    ];

    // 12. Disputes & Reports
    this.disputes = [
      {
        id: 'disp-1',
        type: 'order_dispute',
        targetId: 'ord-101',
        targetTitle: 'Order MK-88401 (Geneva 1968 Watch)',
        reporterName: 'Tyler Vance',
        reporterEmail: 'tyler.vance99@yahoo.com',
        reason: 'item_not_received',
        description: 'Customer claims package was marked delivered but not received at doorstep.',
        status: 'under_review',
        createdAt: '2026-04-04T01:10:00Z'
      },
      {
        id: 'disp-2',
        type: 'reported_listing',
        targetId: 'prod-7',
        targetTitle: 'Stealth CineDrone 4K Pro Gimbal',
        reporterName: 'David Kross',
        reporterEmail: 'david@aerosound.io',
        reason: 'counterfeit',
        description: 'Possible copyright violation of motor blueprint. Requesting serial verification.',
        status: 'open',
        createdAt: '2026-04-02T18:22:00Z'
      }
    ];

    // 13. Support Tickets
    this.supportTickets = [
      {
        id: 'tick-1',
        ticketNumber: 'TCK-2026-901',
        userId: 'sel-1',
        userName: 'David Kross (AeroSound Labs)',
        userType: 'seller',
        subject: 'Expedited Payout Request for Bulk Inventory Order',
        category: 'payout',
        priority: 'high',
        status: 'open',
        createdAt: '2026-04-03T16:40:00Z',
        updatedAt: '2026-04-04T07:20:00Z',
        messages: [
          {
            id: 'm-1',
            sender: 'user',
            senderName: 'David Kross',
            message: 'Hello MarketHub Admin, we have a $4,120 pending payout request. Can this be processed ahead of the normal Friday batch so we can secure component orders?',
            timestamp: '2026-04-03T16:40:00Z'
          },
          {
            id: 'm-2',
            sender: 'agent',
            senderName: 'Marcus Sterling (Manager)',
            message: 'Hi David, reviewing your account metrics now. Your fulfillment rate is 99.4%, so we will approve wire release today.',
            timestamp: '2026-04-04T07:20:00Z'
          }
        ]
      },
      {
        id: 'tick-2',
        ticketNumber: 'TCK-2026-902',
        userId: 'cust-1',
        userName: 'Rachel Adams',
        userType: 'customer',
        subject: 'Change Delivery Address for Order MK-88402',
        category: 'order_issue',
        priority: 'medium',
        status: 'pending',
        createdAt: '2026-04-04T08:50:00Z',
        updatedAt: '2026-04-04T08:50:00Z',
        messages: [
          {
            id: 'm-3',
            sender: 'user',
            senderName: 'Rachel Adams',
            message: 'Hi, I accidentally typed my old apartment number for the headphones order. Can you update it to Apt 4C before it leaves the dispatch hub?',
            timestamp: '2026-04-04T08:50:00Z'
          }
        ]
      }
    ];

    // 14. Audit Logs
    this.auditLogs = [
      {
        id: 'aud-1',
        adminId: 'adm-1',
        adminName: 'Elena Vance (Owner)',
        adminRole: 'SUPER_ADMIN',
        action: 'UPDATE_COMMISSION',
        module: 'Sellers',
        targetId: 'sel-1',
        targetName: 'AeroSound Labs',
        ipAddress: '192.168.1.104',
        details: 'Reduced category commission rate from 10% to 8% for high-volume preferred seller tier.',
        timestamp: '2026-04-03T10:15:00Z'
      },
      {
        id: 'aud-2',
        adminId: 'adm-2',
        adminName: 'Marcus Sterling',
        adminRole: 'MANAGER',
        action: 'UPDATE_ORDER_STATUS',
        module: 'Orders',
        targetId: 'ord-101',
        targetName: 'Order MK-88401',
        ipAddress: '192.168.1.189',
        details: 'Updated status to DELIVERED and assigned FedEx tracking FX-8492049102US.',
        timestamp: '2026-04-04T09:15:00Z'
      },
      {
        id: 'aud-3',
        adminId: 'adm-1',
        adminName: 'Elena Vance (Owner)',
        adminRole: 'SUPER_ADMIN',
        action: 'BLOCK_CUSTOMER',
        module: 'Customers',
        targetId: 'cust-4',
        targetName: 'Tyler Vance',
        ipAddress: '192.168.1.104',
        details: 'Blocked customer account due to fraudulent chargeback alerts.',
        timestamp: '2026-04-04T10:05:00Z'
      }
    ];
  }

  // --- Helper Methods ---

  logAudit(adminUser: { id: string; name: string; role: AdminRole }, action: string, module: string, details: string, targetId?: string, targetName?: string, ip = '127.0.0.1') {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminId: adminUser.id,
      adminName: adminUser.name,
      adminRole: adminUser.role,
      action,
      module,
      targetId,
      targetName,
      ipAddress: ip,
      details,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    return log;
  }

  getAdminByEmail(email: string) {
    return this.adminUsers.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  getAdminById(id: string) {
    return this.adminUsers.find(a => a.id === id);
  }

  verifyAdminPassword(email: string, passwordAttempt: string): boolean {
    const expected = this.adminPasswords[email.toLowerCase()];
    return expected !== undefined && expected === passwordAttempt;
  }

  getDashboardStats() {
    const totalOrdersCount = this.orders.length;
    const totalRevenue = this.orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
    const totalCommission = this.orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.commissionTotal : 0), 0);
    const totalUsers = this.customers.length;
    const totalSellers = this.sellers.length;
    const pendingSellers = this.sellers.filter(s => s.status === 'pending').length;
    const pendingProducts = this.products.filter(p => p.status === 'pending_approval').length;
    const lowStockProducts = this.products.filter(p => p.stock <= p.lowStockThreshold);

    // Sales breakdown by time periods
    const todaySales = this.orders
      .filter(o => o.createdAt.startsWith('2026-04-04') && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    const weeklySales = totalRevenue; // In current simulated period
    const monthlySales = totalRevenue;

    // Category breakdown
    const categorySales: Record<string, { name: string; revenue: number; ordersCount: number }> = {};
    for (const ord of this.orders) {
      if (ord.paymentStatus !== 'paid') continue;
      for (const item of ord.items) {
        const prod = this.products.find(p => p.id === item.productId);
        const catName = prod?.categoryName || 'Other';
        if (!categorySales[catName]) {
          categorySales[catName] = { name: catName, revenue: 0, ordersCount: 0 };
        }
        categorySales[catName].revenue += item.price * item.quantity;
        categorySales[catName].ordersCount += item.quantity;
      }
    }

    // Top products
    const topProducts = [...this.products]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    // 7-day sales trend mock
    const salesTrend = [
      { date: 'Mar 29', sales: 1240, commission: 140, orders: 4 },
      { date: 'Mar 30', sales: 1890, commission: 210, orders: 7 },
      { date: 'Mar 31', sales: 2450, commission: 285, orders: 9 },
      { date: 'Apr 01', sales: 1980, commission: 220, orders: 6 },
      { date: 'Apr 02', sales: 3120, commission: 340, orders: 11 },
      { date: 'Apr 03', sales: 2790, commission: 295, orders: 8 },
      { date: 'Apr 04', sales: 2866, commission: 302, orders: 8 }
    ];

    return {
      todaySales,
      weeklySales,
      monthlySales,
      totalRevenue,
      totalCommission,
      totalOrdersCount,
      totalUsers,
      totalSellers,
      pendingSellers,
      pendingProducts,
      lowStockCount: lowStockProducts.length,
      lowStockAlerts: lowStockProducts,
      salesTrend,
      categoryBreakdown: Object.values(categorySales),
      topProducts,
      recentOrders: this.orders.slice(0, 5)
    };
  }
}

export const db = new InMemoryDatabase();
