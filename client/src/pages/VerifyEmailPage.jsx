import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import { MailCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || searchParams.get('code') || '';
  const emailFromUrl = searchParams.get('email') || '';
  const navigate = useNavigate();

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(emailFromUrl);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const extractTokenOrCode = (raw) => {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (trimmed.includes('token=') || trimmed.includes('code=')) {
      try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `http://localhost/${trimmed}`);
        const extracted = urlObj.searchParams.get('token') || urlObj.searchParams.get('code');
        if (extracted) return extracted;
      } catch {
        const m = trimmed.match(/(?:token|code)=([a-zA-Z0-9]+)/);
        if (m) return m[1];
      }
    }
    return trimmed;
  };

  const executeVerification = async (rawInput) => {
    const cleanTok = extractTokenOrCode(rawInput);
    if (!cleanTok) return;
    setStatus('verifying');
    setMessage('');
    try {
      const res = await authAPI.verifyEmail({ token: cleanTok });
      setStatus('success');
      setMessage(res.data?.message || 'Email verified successfully! You can now log in.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.message || 'Verification link or 6-digit code is invalid or has expired.');
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      executeVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      executeVerification(tokenInput.trim());
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await authAPI.resendVerification({ email: resendEmail.trim() });
      setResendMsg(res.data?.message || 'A new verification email and code has been sent.');
    } catch (err) {
      setResendMsg('Could not resend email. Please verify the address.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout activeTab="verify-email">
      <div className="text-center space-y-4">
        {status === 'verifying' && (
          <div className="py-8 space-y-3">
            <Loader2 className="w-10 h-10 text-[#0F766E] animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Verifying Email...</h2>
            <p className="text-xs text-slate-500">Validating your activation token with the security server.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Email Verified!</h2>
              <p className="text-xs text-teal-800 mt-2 font-medium">{message}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/login?verified=true"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl transition shadow"
              >
                <span>Sign In to Transit Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Verification Link Expired</h2>
              <p className="text-xs text-rose-700 mt-1">{message}</p>
            </div>

            {/* Resend Verification Form */}
            <form onSubmit={handleResend} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="text-xs font-semibold text-slate-700">Request a new verification link:</div>
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Send Fresh Verification Link'}
              </button>
              {resendMsg && (
                <p className="text-[11px] text-[#0F766E] text-center font-medium">{resendMsg}</p>
              )}
            </form>

            <div className="pt-2">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 transition">
                &larr; Return to Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'idle' && !tokenFromUrl && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enter 6-Digit Code or Link</h2>
              <p className="text-xs text-slate-500 mt-1">
                Check your email. Enter the 6-digit code or paste the verification link below.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="token-input">
                  Verification Code or Link
                </label>
                <input
                  id="token-input"
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter 6-digit code (e.g. 849201) or paste link"
                  className="w-full px-3 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm font-mono text-center tracking-widest text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs rounded-xl transition shadow"
              >
                Verify &amp; Activate Account
              </button>
            </form>

            {/* Quick Resend Box */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[11px] text-slate-500 mb-2">
                Didn't receive the email? Check your <strong>Spam / Junk</strong> folder, or resend below:
              </p>
              <form onSubmit={handleResend} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter registered email"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </form>
              {resendMsg && (
                <p className="text-[11px] text-[#0F766E] text-center font-medium mt-1.5">{resendMsg}</p>
              )}
            </div>

            <div className="pt-2 text-xs text-slate-500">
              Need assistance?{' '}
              <Link to="/login" className="text-[#0F766E] hover:underline font-medium">
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
