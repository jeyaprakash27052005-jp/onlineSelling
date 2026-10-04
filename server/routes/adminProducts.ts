import express from 'express';
import { db } from '../db.js';
import { authenticateAdmin, requirePermission, AuthenticatedAdminRequest } from '../auth.js';
import { Product, Category } from '../types.js';

const router = express.Router();

// GET /api/admin/products - List with search, filter, pagination
router.get('/', authenticateAdmin, requirePermission('products:view'), (req, res) => {
  const { search, category, status, featured, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  let filtered = [...db.products];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      p.sellerName.toLowerCase().includes(s)
    );
  }

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.categoryId === category);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(p => p.status === status);
  }

  if (featured === 'true') {
    filtered = filtered.filter(p => p.isFeatured);
  }

  // Sort
  filtered.sort((a, b) => {
    let valA = (a as any)[sortBy as string];
    let valB = (b as any)[sortBy as string];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = filtered.length;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    products: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// POST /api/admin/products - Create/Add Product
router.post('/', authenticateAdmin, requirePermission('products:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { title, sku, sellerId, categoryId, price, stock, description, images, isFeatured, subCategoryName } = req.body;

  if (!title || !price || !categoryId) {
    return res.status(400).json({ error: 'Title, price, and category are required' });
  }

  const seller = db.sellers.find(s => s.id === sellerId) || db.sellers[0];
  const category = db.categories.find(c => c.id === categoryId);

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title,
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    sellerId: seller.id,
    sellerName: seller.storeName,
    categoryId,
    categoryName: category?.name || 'Uncategorized',
    subCategoryName: subCategoryName || '',
    price: parseFloat(price),
    stock: parseInt(stock, 10) || 0,
    lowStockThreshold: 5,
    status: 'active',
    isFeatured: Boolean(isFeatured),
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
    description: description || '',
    rating: 5.0,
    reviewCount: 0,
    salesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  if (category) category.productCount += 1;

  db.logAudit(
    req.adminUser!,
    'CREATE_PRODUCT',
    'Products',
    `Created listing "${newProduct.title}" (SKU: ${newProduct.sku})`,
    newProduct.id,
    newProduct.title,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json(newProduct);
});

// PUT /api/admin/products/:id - Edit Product
router.put('/:id', authenticateAdmin, requirePermission('products:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const productIndex = db.products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existing = db.products[productIndex];
  const updated: Product = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.products[productIndex] = updated;

  db.logAudit(
    req.adminUser!,
    'EDIT_PRODUCT',
    'Products',
    `Updated product "${updated.title}" pricing/stock/details.`,
    updated.id,
    updated.title,
    req.ip || '127.0.0.1'
  );

  return res.json(updated);
});

// POST /api/admin/products/:id/approve - Approve listing
router.post('/:id/approve', authenticateAdmin, requirePermission('products:approve'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.status = 'active';
  delete product.rejectionReason;
  product.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'APPROVE_PRODUCT',
    'Products',
    `Approved seller listing "${product.title}" for public catalog`,
    product.id,
    product.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, product });
});

// POST /api/admin/products/:id/reject - Reject listing
router.post('/:id/reject', authenticateAdmin, requirePermission('products:approve'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.status = 'rejected';
  product.rejectionReason = reason || 'Listing does not adhere to marketplace guidelines';
  product.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'REJECT_PRODUCT',
    'Products',
    `Rejected listing "${product.title}". Reason: ${product.rejectionReason}`,
    product.id,
    product.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, product });
});

// POST /api/admin/products/:id/toggle-featured
router.post('/:id/toggle-featured', authenticateAdmin, requirePermission('products:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.isFeatured = !product.isFeatured;
  product.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'FEATURE_PRODUCT',
    'Products',
    `${product.isFeatured ? 'Featured' : 'Unfeatured'} product "${product.title}"`,
    product.id,
    product.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, isFeatured: product.isFeatured });
});

// POST /api/admin/products/:id/toggle-hide
router.post('/:id/toggle-hide', authenticateAdmin, requirePermission('products:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.status = product.status === 'hidden' ? 'active' : 'hidden';
  product.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'HIDE_PRODUCT',
    'Products',
    `Changed status of "${product.title}" to ${product.status}`,
    product.id,
    product.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, status: product.status });
});

