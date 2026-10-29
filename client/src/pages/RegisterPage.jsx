import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import {
  Bus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RESERVED_NAMES = [
  'admin', 'administrator', 'root', 'support', 'null', 'undefined',
  'moderator', 'system', 'test', 'guest', 'demo', 'superuser'
];

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

  // Real-time username validation criteria
  const usernameRules = useMemo(() => {
    const trimmed = username.trim();
    const lengthValid = trimmed.length >= 4 && trimmed.length <= 16;
    const startsWithLetter = /^[a-zA-Z]/.test(trimmed);
    const charsValid = /^[a-zA-Z0-9_]+$/.test(trimmed);
    const notReserved = !RESERVED_NAMES.includes(trimmed.toLowerCase());
    const valid = lengthValid && startsWithLetter && charsValid && notReserved;
    return {
      lengthValid,
      startsWithLetter,
      charsValid,
      notReserved,
      valid
    };
  }, [username]);

  // Real-time password validation criteria
  const passwordRules = useMemo(() => {
    const trimmed = password;
    const lengthValid = trimmed.length >= 10 && trimmed.length <= 32;
    const hasUpper = /[A-Z]/.test(trimmed);
    const hasLower = /[a-z]/.test(trimmed);
    const hasNumber = /[0-9]/.test(trimmed);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(trimmed);
    
    // Check if password contains username
    const trimmedUser = username.trim().toLowerCase();
    const noUsername = !trimmedUser || trimmedUser.length < 3 || !trimmed.toLowerCase().includes(trimmedUser);
    
    // Check for repetitive characters (e.g. 'aaaa')
    const noRepetitive = !/(.)\1{3,}/.test(trimmed);

    const valid = lengthValid && hasUpper && hasLower && hasNumber && hasSymbol && noUsername && noRepetitive;

    return {
      lengthValid,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
      noUsername,
      noRepetitive,
      valid
    };
  }, [password, username]);

  const emailValid = useMemo(() => {
    return EMAIL_REGEX.test(email.trim().toLowerCase());
  }, [email]);

  const confirmMatch = useMemo(() => {
    return Boolean(password && confirmPassword && password === confirmPassword);
  }, [password, confirmPassword]);

  const isFormValid = usernameRules.valid && emailValid && passwordRules.valid && confirmMatch;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!usernameRules.valid) {
      if (!usernameRules.startsWithLetter) {
        setError('Username must start with a letter (A-Z or a-z).');
        return;
      }
      if (!usernameRules.lengthValid) {
        setError('Username must be between 4 and 16 characters.');
        return;
      }
      if (!usernameRules.charsValid) {
        setError('Username can only contain letters, numbers, and underscores.');
        return;
      }
      if (!usernameRules.notReserved) {
        setError('This username is reserved. Please choose another one.');
        return;
      }
      setError('Please provide a valid username.');
      return;
    }

    if (!cleanEmail || !emailValid) {
      setError('Please provide a valid email address (e.g. name@college.edu or gmail.com).');
      return;
    }

    if (!passwordRules.valid) {
      if (!passwordRules.lengthValid) {
        setError('Password must be between 10 and 32 characters.');
        return;
      }
      if (!passwordRules.hasUpper || !passwordRules.hasLower) {
        setError('Password must contain both uppercase (A-Z) and lowercase (a-z) letters.');
        return;
      }
      if (!passwordRules.hasNumber) {
        setError('Password must contain at least one number (0-9).');
        return;
      }
      if (!passwordRules.hasSymbol) {
        setError('Password must contain at least one special symbol (!@#$%^&*...).');
        return;
      }
      if (!passwordRules.noUsername) {
        setError('Password cannot contain your username.');
        return;
      }
      if (!passwordRules.noRepetitive) {
        setError('Password cannot contain 4 or more repeated characters in a row.');
        return;
      }
      setError('Password does not meet the security requirements.');
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
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Bus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
            Greater Noida College Transit
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create an account</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Sign up with your username and verified email to activate campus bus pass access.
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="register-username">
              Username
            </label>
            {username && (
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${usernameRules.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {usernameRules.valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {usernameRules.valid ? 'Valid Username' : 'Needs attention'}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="register-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
              placeholder="e.g. rohit_kumar"
              disabled={submitting}
              maxLength={16}
              className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                username && !usernameRules.valid
                  ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
            />
          </div>
          
          {/* Real-time username checklist */}
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
            <span className={`flex items-center gap-1 ${usernameRules.startsWithLetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {usernameRules.startsWithLetter ? '✓' : '•'} Starts with letter (a-z)
            </span>
            <span className={`flex items-center gap-1 ${usernameRules.lengthValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {usernameRules.lengthValid ? '✓' : '•'} 4 to 16 characters
            </span>
            <span className={`flex items-center gap-1 ${usernameRules.charsValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {usernameRules.charsValid ? '✓' : '•'} Letters, numbers, underscore
            </span>
            <span className={`flex items-center gap-1 ${usernameRules.notReserved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {usernameRules.notReserved ? '✓' : '•'} Not a system name
            </span>
          </div>
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
              className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                email && !emailValid
                  ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
            A 6-digit OTP code will be sent to this email for instant verification.
          </span>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="register-password">
              Password
            </label>
            {password && (
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${passwordRules.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {passwordRules.valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {passwordRules.valid ? 'Strong Password' : 'Incomplete'}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 10 chars, uppercase, lowercase, number, symbol"
              disabled={submitting}
              maxLength={32}
              className={`w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                password && !passwordRules.valid
                  ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
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

          {/* Real-time password requirement tags */}
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
            <span className={`flex items-center gap-1 ${passwordRules.lengthValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {passwordRules.lengthValid ? '✓' : '•'} 10 to 32 characters
            </span>
            <span className={`flex items-center gap-1 ${passwordRules.hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {passwordRules.hasUpper ? '✓' : '•'} At least 1 uppercase (A-Z)
            </span>
            <span className={`flex items-center gap-1 ${passwordRules.hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {passwordRules.hasLower ? '✓' : '•'} At least 1 lowercase (a-z)
            </span>
            <span className={`flex items-center gap-1 ${passwordRules.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {passwordRules.hasNumber ? '✓' : '•'} At least 1 number (0-9)
            </span>
            <span className={`flex items-center gap-1 ${passwordRules.hasSymbol ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {passwordRules.hasSymbol ? '✓' : '•'} 1 special symbol (!@#$)
            </span>
            <span className={`flex items-center gap-1 ${passwordRules.noUsername ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {passwordRules.noUsername ? '✓' : '•'} No username in password
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="register-confirm-password">
              Confirm password
            </label>
            {confirmPassword && (
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${confirmMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {confirmMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {confirmMatch ? 'Passwords match' : 'Do not match'}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              disabled={submitting}
              className={`w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                confirmPassword && !confirmMatch
                  ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
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
          disabled={submitting || !isFormValid}
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
