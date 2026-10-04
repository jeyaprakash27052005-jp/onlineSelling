import express from 'express';
import { db } from '../db.js';
import { Order } from '../types.js';

const router = express.Router();

// GET /api/public/products - Customer storefront catalog
router.get('/products', (req, res) => {
  const { category, search } = req.query;

  let activeProducts = db.products.filter(p => p.status === 'active');

  if (category && category !== 'all') {
    activeProducts = activeProducts.filter(p => p.categoryId === category);
  }

  if (search) {
    const s = String(search).toLowerCase();
    activeProducts = activeProducts.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s)
    );
  }

  return res.json(activeProducts);
});

// GET /api/public/categories - Customer storefront categories
router.get('/categories', (req, res) => {
  return res.json(db.categories.filter(c => c.isActive));
});

// GET /api/public/banners - Active banners
router.get('/banners', (req, res) => {
  return res.json(db.banners.filter(b => b.isActive));
});

// POST /api/public/orders - Customer places an order on shared marketplace database
router.post('/orders', (req, res) => {
  const { customerId, items, shippingAddress, paymentMethod } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order items are required' });
  }

  const customer = db.customers.find(c => c.id === customerId) || db.customers[0];

  let subtotal = 0;
  let commissionTotal = 0;
  const orderItems = [];

  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) continue;

    const qty = parseInt(item.quantity, 10) || 1;
    const itemSub = prod.price * qty;
    subtotal += itemSub;

    // Deduct stock
    prod.stock = Math.max(0, prod.stock - qty);
    prod.salesCount += qty;

    const seller = db.sellers.find(s => s.id === prod.sellerId);
    const commRate = (seller?.commissionRate || 10) / 100;
    commissionTotal += itemSub * commRate;

    orderItems.push({
      id: `oi-${Date.now()}-${Math.random()}`,
      productId: prod.id,
      title: prod.title,
      sku: prod.sku,
      image: prod.images[0] || '',
      price: prod.price,
      quantity: qty,
      sellerId: prod.sellerId,
      sellerName: prod.sellerName
    });
  }

  const tax = Number((subtotal * 0.085).toFixed(2));
  const shippingFee = subtotal > 75 ? 0 : 5.99;
  const total = Number((subtotal + tax + shippingFee).toFixed(2));

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: `MK-${Math.floor(10000 + Math.random() * 90000)}`,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    items: orderItems,
    subtotal,
    tax,
    shippingFee,
    discount: 0,
    total,
    commissionTotal: Number(commissionTotal.toFixed(2)),
    status: 'pending',
    paymentStatus: 'paid',
    paymentMethod: paymentMethod || 'credit_card',
    paymentTransactionId: `ch_stripe_${Math.floor(10000000 + Math.random() * 90000000)}`,
    shippingAddress: shippingAddress || customer.shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // Update customer stats
  customer.totalOrders += 1;
  customer.totalSpent += total;

  return res.status(201).json({
    success: true,
    order: newOrder,
    message: 'Order placed successfully and recorded in shared marketplace database.'
  });
});

export default router;
