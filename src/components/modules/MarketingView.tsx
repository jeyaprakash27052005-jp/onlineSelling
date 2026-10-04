import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Tag,
  Send,
  Bell,
  Mail,
  Calendar,
  Percent,
  DollarSign,
  Image as ImageIcon,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { Coupon, PromotionalBanner } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const MarketingView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [activeTab, setActiveTab] = useState<'coupons' | 'banners' | 'broadcast'>('coupons');
  const [isLoading, setIsLoading] = useState(true);

  // New Coupon Form Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('15');
  const [couponMinSpend, setCouponMinSpend] = useState('50');
  const [couponExpiry, setCouponExpiry] = useState('2026-12-31');

  // New Banner Form Modal
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('/');
  const [bannerPosition, setBannerPosition] = useState<any>('hero_main');

  // Broadcast campaign form
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastChannel, setBroadcastChannel] = useState('email');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'coupon' | 'banner'; id: string; name: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cRes, bRes] = await Promise.all([api.getCoupons(), api.getBanners()]);
      setCoupons(cRes);
      setBanners(bRes);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load marketing tools' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCoupon({
        code: couponCode,
        type: couponType,
        value: parseFloat(couponValue),
        minPurchaseAmount: parseFloat(couponMinSpend),
        endDate: couponExpiry,
        usageLimit: 500,
      });
      setFeedback({ type: 'success', message: `Promotional coupon "${couponCode.toUpperCase()}" created!` });
      setShowCouponModal(false);
      setCouponCode('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBanner({
        title: bannerTitle,
        subtitle: bannerSubtitle,
        imageUrl: bannerImageUrl,
        linkUrl: bannerLinkUrl,
        position: bannerPosition,
      });
      setFeedback({ type: 'success', message: `Promotional banner published!` });
      setShowBannerModal(false);
      setBannerTitle('');
      setBannerImageUrl('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'coupon') {
        await api.deleteCoupon(deleteTarget.id);
        setFeedback({ type: 'success', message: `Coupon deleted.` });
      } else {
        await api.deleteBanner(deleteTarget.id);
        setFeedback({ type: 'success', message: `Banner removed.` });
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBroadcastSending(true);
      const res = await api.sendBroadcastNotification({
        targetAudience: broadcastTarget,
        channel: broadcastChannel,
        title: broadcastTitle,
        message: broadcastMessage,
      });
      setFeedback({ type: 'success', message: res.message });
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setBroadcastSending(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Marketing & Growth Campaigns</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create promotional discount vouchers, configure storefront hero banners and broadcast notifications.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'coupons' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Coupons ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'banners' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Banners ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'broadcast' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Send Broadcast
          </button>
        </div>
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

      {/* Tab 1: Coupons */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              Active promotional discount codes redeemed at storefront checkout.
            </div>
            {hasPermission('marketing:manage') && (
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono text-base font-extrabold text-white tracking-wider">
                        {c.code}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-semibold">
                      Active
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1 text-2xl font-bold font-mono text-white">
                    <span>{c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}</span>
                    <span className="text-xs text-neutral-400 font-sans font-normal">discount</span>
                  </div>

                  <div className="mt-2 text-xs text-neutral-400 space-y-0.5">
                    <div>Min. Purchase: ${c.minPurchaseAmount.toFixed(2)}</div>
                    <div>Valid Until: {c.endDate}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span>
                    Used: {c.usedCount} / {c.usageLimit}
                  </span>
                  {hasPermission('marketing:manage') && (
                    <button
                      onClick={() => setDeleteTarget({ type: 'coupon', id: c.id, name: c.code })}
                      className="p-1 text-neutral-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Banners */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              High-resolution hero and promotional slots featured across the customer storefront.
            </div>
            {hasPermission('marketing:manage') && (
              <button
                onClick={() => setShowBannerModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Banner</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors"
              >
                <div className="h-44 w-full relative">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold">
                      {b.position.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{b.title}</h3>
                    <p className="text-xs text-neutral-300">{b.subtitle}</p>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-mono text-[11px] truncate max-w-[200px]">Link: {b.linkUrl}</span>
                  {hasPermission('marketing:manage') && (
                    <button
                      onClick={() => setDeleteTarget({ type: 'banner', id: b.id, name: b.title })}
                      className="p-1 text-neutral-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Broadcast Notifications */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Broadcast Campaign Push / Email</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Dispatch announcements, flash sale alerts, or seasonal updates directly to registered buyers and vendor merchants.
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Target Audience</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Registered Users (Buyers & Sellers)</option>
                  <option value="customers">Customers / Buyers Only</option>
                  <option value="sellers">Vendors / Sellers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Delivery Channel</label>
                <select
                  value={broadcastChannel}
                  onChange={(e) => setBroadcastChannel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="email">Email Broadcast (SendGrid / SMTP)</option>
                  <option value="push">Mobile & Web Push Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Campaign Title / Subject</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Flash 48-Hour Weekend Event: Up to 40% Off Select Watches"
                className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Message Content</label>
              <textarea
                rows={4}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write your announcement or coupon instructions..."
                className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={broadcastSending}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {broadcastSending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Campaign Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Delete Item Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.type === 'coupon' ? 'Coupon' : 'Banner'}`}
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
        confirmLabel="Confirm Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white mb-4">Create Promotional Voucher</h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH25"
                  className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Min Spend ($)</label>
                  <input
                    type="number"
                    value={couponMinSpend}
                    onChange={(e) => setCouponMinSpend(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white mb-4">Add Promotional Banner</h3>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Modern Ceramics Spring Release"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted stoneware curated for modern interiors"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Display Position</label>
                <select
                  value={bannerPosition}
                  onChange={(e) => setBannerPosition(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="hero_main">Hero Main Carousel</option>
                  <option value="top_strip">Top Promotional Strip</option>
                  <option value="middle_grid">Category Grid Feature</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Publish Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
