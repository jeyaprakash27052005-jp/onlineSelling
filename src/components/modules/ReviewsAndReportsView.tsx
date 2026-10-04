import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  Star,
  CheckCircle,
  EyeOff,
  Flag,
  CornerDownRight,
  AlertTriangle,
  Send,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Review, DisputeReport } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const ReviewsAndReportsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<DisputeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'disputes'>('reviews');

  // Reply modal
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Dispute resolution modal
  const [disputeTarget, setDisputeTarget] = useState<DisputeReport | null>(null);
  const [disputeStatus, setDisputeStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolutionNote, setResolutionNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [revRes, dispRes] = await Promise.all([api.getReviews(), api.getDisputes()]);
      setReviews(revRes);
      setDisputes(dispRes);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load reviews & disputes' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateReviewStatus = async (id: string, status: string) => {
    try {
      await api.updateReviewStatus(id, status);
      setFeedback({ type: 'success', message: `Review status changed to ${status.toUpperCase()}` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    try {
      await api.replyToReview(replyTarget.id, adminReplyText);
      setFeedback({ type: 'success', message: 'Official marketplace reply posted!' });
      setReplyTarget(null);
      setAdminReplyText('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTarget) return;
    try {
      await api.resolveDispute(disputeTarget.id, disputeStatus, resolutionNote);
      setFeedback({
        type: 'success',
        message: `Dispute marked as ${disputeStatus.toUpperCase()} with audit notes recorded.`,
      });
      setDisputeTarget(null);
      setResolutionNote('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Trust, Safety & Moderation</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Moderate community buyer reviews, respond to complaints, and resolve seller disputes.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'reviews' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Product Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'disputes' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Disputes & Reports ({disputes.filter((d) => d.status !== 'resolved').length} open)
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

      {/* Tab 1: Product Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950/70 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Rating & Review</th>
                <th className="py-3 px-4">Target Product</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-850/50 transition-colors">
                  {/* Rating & text */}
                  <td className="py-3 px-4 max-w-sm">
                    <div className="flex items-center gap-1 text-amber-400 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-[11px] font-mono text-neutral-400">
                        {r.rating}.0
                      </span>
                    </div>
                    <p className="text-neutral-200 italic leading-snug">"{r.comment}"</p>

                    {r.adminReply && (
                      <div className="mt-2 p-2 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-indigo-300">
                        <span className="font-semibold text-indigo-400">Admin Response:</span> {r.adminReply}
                      </div>
                    )}
                  </td>

                  {/* Product */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-white truncate max-w-[200px]">{r.productTitle}</div>
                    <div className="text-[11px] text-neutral-500">Seller: {r.sellerName}</div>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div className="text-neutral-300 font-medium">{r.customerName}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {r.status === 'approved' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase font-semibold">
                        Approved
                      </span>
                    )}
                    {r.status === 'flagged' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-semibold">
                        Flagged
                      </span>
                    )}
                    {r.status === 'hidden' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono uppercase font-semibold">
                        Hidden
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {hasPermission('reviews:moderate') && (
                        <>
                          <button
                            onClick={() => handleUpdateReviewStatus(r.id, 'approved')}
                            title="Approve Review"
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateReviewStatus(r.id, 'flagged')}
                            title="Flag Review"
                            className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateReviewStatus(r.id, 'hidden')}
                            title="Hide Review"
                            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setReplyTarget(r);
                              setAdminReplyText(r.adminReply || '');
                            }}
                            title="Post Official Response"
                            className="p-1.5 text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                          >
                            <CornerDownRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Disputes & Reports */}
      {activeTab === 'disputes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="font-mono text-[11px] uppercase font-bold text-rose-300">
                      {d.reason.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${
                      d.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : d.status === 'under_review'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {d.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-2">{d.targetTitle}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{d.description}</p>

                <div className="mt-3 text-[11px] text-neutral-500">
                  Reported by: <strong>{d.reporterName}</strong> ({d.reporterEmail})
                </div>

                {d.resolutionNote && (
                  <div className="mt-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-emerald-300">
                    <div className="font-semibold text-emerald-400 text-[10px] uppercase">
                      Administrative Resolution:
                    </div>
                    {d.resolutionNote}
                  </div>
                )}
              </div>

              {hasPermission('disputes:resolve') && d.status !== 'resolved' && (
                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setDisputeTarget(d);
                      setResolutionNote('');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Resolve Dispute
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Reply to Review Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white">Post Official Admin Reply</h3>
            <p className="text-xs text-neutral-400 mt-1">Review on "{replyTarget.productTitle}"</p>

            <form onSubmit={handleSendAdminReply} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Public Response Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Thank you for your feedback..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {disputeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white">Resolve Dispute or Report</h3>
            <p className="text-xs text-neutral-400 mt-1">{disputeTarget.targetTitle}</p>

            <form onSubmit={handleResolveDispute} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Decision Status</label>
                <select
                  value={disputeStatus}
                  onChange={(e) => setDisputeStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="resolved">Resolved (Issue Addressed / Seller Warned)</option>
                  <option value="dismissed">Dismissed (No Violation Found)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Audit Resolution Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Verified seller tracking proof; seller was acquitted..."
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setDisputeTarget(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
