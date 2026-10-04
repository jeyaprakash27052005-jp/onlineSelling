import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import route modules
import adminAuthRoutes from './server/routes/adminAuth.js';
import adminDashboardRoutes from './server/routes/adminDashboard.js';
import adminProductsRoutes from './server/routes/adminProducts.js';
import adminOrdersRoutes from './server/routes/adminOrders.js';
import adminCustomersRoutes from './server/routes/adminCustomers.js';
import adminSellersRoutes from './server/routes/adminSellers.js';
import adminPaymentsRoutes from './server/routes/adminPayments.js';
import adminMarketingRoutes from './server/routes/adminMarketing.js';
import adminReviewsRoutes from './server/routes/adminReviews.js';
import adminSupportRoutes from './server/routes/adminSupport.js';
import adminSettingsRoutes from './server/routes/adminSettings.js';
import customerRoutes from './server/routes/customerRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Documentation route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      marketplace: 'MarketHub Global',
      timestamp: new Date().toISOString()
    });
  });

  // Admin Routes (Guarded with JWT & Role verification)
  app.use('/api/admin/auth', adminAuthRoutes);
  app.use('/api/admin/dashboard', adminDashboardRoutes);
  app.use('/api/admin/products', adminProductsRoutes);
  app.use('/api/admin/orders', adminOrdersRoutes);
  app.use('/api/admin/customers', adminCustomersRoutes);
  app.use('/api/admin/sellers', adminSellersRoutes);
  app.use('/api/admin/payments', adminPaymentsRoutes);
  app.use('/api/admin/marketing', adminMarketingRoutes);
  app.use('/api/admin/reviews', adminReviewsRoutes);
  app.use('/api/admin/support', adminSupportRoutes);
  app.use('/api/admin/settings', adminSettingsRoutes);

  // Customer Routes (Shared database)
  app.use('/api/public', customerRoutes);

  // Vite Integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MarketHub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
