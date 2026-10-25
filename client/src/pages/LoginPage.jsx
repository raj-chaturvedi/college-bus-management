import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import {
  Bus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get('expired') === 'true';
  const justRegistered = searchParams.get('registered') === 'true';
  const registeredUsername = searchParams.get('username') || '';
  const redirectDestination = searchParams.get('redirect') || '/dashboard';

  const [username, setUsername] = useState(registeredUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (registeredUsername) {
      setUsername(registeredUsername);
    }
  }, [registeredUsername]);

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSubmitting(true);
      setError('');
      try {
        await loginWithGoogle({ access_token: tokenResponse.access_token });
        navigate(redirectDestination, { replace: true });
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Google Sign-In failed. Please try again.';
        setError(errorMsg);
      } finally {
        setSubmitting(false);
      }
    },
    onError: (err) => {
      if (err?.error !== 'popup_closed_by_user') {
        setError('Google Sign-In was cancelled or failed.');
      }
    }
  });

  const handleGoogleSignIn = () => {
    setError('');
    if (!googleClientId || googleClientId === 'unconfigured') {
      setError('Google Sign-In is temporarily unavailable. Missing Google Client ID configuration.');
      return;
    }
    triggerGoogleLogin();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setError('Please provide your username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(cleanUsername, password);
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>
        <p className="text-xs text-slate-500 mt-1">
          Welcome back. Enter your credentials to access your account.
        </p>
      </div>

      {/* Account Created Success Banner */}
      {justRegistered && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Account created successfully. Please sign in with your credentials.</span>
        </div>
      )}

      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Continue with Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-3 h-10 px-4 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg transition shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-slate-400 font-medium">or continue with credentials</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5" htmlFor="login-username">
            Username
          </label>
          <input
            id="login-username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={submitting}
            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-700" htmlFor="login-password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-sky-600 hover:text-sky-700 font-medium hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              className="w-full h-10 pl-3 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-10 mt-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium text-sm rounded-lg transition shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Bottom Switch Link */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline">
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
}
