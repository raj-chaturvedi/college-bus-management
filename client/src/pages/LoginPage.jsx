import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { notifyUser, requestNotificationPermission } from '../utils/notification';
import {
  Bus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Sparkles
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
  const [notice, setNotice] = useState('');

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (registeredUsername) {
      setUsername(registeredUsername);
    }
  }, [registeredUsername]);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google Sign-In credential could not be resolved. Please try again.');
      return;
    }
    setSubmitting(true);
    setError('');
    requestNotificationPermission();
    try {
      const newUser = await loginWithGoogle({ credential: credentialResponse.credential });
      const alertEmail = newUser?.email || 'rajchaturvedi215@gmail.com';
      notifyUser({
        title: '🚨 Greater Noida Transit: Login Alert',
        body: `Google Sign-In verified for ${alertEmail}. Security email dispatched to your Gmail.`
      });
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Google Sign-In failed. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed. Please try again.');
  };

  const triggerGoogleLogin = useGoogleLogin({
    prompt: 'consent',
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setSubmitting(true);
      setError('');
      try {
        const newUser = await loginWithGoogle({ access_token: tokenResponse.access_token });
        const alertEmail = newUser?.email || 'rajchaturvedi215@gmail.com';
        notifyUser({
          title: '🚨 Greater Noida Transit: Login Alert',
          body: `Google Sign-In successful for ${alertEmail}. Security email dispatched to your Gmail.`
        });
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
    requestNotificationPermission();
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
      const loggedUser = await login(cleanUsername, password);
      const alertEmail = loggedUser?.email || 'rajchaturvedi215@gmail.com';
      notifyUser({
        title: '🚨 Greater Noida Transit: Login Alert',
        body: `Sign-in successful for ${cleanUsername}. Security email dispatched to ${alertEmail}.`
      });
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
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm">
            <Bus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
            College Bus Management
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sign in</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Welcome back. Enter your credentials to access live transit.
        </p>
      </div>

      {/* Account Created Success Banner */}
      {justRegistered && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>Account created successfully. Please sign in with your credentials.</span>
        </div>
      )}

      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {/* Notice Banner */}
      {notice && (
        <div className="mb-4 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Official Certified Google Sign-In */}
      <div className="w-full flex justify-center my-1">
        <div className="w-full flex justify-center rounded-xl overflow-hidden shadow-sm transition hover:shadow [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!mx-auto">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
            logo_alignment="left"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-medium">or continue with credentials</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="login-username">
            Username
          </label>
          <div className="relative">
            <input
              id="login-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={submitting}
              className="w-full h-11 px-3.5 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="login-password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium hover:underline transition"
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
              className="w-full h-11 pl-3.5 pr-10 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
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
          className="w-full h-11 mt-1 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-sm rounded-xl transition shadow-md hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Bottom Switch Link */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 hover:underline">
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
}
