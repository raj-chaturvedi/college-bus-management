import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import {
  User,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-200', text: 'text-slate-400', width: 'w-0' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600', width: 'w-1/4' };
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600', width: 'w-2/4' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-teal-500', text: 'text-teal-700', width: 'w-3/4' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-700', width: 'w-full' };
  }, [password]);

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const isLengthValid = password.length >= 8;
  const isUsernameValid = /^[a-zA-Z0-9_-]{3,30}$/.test(username.trim());

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setError('Username is required.');
      return;
    }

    if (!isUsernameValid) {
      setError('Username must be 3-30 characters long and contain only letters, numbers, underscores, or hyphens.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter confirm password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await register({
        username: cleanUsername,
        password,
        confirmPassword
      });

      setSuccessMessage('Account created successfully! Redirecting to your transit dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Please choose another username.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout activeTab="register">
      {/* Title Header */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-bold uppercase tracking-wider mb-2.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Registration</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#102A43] tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign up with only a username and password. No email address required.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Registration Form: ONLY Username, Password, Confirm Password */}
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-username">
            Username <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. raj_chaturvedi"
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition font-mono"
            />
            {username && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isUsernameValid ? (
                  <Check className="w-4 h-4 text-teal-600" />
                ) : (
                  <span className="text-[10px] text-amber-600 font-sans">3-30 chars</span>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Must be 3-30 characters with letters, numbers, underscores, or hyphens.
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-password">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
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

          {/* Password Strength Meter */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Security Strength:</span>
                <span className={`font-semibold ${strengthInfo.text}`}>{strengthInfo.label}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${strengthInfo.color} ${strengthInfo.width} transition-all duration-300`} />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reg-confirm-password">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type password"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition font-mono"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
          )}
        </div>

        {/* Requirements Checklist */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${isUsernameValid ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-500'}`}>
              ✓
            </span>
            <span>Unique username (3-30 letters, numbers, _, -)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${isLengthValid ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-500'}`}>
              ✓
            </span>
            <span>At least 8 characters long</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordsMatch && confirmPassword ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-500'}`}>
              ✓
            </span>
            <span>Passwords match</span>
          </div>
        </div>

        {/* Submit Button (Teal #0F766E) */}
        <button
          type="submit"
          disabled={submitting || !isUsernameValid || !isLengthValid || !passwordsMatch}
          className="w-full mt-2 py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-teal-900/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <span>Create Transit Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center text-xs text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline transition">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
