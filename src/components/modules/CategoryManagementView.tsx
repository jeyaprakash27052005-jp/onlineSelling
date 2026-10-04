import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Tag, Percent, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const CategoryManagementView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [commissionRate, setCommissionRate] = useState('10.0');
  const [subcategoriesText, setSubcategoriesText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCategories();
      setCategories(res);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch categories' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setSelectedCat(null);
    setName('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600');
    setCommissionRate('10.0');
    setSubcategoriesText('Subcategory 1, Subcategory 2');
    setModalType('create');
  };

  const openEditModal = (cat: Category) => {
    setSelectedCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setImage(cat.image);
    setCommissionRate(String(cat.commissionRate));
    setSubcategoriesText(cat.subcategories.map((s) => s.name).join(', '));
    setModalType('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const subsArray = subcategoriesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (modalType === 'edit' && selectedCat) {
        await api.updateCategory(selectedCat.id, {
          name,
          description,
          image,
          commissionRate: parseFloat(commissionRate),
          subcategories: subsArray.map((s, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            name: s,
            slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            productCount: 0,
          })),
        });
        setFeedback({ type: 'success', message: `Category "${name}" updated!` });
      } else {
        await api.createCategory({
          name,
          description,
          image,
          commissionRate: parseFloat(commissionRate),
          subcategories: subsArray.map((s, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            name: s,
            slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            productCount: 0,
          })),
        });
        setFeedback({ type: 'success', message: `Category "${name}" added to marketplace catalog!` });
      }
      setModalType(null);
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCat) return;
    try {
      await api.deleteCategory(selectedCat.id);
      setFeedback({ type: 'success', message: `Category deleted.` });
      setModalType(null);
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Categories & Commission Rates</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure marketplace department taxonomies, subcategories, and default seller fee overrides.
          </p>
        </div>

        {hasPermission('categories:manage') && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-neutral-200">
            ✕
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-400">
            Loading categories...
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition-colors"
            >
              <div>
                {/* Image Banner */}
                <div className="h-32 w-full relative overflow-hidden bg-neutral-950">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-indigo-400" />
                    <span>{cat.commissionRate}% Commission</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white tracking-tight">{cat.name}</h3>
                    <span className="text-xs text-neutral-400 font-mono">{cat.productCount} listings</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-2">{cat.description}</p>

                  {/* Subcategories list */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                      Subcategories ({cat.subcategories.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {hasPermission('categories:manage') && (
                <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCat(cat);
                      setModalType('delete');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Category Modal */}
      <ConfirmationModal
        isOpen={modalType === 'delete'}
        title="Delete Marketplace Category"
        message={`Are you sure you want to remove "${selectedCat?.name}"? Listings currently assigned to this category may require reassignment.`}
        confirmLabel="Delete Category"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setModalType(null)}
      />

      {/* Add / Edit Modal */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white mb-4">
              {modalType === 'create' ? 'Create New Category' : `Edit ${selectedCat?.name}`}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fine Jewelry"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Default Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  value={subcategoriesText}
                  onChange={(e) => setSubcategoriesText(e.target.value)}
                  placeholder="e.g. Rings, Necklaces, Bracelets"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
