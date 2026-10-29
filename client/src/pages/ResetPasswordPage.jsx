import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-200', text: 'text-slate-400', width: 'w-0' };
    let score = 0;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600', width: 'w-1/4' };
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600', width: 'w-2/4' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-teal-500', text: 'text-teal-700', width: 'w-3/4' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-700', width: 'w-full' };
  }, [newPassword]);

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Password reset token is required. Please use the link provided in your email.');
      return;
    }

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) {
      setError('Password must contain uppercase, lowercase, numbers, and symbols.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.resetPassword({
        token: token.trim(),
        password: newPassword,
        confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password reset failed or token expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout activeTab="reset-password">
      <div className="space-y-4">
        {/* Title Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security Reset</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose a strong, unique password for your transit commuter account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success ? (
          <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center text-[#0F766E]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Password Updated Successfully!</h3>
            <p className="text-xs text-slate-600">
              Your password has been changed. Your account is active and you can now sign in.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs rounded-xl transition shadow"
              >
                <span>Sign In Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!tokenFromUrl && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reset-token">
                  Reset Token
                </label>
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from reset email"
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="new-password">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className={`font-semibold ${strengthInfo.text}`}>{strengthInfo.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthInfo.color} ${strengthInfo.width}`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="confirm-new-password">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition font-mono ${
                    passwordsMatch
                      ? 'border-slate-300 focus:ring-[#0F766E]'
                      : 'border-rose-400 focus:ring-rose-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !passwordsMatch || newPassword.length < 8}
              className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl transition shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {submitting ? 'Updating Password...' : 'Save New Password & Sign In'}
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