// POST /api/admin/products/:id/stock - Quick adjust stock
router.post('/:id/stock', authenticateAdmin, requirePermission('products:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const { adjustment, newStock } = req.body;
  const product = db.products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const oldStock = product.stock;
  if (newStock !== undefined) {
    product.stock = Math.max(0, parseInt(newStock, 10));
  } else if (adjustment !== undefined) {
    product.stock = Math.max(0, product.stock + parseInt(adjustment, 10));
  }
  product.updatedAt = new Date().toISOString();

  db.logAudit(
    req.adminUser!,
    'ADJUST_STOCK',
    'Products',
    `Adjusted stock for "${product.title}" from ${oldStock} to ${product.stock}`,
    product.id,
    product.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, stock: product.stock });
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', authenticateAdmin, requirePermission('products:delete'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const removed = db.products.splice(index, 1)[0];

  db.logAudit(
    req.adminUser!,
    'DELETE_PRODUCT',
    'Products',
    `Deleted product "${removed.title}" (SKU: ${removed.sku})`,
    removed.id,
    removed.title,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, message: 'Product deleted successfully' });
});

// POST /api/admin/products/bulk-upload - Parse CSV rows and insert products
router.post('/bulk-upload', authenticateAdmin, requirePermission('products:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { csvData } = req.body;

  if (!csvData || typeof csvData !== 'string') {
    return res.status(400).json({ error: 'Invalid CSV data' });
  }

  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV file is empty or missing headers' });
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const createdProducts: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (!values[0]) continue;

    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx];
    });

    const category = db.categories.find(c => c.name.toLowerCase() === (rowObj['category'] || '').toLowerCase()) || db.categories[0];
    const seller = db.sellers[0];

    const prod: Product = {
      id: `prod-bulk-${Date.now()}-${i}`,
      title: rowObj['title'] || `Imported Item ${i}`,
      sku: rowObj['sku'] || `IMP-${Date.now().toString().slice(-4)}-${i}`,
      sellerId: seller.id,
      sellerName: seller.storeName,
      categoryId: category.id,
      categoryName: category.name,
      subCategoryName: rowObj['subcategory'] || '',
      price: parseFloat(rowObj['price']) || 29.99,
      compareAtPrice: rowObj['compareprice'] ? parseFloat(rowObj['compareprice']) : undefined,
      stock: parseInt(rowObj['stock'], 10) || 10,
      lowStockThreshold: 5,
      status: 'active',
      isFeatured: false,
      images: [rowObj['imageurl'] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
      description: rowObj['description'] || 'Bulk imported catalog product',
      rating: 5.0,
      reviewCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.products.unshift(prod);
    createdProducts.push(prod);
  }

  db.logAudit(
    req.adminUser!,
    'BULK_CSV_IMPORT',
    'Products',
    `Bulk imported ${createdProducts.length} listings via CSV upload`,
    undefined,
    undefined,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    importedCount: createdProducts.length,
    products: createdProducts
  });
});

// --- Category Routes ---

// GET /api/admin/categories
router.get('/categories/all', authenticateAdmin, (req, res) => {
  return res.json(db.categories);
});

// POST /api/admin/categories
router.post('/categories', authenticateAdmin, requirePermission('categories:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { name, description, image, commissionRate, subcategories } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name,
    slug,
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&auto=format&fit=crop&q=80',
    commissionRate: parseFloat(commissionRate) || 10.0,
    productCount: 0,
    isActive: true,
    subcategories: Array.isArray(subcategories)
      ? subcategories.map((sub: any, idx: number) => ({
          id: `sub-${Date.now()}-${idx}`,
          name: typeof sub === 'string' ? sub : sub.name,
          slug: (typeof sub === 'string' ? sub : sub.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          productCount: 0
        }))
      : []
  };

  db.categories.push(newCat);

  db.logAudit(
    req.adminUser!,
    'CREATE_CATEGORY',
    'Categories',
    `Created marketplace category "${newCat.name}" with default commission ${newCat.commissionRate}%`,
    newCat.id,
    newCat.name,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json(newCat);
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', authenticateAdmin, requirePermission('categories:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const existing = db.categories[index];
  const updated: Category = {
    ...existing,
    ...req.body
  };

  db.categories[index] = updated;

  db.logAudit(
    req.adminUser!,
    'EDIT_CATEGORY',
    'Categories',
    `Updated category "${updated.name}" settings`,
    updated.id,
    updated.name,
    req.ip || '127.0.0.1'
  );

  return res.json(updated);
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', authenticateAdmin, requirePermission('categories:manage'), (req: AuthenticatedAdminRequest, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const removed = db.categories.splice(index, 1)[0];

  db.logAudit(
    req.adminUser!,
    'DELETE_CATEGORY',
    'Categories',
    `Deleted category "${removed.name}"`,
    removed.id,
    removed.name,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, message: 'Category deleted' });
});

export default router;
