import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

// Optional wrapper for useGoogleLogin when Client ID is configured
function GoogleLoginTrigger({ onCredentialSuccess, onError, showSetupModal }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // If Client ID is set, enable real Google OAuth account chooser popup
  const loginWithGoogleGIS = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Send access token or fetch id_token / profile
        const credential = tokenResponse.access_token;
        // Fetch user info from Google endpoint with verified access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` }
        });
        const profile = await userInfoRes.json();
        
        // Pass verified profile credentials to backend
        await onCredentialSuccess({
          credential,
          email: profile.email,
          name: profile.name,
          sub: profile.sub
        });
      } catch (err) {
        onError(err.message || 'Failed to authenticate with Google identity provider.');
      }
    },
    onError: (err) => {
      onError('Google Sign-In popup was closed or canceled.');
    }
  });

  const handleClick = () => {
    if (!googleClientId) {
      showSetupModal();
    } else {
      loginWithGoogleGIS();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2.5 group"
    >
      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>Continue with Google</span>
    </button>
  );
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get('expired') === 'true';
  const redirectDestination = searchParams.get('redirect') || '/dashboard';
  const justVerified = searchParams.get('verified') === 'true';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [showOAuthModal, setShowOAuthModal] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsUnverified(false);
    setResendSuccess('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError('Please provide your username or email, and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(cleanIdentifier, password);
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      if (err.isUnverified) {
        setIsUnverified(true);
        setUnverifiedEmail(err.email || cleanIdentifier);
        setError('Please verify your email address before signing in.');
      } else {
        setError(err.message || 'Invalid username/email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (googleAuthPayload) => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle(googleAuthPayload);
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendingEmail(true);
    setResendSuccess('');
    try {
      await authAPI.resendVerification({ email: unverifiedEmail });
      setResendSuccess('A fresh verification link has been sent to your email.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Quick fill demo helper for immediate 1-second testing
  const fillCredentials = (userVal, passVal) => {
    setIdentifier(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <AuthLayout activeTab="login">
      {/* Title Header */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-bold uppercase tracking-wider mb-2.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Portal</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your live transit dashboard, digital boarding token, and route planner.
        </p>
      </div>

      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Your session has expired. Please sign in to resume your active route.</span>
        </div>
      )}

      {/* Email Just Verified Banner */}
      {justVerified && (
        <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>Account verified successfully! You can now sign in with your credentials.</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-medium">{error}</span>
            {isUnverified && (
              <div className="mt-2 pt-2 border-t border-rose-200">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="font-semibold text-rose-700 underline hover:text-rose-900 transition disabled:opacity-50 text-xs"
                >
                  {resendingEmail ? 'Sending verification...' : 'Resend verification link'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resend Success Message */}
      {resendSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>{resendSuccess}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username or Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-identifier">
            Username or Email Address
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="login-identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. rajchaturvedi or admin@college.edu"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="login-password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[#0F766E] hover:text-[#115E59] hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button (Teal #0F766E) */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-teal-900/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Transit Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Fill Demo Accounts Pill Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            1-Click Test Credentials
          </span>
          <span className="text-[10px] font-normal text-slate-400">Click to fill</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => fillCredentials('student', 'student123')}
            className="text-[11px] py-1 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0F766E] font-medium transition"
          >
            Student: <strong>student</strong>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('rajchaturvedi', 'student123')}
            className="text-[11px] py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition"
          >
            Student: <strong>rajchaturvedi</strong>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('admin', 'admin123')}
            className="text-[11px] py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium transition"
          >
            Admin: <strong>admin</strong>
          </button>
        </div>
      </div>

      {/* Google Sign In Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Google Sign In Button */}
      <GoogleLoginTrigger
        onCredentialSuccess={handleGoogleSuccess}
        onError={(msg) => setError(msg)}
        showSetupModal={() => setShowOAuthModal(true)}
      />

      {/* Create Account Link */}
      <div className="mt-5 text-center text-xs text-slate-600">
        New commuter?{' '}
        <Link to="/register" className="font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline transition">
          Create account (Username &amp; Password only)
        </Link>
      </div>

      {/* Google OAuth Configuration Guide Modal */}
      {showOAuthModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowOAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-[#0F766E] mb-3">
              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Google Sign-In Configuration</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              To activate live Google Sign-In with real Google accounts on this machine:
            </p>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 font-sans">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#0F766E]">1.</span>
                <span>Open <strong>Google Cloud Console</strong> &rarr; APIs &amp; Services &rarr; Credentials.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#0F766E]">2.</span>
                <span>Create an <strong>OAuth 2.0 Web Client ID</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#0F766E]">3.</span>
                <span>Set <strong>Authorized JavaScript origins</strong> to: <code className="px-1.5 py-0.5 rounded bg-white border font-mono text-[11px] text-teal-800">http://localhost:5173</code></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#0F766E]">4.</span>
                <span>Add your Client ID to <code className="font-mono text-[11px]">client/.env</code> as: <code className="px-1.5 py-0.5 rounded bg-white border font-mono text-[11px] text-teal-800">VITE_GOOGLE_CLIENT_ID=...</code></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-5">
              In the meantime, you can sign in directly using the 1-click test credentials above or register a new username!
            </p>

            <button
              type="button"
              onClick={() => setShowOAuthModal(false)}
              className="w-full py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold rounded-xl transition shadow"
            >
              Got it, continue with username
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
