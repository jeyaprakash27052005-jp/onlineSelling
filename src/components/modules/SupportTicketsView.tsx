import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Search,
  Filter,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Store,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { SupportTicket } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SupportTicketsView: React.FC = () => {
  const { admin, hasPermission } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSupportTickets({
        status: statusFilter,
        priority: priorityFilter,
      });
      setTickets(res);
      if (res.length > 0 && !selectedTicket) {
        setSelectedTicket(res[0]);
      } else if (selectedTicket) {
        const updated = res.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load tickets' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const res = await api.replySupportTicket(selectedTicket.id, replyMessage, isInternalNote);
      setSelectedTicket(res.ticket);
      setReplyMessage('');
      setFeedback({
        type: 'success',
        message: isInternalNote ? 'Internal note added to case file' : 'Reply sent to user',
      });
      loadTickets();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.updateTicketStatus(selectedTicket.id, status);
      setSelectedTicket(res.ticket);
      setFeedback({ type: 'success', message: `Ticket status set to ${status.toUpperCase()}` });
      loadTickets();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Support & Help Desk</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Resolve customer inquiries, order dispatch issues, and seller payout questions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
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

      {/* Two Column Layout: Ticket List & Conversation Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px]">
        {/* Left Column: List */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-neutral-800 text-xs text-neutral-400 font-semibold uppercase tracking-wider bg-neutral-950/60">
            Active Tickets ({tickets.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const priorityColor =
                t.priority === 'urgent'
                  ? 'text-rose-400 bg-rose-500/10'
                  : t.priority === 'high'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-neutral-400 bg-neutral-800';

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full text-left p-4 transition-colors flex flex-col justify-between ${
                    isSelected ? 'bg-neutral-800/80 border-l-2 border-indigo-500' : 'hover:bg-neutral-850/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-neutral-400 text-[11px] font-bold">
                        #{t.ticketNumber}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${priorityColor}`}>
                        {t.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white mt-1 line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                      {t.userType === 'seller' ? (
                        <Store className="w-3 h-3 text-indigo-400" />
                      ) : (
                        <User className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>{t.userName}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span className="capitalize">{t.category.replace('_', ' ')}</span>
                    <span className="uppercase text-neutral-400 font-bold">{t.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Conversation Thread */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
          {selectedTicket ? (
            <>
              {/* Top Details */}
              <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      #{selectedTicket.ticketNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Requester: <strong>{selectedTicket.userName}</strong> ({selectedTicket.userType})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono uppercase focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/30">
                {selectedTicket.messages.map((m) => {
                  const isAgent = m.sender === 'agent';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-1">
                        {m.isInternalNote && <Lock className="w-3 h-3 text-amber-400" />}
                        <span className="font-semibold text-neutral-300">{m.senderName}</span>
                        <span>·</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-xl text-xs max-w-md ${
                          m.isInternalNote
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                            : isAgent
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-800 text-neutral-200'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-neutral-800 bg-neutral-950/80">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internalNoteCheck"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-neutral-800 text-amber-500 focus:ring-amber-500 bg-neutral-950"
                    />
                    <label htmlFor="internalNoteCheck" className="text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Post as Internal Staff Note (hidden from buyer/seller)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={isInternalNote ? 'Type private staff note...' : 'Type message to user...'}
                    className="flex-1 px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 text-white transition-colors ${
                      isInternalNote ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">
              Select a ticket to review conversation thread
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
