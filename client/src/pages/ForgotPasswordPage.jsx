import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import {
  Bus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e, customRecovery = null) => {
    if (e) e.preventDefault();
    setError('');
    
    const clean = identifier.trim();
    const cleanRecovery = (customRecovery || recoveryEmail).trim();

    if (!clean && !cleanRecovery) {
      setError('Please provide your username or email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authAPI.forgotPassword({
        identifier: clean || cleanRecovery,
        recoveryEmail: cleanRecovery || undefined
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process recovery request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Brand Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Bus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-900 tracking-tight">
            College Bus Management
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Password recovery</h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered username or email address to receive recovery instructions.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Result Message */}
      {result ? (
        result.isUsernameOnly ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Recovery Email Needed</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {result.message}
            </p>
            
            {/* Quick Link Gmail option */}
            <div className="pt-2 border-t border-amber-200/60 mt-3 space-y-2">
              <label className="block text-[11px] font-semibold text-amber-900" htmlFor="quick-recovery-email">
                Send reset link directly to your Gmail:
              </label>
              <div className="flex gap-2">
                <input
                  id="quick-recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="Enter your Gmail address"
                  className="flex-1 h-9 px-3 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  disabled={submitting || !recoveryEmail.trim()}
                  onClick={() => handleSubmit(null, recoveryEmail)}
                  className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full h-9 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Recovery Instructions Dispatched</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {result.message}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full h-9 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5" htmlFor="forgot-identifier">
              Username or Registered Email
            </label>
            <input
              id="forgot-identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email address"
              disabled={submitting}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 mt-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium text-sm rounded-lg transition shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? 'Verifying account...' : 'Send reset instructions'}
          </button>
        </form>
      )}

      {/* Return Link */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
