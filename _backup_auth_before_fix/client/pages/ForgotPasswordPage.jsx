import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import { KeyRound, ArrowLeft, User, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, Building2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setResult(null);

    const clean = identifier.trim();
    if (!clean) {
      setError('Please provide your username or email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authAPI.forgotPassword({ identifier: clean });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process recovery request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout activeTab="forgot-password">
      <div className="space-y-4">
        {/* Title Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Account Recovery</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">Forgot Password?</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered username or email address to recover your account credentials.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Result Message */}
        {result ? (
          result.isUsernameOnly ? (
            /* Username-only account guidance (as required by prompt) */
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-amber-950">In-Person Verification Required</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {result.message}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs rounded-xl transition shadow"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Email account reset link dispatched */
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center text-[#0F766E]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recovery Instructions Dispatched</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {result.message || 'If an eligible account exists, password recovery instructions have been sent to your email.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs rounded-xl transition shadow"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="forgot-identifier">
                Username or Email Address
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="forgot-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rajchaturvedi or admin@college.edu"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl transition shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {submitting ? 'Checking Transit Records...' : 'Send Password Reset Instructions'}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F766E] transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
