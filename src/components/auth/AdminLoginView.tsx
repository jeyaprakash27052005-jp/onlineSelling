import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@markethub.com');
  const [password, setPassword] = useState('admin123');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await login(email, password, requires2FA ? otp : undefined);
      if (res.requires2FA) {
        setRequires2FA(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (userEmail: string, userPass: string, has2FA = false) => {
    setEmail(userEmail);
    setPassword(userPass);
    setOtp(has2FA ? '123456' : '');
    setRequires2FA(has2FA);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Security Notice Pill */}
      <div className="mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
        <Shield className="w-3.5 h-3.5" />
        <span>Restricted Area · Authorized Marketplace Personnel Only</span>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            M
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">MarketHub Admin</h1>
            <p className="text-xs text-neutral-400">Enterprise Owner & Operations Console</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@markethub.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Password
              </label>
              <span className="text-[11px] text-neutral-500">Encrypted</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {requires2FA && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Two-Factor OTP Code
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">Demo: 123456</span>
              </div>
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 text-sm text-center font-mono tracking-widest bg-neutral-950 border border-indigo-700/60 rounded-lg text-indigo-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{requires2FA ? 'Verify 2FA & Access Dashboard' : 'Authenticate to Admin Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Staff Logins */}
        <div className="mt-8 pt-6 border-t border-neutral-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Quick Staff Profiles (Pre-seeded RBAC)
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => fillQuickCredentials('admin@markethub.com', 'admin123', false)}
              className="text-left p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-white">Elena Vance</span>
                <span className="text-neutral-400 ml-2">· Super Admin (Owner)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                Full Access
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('manager@markethub.com', 'manager123', true)}
              className="text-left p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-white">Marcus Sterling</span>
                <span className="text-neutral-400 ml-2">· Manager (2FA Active)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                Ops & Orders
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('support@markethub.com', 'support123', false)}
              className="text-left p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <span className="font-semibold text-white">Chloe Bennett</span>
                <span className="text-neutral-400 ml-2">· Support Agent</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
                Tickets & Care
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-500">
        MarketHub Engine · Separate Customer Login is hosted on the public storefront
      </div>
    </div>
  );
};
