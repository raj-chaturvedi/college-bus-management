import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Key,
  Loader2
} from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  const [quickCode, setQuickCode] = useState('');
  const [quickVerifying, setQuickVerifying] = useState(false);
  const [quickVerifyError, setQuickVerifyError] = useState('');
  const [quickVerifySuccess, setQuickVerifySuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-700', text: 'text-slate-400' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400', width: 'w-1/4' };
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', width: 'w-2/4' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-sky-500', text: 'text-sky-400', width: 'w-3/4' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' };
  }, [password]);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your full legal name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid email address format (e.g., student@college.edu).');
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
        name: cleanName,
        email: cleanEmail,
        password,
        confirmPassword,
        studentId: studentId.trim(),
        department: department.trim()
      });

      setRegistrationSuccess({
        email: cleanEmail,
        message: result.message || 'Please check your email to activate your account.'
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickVerify = async (e) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    setQuickVerifying(true);
    setQuickVerifyError('');
    try {
      await authAPI.verifyEmail({ token: quickCode.trim() });
      setQuickVerifySuccess(true);
      setTimeout(() => {
        navigate('/login?verified=true');
      }, 1400);
    } catch (err) {
      setQuickVerifyError(err.response?.data?.message || err.message || 'Verification code is invalid or has expired.');
    } finally {
      setQuickVerifying(false);
    }
  };

  return (
    <AuthLayout activeTab="register">
      {registrationSuccess ? (
        /* Successful registration view - Waiting for Email Verification */
        <div className="text-center py-3 space-y-4">
          <div className="w-13 h-13 mx-auto rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            {quickVerifySuccess ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <Mail className="w-7 h-7" />}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {quickVerifySuccess ? 'Account Activated!' : 'Verify Your Email'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
              {quickVerifySuccess ? (
                'Your email has been verified successfully. Redirecting to sign in...'
              ) : (
                <>We sent a verification email with a 6-digit code to:</>
              )}
            </p>
            {!quickVerifySuccess && (
              <div className="font-mono text-sm font-semibold text-sky-400 mt-1.5 bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800 inline-block">
                {registrationSuccess.email}
              </div>
            )}
          </div>

          {!quickVerifySuccess && (
            <>
              {/* Direct 6-Digit Code Input Box (Instant cross-device verification) */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-800/60 shadow-lg shadow-sky-950/30 text-left">
                <div className="flex items-center gap-2 mb-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                  <Key className="w-4 h-4" />
                  <span>Enter 6-Digit Code From Email</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Check your phone or inbox for the 6-digit security code and type it below:
                </p>
                
                <form onSubmit={handleQuickVerify} className="space-y-2.5">
                  <input
                    type="text"
                    maxLength={10}
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    placeholder="e.g. 849201"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-center tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {quickVerifyError && (
                    <div className="text-[11px] text-rose-400 text-center">{quickVerifyError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={quickVerifying || !quickCode.trim()}
                    className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {quickVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Activate Account Instantly</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-left text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  Prefer clicking the link?
                </div>
                <p className="text-[11px]">Click "Verify on this Computer" in your email, or use the 6-digit code above.</p>
              </div>

              <div className="pt-1">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition border border-slate-700"
                >
                  <span>Already Verified? Proceed to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Registration Form */
        <div>
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Student Registration
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create your transit account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Join Greater Noida College Transit network for live routes &amp; boarding passes.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-name">
                Full Legal Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Raj Chaturvedi"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-email">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. raj@campus.edu or gmail"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                A verification link will be sent to this email address.
              </p>
            </div>

            {/* Student ID & Department (Optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-studentid">
                  Student ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-studentid"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2024CS104"
                    className="w-full pl-8 pr-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-dept">
                  Department <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. CSE / IT"
                    className="w-full pl-8 pr-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-password">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Live Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`font-semibold ${strengthInfo.text}`}>{strengthInfo.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthInfo.color} ${strengthInfo.width}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-confirm-password">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-9 pr-10 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition font-mono text-sm ${
                    passwordsMatch
                      ? 'border-slate-700/80 focus:ring-sky-500'
                      : 'border-rose-600 focus:ring-rose-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-0.5"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !passwordsMatch}
              className="w-full mt-3 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-lg transition shadow-md shadow-sky-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
