import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import {
  Bus,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      setError('Username is required.');
      return;
    }

    if (cleanUsername.length < 4 || cleanUsername.length > 20) {
      setError('Username must be between 4 and 20 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores (no spaces or special symbols).');
      return;
    }

    if (cleanUsername.startsWith('_')) {
      setError('Username cannot start with an underscore.');
      return;
    }

    if (/^_+$/.test(cleanUsername)) {
      setError('Username cannot contain only underscores.');
      return;
    }

    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please provide a valid email address (e.g. name@college.edu or gmail.com).');
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must include at least one uppercase letter (A-Z).');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must include at least one lowercase letter (a-z).');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must include at least one number (0-9).');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      setError('Password must include at least one special character (!@#$%^&*...).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        username: cleanUsername,
        email: cleanEmail,
        password,
        confirmPassword
      });

      setSuccessMessage(
        res?.message || 'Account created! Please check your email for the 6-digit verification code.'
      );
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}&username=${encodeURIComponent(cleanUsername)}`, { replace: true });
      }, 1400);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details or choose another username/email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Brand Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Bus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
            Greater Noida College Transit
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create an account</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Sign up with your username and email to activate student transit access.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{successMessage}</span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">Redirecting to verification...</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-3.5 sm:space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="register-username">
            Username
          </label>
          <div className="relative">
            <input
              id="register-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rohit_kumar"
              disabled={submitting}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
            3-30 characters, letters, numbers, underscores or hyphens.
          </span>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="register-email">
            Email Address
          </label>
          <div className="relative">
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@college.edu or gmail.com"
              disabled={submitting}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
            A 6-digit verification code will be sent to this email.
          </span>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="register-password">
            Password (min. 10 chars, uppercase, lowercase, number, symbol)
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              className="w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="register-confirm-password">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              className="w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security badge note */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Institutional security with instant email OTP verification.</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-10 mt-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium text-sm rounded-lg transition shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? 'Creating account & sending OTP...' : 'Create Account & Verify'}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {/* Bottom Switch Link */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
