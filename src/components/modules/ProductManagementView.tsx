import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/exportCsv';
import { useAuth } from '../../context/AuthContext';

export const ProductManagementView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [modalAction, setModalAction] = useState<{
    type: 'delete' | 'reject' | 'stock' | 'bulk_csv' | 'add_product' | 'edit_product' | null;
    product?: Product;
  }>({ type: null });

  const [stockInput, setStockInput] = useState<number>(0);
  const [csvContent, setCsvContent] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    price: '',
    stock: '',
    categoryId: '',
    description: '',
    imageUrl: '',
    isFeatured: false,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({
          search: searchTerm,
          category: selectedCategory,
          status: selectedStatus,
          page,
          limit: 8,
        }),
        api.getCategories(),
      ]);

      setProducts(prodRes.products);
      setTotalPages(prodRes.pagination.totalPages);
      setTotalCount(prodRes.pagination.total);
      setCategories(catRes);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load products' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCategory, selectedStatus, page]);

  const handleApprove = async (product: Product) => {
    try {
      await api.approveProduct(product.id);
      setFeedback({ type: 'success', message: `Listing "${product.title}" has been approved!` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRejectConfirm = async (reason?: string) => {
    if (!modalAction.product) return;
    try {
      await api.rejectProduct(modalAction.product.id, reason || 'Non-compliant listing');
      setFeedback({ type: 'success', message: `Listing rejected with audit note recorded.` });
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!modalAction.product) return;
    try {
      await api.deleteProduct(modalAction.product.id);
      setFeedback({ type: 'success', message: `Listing "${modalAction.product.title}" deleted.` });
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleFeature = async (product: Product) => {
    try {
      const res = await api.toggleFeatureProduct(product.id);
      setFeedback({
        type: 'success',
        message: res.isFeatured ? `Featured on marketplace homepage` : `Removed from featured listings`,
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleHide = async (product: Product) => {
    try {
      const res = await api.toggleHideProduct(product.id);
      setFeedback({
        type: 'success',
        message: `Listing is now ${res.status.toUpperCase()}`,
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveStock = async () => {
    if (!modalAction.product) return;
    try {
      await api.adjustStock(modalAction.product.id, { newStock: stockInput });
      setFeedback({ type: 'success', message: `Stock level updated to ${stockInput}` });
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleBulkCsvUpload = async () => {
    if (!csvContent.trim()) {
      setFeedback({ type: 'error', message: 'CSV data is empty' });
      return;
    }
    try {
      const res = await api.bulkUploadProductsCSV(csvContent);
      setFeedback({
        type: 'success',
        message: `Successfully imported ${res.importedCount} products into database!`,
      });
      setModalAction({ type: null });
      setCsvContent('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalAction.type === 'edit_product' && modalAction.product) {
        await api.updateProduct(modalAction.product.id, {
          title: formData.title,
          sku: formData.sku,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          categoryId: formData.categoryId,
          description: formData.description,
          isFeatured: formData.isFeatured,
          images: formData.imageUrl ? [formData.imageUrl] : modalAction.product.images,
        });
        setFeedback({ type: 'success', message: `Product updated successfully` });
      } else {
        await api.createProduct({
          title: formData.title,
          sku: formData.sku,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          categoryId: formData.categoryId || categories[0]?.id,
          description: formData.description,
          isFeatured: formData.isFeatured,
          images: [formData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
        });
        setFeedback({ type: 'success', message: `Product listing published` });
      }
      setModalAction({ type: null });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleExportCsv = () => {
    const rows = products.map((p) => ({
      ID: p.id,
      Title: p.title,
      SKU: p.sku,
      Seller: p.sellerName,
      Category: p.categoryName,
      Price: p.price,
      Stock: p.stock,
      Status: p.status,
      Featured: p.isFeatured ? 'YES' : 'NO',
      SalesCount: p.salesCount,
      Rating: p.rating,
      CreatedDate: p.createdAt,
    }));
    exportToCsv('markethub_products_catalog', rows);
  };

  const sampleCsvTemplate = `title,sku,price,stock,category,imageurl,description
Sony WH-1000XM5,SNY-WH-50,398.00,15,Electronics & Audio,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800,Flagship wireless noise cancelling
Vintage Omega Seamaster,OMG-SEA-72,2400.00,1,Watches & Timepieces,https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800,Original 1972 dial automatic watch
Nordic Handwoven Throw,NOR-BLNK-01,75.00,20,Home & Living,https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800,100% Merino wool artisan blanket`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Product Catalog</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage multi-seller inventory, review submissions, modify stock and publish listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('products:manage') && (
            <>
              <button
                onClick={() => {
                  setFormData({
                    title: '',
                    sku: `SKU-${Date.now().toString().slice(-6)}`,
                    price: '49.99',
                    stock: '10',
                    categoryId: categories[0]?.id || '',
                    description: '',
                    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
                    isFeatured: false,
                  });
                  setModalAction({ type: 'add_product' });
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>

              <button
                onClick={() => setModalAction({ type: 'bulk_csv' })}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span>Bulk CSV Upload</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-200 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, SKU, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-neutral-400">
          Showing <strong className="text-white">{products.length}</strong> of {totalCount} listings
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category & Seller</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Inventory</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading products catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.stock <= p.lowStockThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-850/50 transition-colors">
                      {/* Product image & title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-12 h-12 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <div className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span>{p.title}</span>
                              {p.isFeatured && (
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                              SKU: {p.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Seller */}
                      <td className="py-3 px-4">
                        <div className="text-neutral-300 font-medium">{p.categoryName}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <span>Vendor:</span>
                          <span className="text-indigo-400 font-medium">{p.sellerName}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white">${p.price.toFixed(2)}</div>
                        {p.compareAtPrice && (
                          <div className="text-[10px] text-neutral-500 line-through">
                            ${p.compareAtPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-semibold ${
                              isLowStock ? 'text-amber-400' : 'text-neutral-200'
                            }`}
                          >
                            {p.stock} units
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                              LOW
                            </span>
                          )}
                        </div>
                        {hasPermission('products:manage') && (
                          <button
                            onClick={() => {
                              setStockInput(p.stock);
                              setModalAction({ type: 'stock', product: p });
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline mt-0.5 block"
                          >
                            Adjust stock
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {p.status === 'active' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-medium">
                            Active
                          </span>
                        )}
                        {p.status === 'pending_approval' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-semibold">
                            Pending Review
                          </span>
                        )}
                        {p.status === 'hidden' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono uppercase">
                            Hidden
                          </span>
                        )}
                        {p.status === 'rejected' && (
                          <span
                            title={p.rejectionReason}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono uppercase font-semibold cursor-help"
                          >
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Approve / Reject buttons for pending items */}
                          {p.status === 'pending_approval' && hasPermission('products:approve') && (
                            <>
                              <button
                                onClick={() => handleApprove(p)}
                                title="Approve Listing"
                                className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModalAction({ type: 'reject', product: p })}
                                title="Reject Listing with Reason"
                                className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Feature toggle */}
                          {hasPermission('products:manage') && (
                            <button
                              onClick={() => handleToggleFeature(p)}
                              title={p.isFeatured ? 'Unfeature listing' : 'Feature on homepage'}
                              className={`p-1.5 rounded-md transition-colors ${
                                p.isFeatured
                                  ? 'text-amber-400 hover:bg-amber-400/20'
                                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                              }`}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}

                          {/* Hide / Unhide */}
                          {hasPermission('products:manage') && (
                            <button
                              onClick={() => handleToggleHide(p)}
                              title={p.status === 'hidden' ? 'Make Active' : 'Hide from Storefront'}
                              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                            >
                              {p.status === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Edit */}
                          {hasPermission('products:manage') && (
                            <button
                              onClick={() => {
                                setFormData({
                                  title: p.title,
                                  sku: p.sku,
                                  price: String(p.price),
                                  stock: String(p.stock),
                                  categoryId: p.categoryId,
                                  description: p.description,
                                  imageUrl: p.images[0] || '',
                                  isFeatured: p.isFeatured,
                                });
                                setModalAction({ type: 'edit_product', product: p });
                              }}
                              title="Edit Listing"
                              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {hasPermission('products:delete') && (
                            <button
                              onClick={() => setModalAction({ type: 'delete', product: p })}
                              title="Delete Listing"
                              className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/40">
          <div>
            Page {page} of {Math.max(1, totalPages)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reject Listing Modal */}
      <ConfirmationModal
        isOpen={modalAction.type === 'reject'}
        title="Reject Listing Submission"
        message={`Specify the compliance violation or reason why "${modalAction.product?.title}" cannot be published on the marketplace.`}
        confirmLabel="Reject Listing"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="e.g. Counterfeit suspicion, blurred images, or prohibited accessory..."
        onConfirm={handleRejectConfirm}
        onClose={() => setModalAction({ type: null })}
      />

      {/* Delete Listing Modal */}
      <ConfirmationModal
        isOpen={modalAction.type === 'delete'}
        title="Delete Marketplace Listing"
        message={`Are you sure you want to permanently delete "${modalAction.product?.title}"? This cannot be undone and will remove it from search indices.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setModalAction({ type: null })}
      />

      {/* Stock Adjustment Modal */}
      {modalAction.type === 'stock' && modalAction.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white">Adjust Stock Level</h3>
            <p className="text-xs text-neutral-400 mt-1">{modalAction.product.title}</p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                New Available Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stockInput}
                onChange={(e) => setStockInput(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAction({ type: null })}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {modalAction.type === 'bulk_csv' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Bulk CSV Product Upload</h3>
              </div>
              <button
                onClick={() => setModalAction({ type: null })}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mt-3">
              Paste standard CSV rows below or load the template to batch import multiple seller listings directly into the shared catalog.
            </p>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">Format: title,sku,price,stock,category,imageurl,description</span>
              <button
                type="button"
                onClick={() => setCsvContent(sampleCsvTemplate)}
                className="text-xs text-indigo-400 hover:underline"
              >
                Load Sample Template
              </button>
            </div>

            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste comma-separated rows..."
              className="mt-2 w-full p-3 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAction({ type: null })}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkCsvUpload}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2"
              >
                <span>Parse & Import Items</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(modalAction.type === 'add_product' || modalAction.type === 'edit_product') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white mb-4">
              {modalAction.type === 'add_product' ? 'Add New Listing' : 'Edit Listing'}
            </h3>

            <form onSubmit={handleSaveProductForm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-neutral-800 text-indigo-600 focus:ring-indigo-500 bg-neutral-950"
                />
                <label htmlFor="featuredCheck" className="text-xs text-neutral-300">
                  Feature this listing on marketplace spotlight
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAction({ type: null })}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
