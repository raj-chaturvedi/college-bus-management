import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bus,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Ticket
} from 'lucide-react';
import { transitAPI } from '../services/api';

export default function VerifyPassPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [passData, setPassData] = useState(null);
  const [error, setError] = useState('');
  const [consuming, setConsuming] = useState(false);
  const [consumeMessage, setConsumeMessage] = useState('');

  const fetchPassVerification = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await transitAPI.verifyPass(token);
      if (res.data?.success) {
        setPassData(res.data);
      } else {
        setError(res.data?.message || 'Invalid or unrecognized boarding token.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'This boarding token could not be verified.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassVerification();
  }, [token]);

  const handleMarkAsUsed = async () => {
    if (!token) return;
    setConsuming(true);
    try {
      const res = await transitAPI.consumePass(token);
      if (res.data?.success) {
        setConsumeMessage('✓ Pass successfully marked as USED.');
        fetchPassVerification();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update pass status.');
    } finally {
      setConsuming(false);
    }
  };

  const pass = passData?.pass;
  const status = passData?.status || 'INVALID';
  const isValid = passData?.valid === true;
  const isUsed = status === 'USED';
  const isExpired = status === 'EXPIRED';

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Return link */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Transit Dashboard</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">GNTA Verification Service</span>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <RefreshCw className="h-8 w-8 text-sky-600 animate-spin mx-auto" />
          <h2 className="text-sm font-semibold text-slate-800">Verifying Boarding Pass Cryptographic Token...</h2>
          <p className="text-xs text-slate-500 font-mono">{token}</p>
        </div>
      ) : error && !pass ? (
        <div className="bg-white border border-red-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Invalid Boarding Pass</h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">{error}</p>
          <div className="pt-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors inline-block"
            >
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Status Header Banner */}
          <div
            className={`p-5 text-center border-b ${
              isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isUsed
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {isValid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : isUsed ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-600" />
              )}
              <h1 className="text-lg font-bold tracking-tight">
                {isValid
                  ? 'PASS VERIFIED & VALID'
                  : isUsed
                  ? 'PASS ALREADY USED'
                  : isExpired
                  ? 'PASS EXPIRED'
                  : 'PASS INVALID'}
              </h1>
            </div>
            <p className="text-xs font-medium">
              {passData?.message ||
                (isValid
                  ? 'This student boarding pass is authentic and valid for travel.'
                  : isUsed
                  ? 'This pass has already been used and boarded.'
                  : 'This boarding pass has expired.')}
            </p>
          </div>

          {/* Ticket Information Body */}
          <div className="p-6 space-y-5 text-xs text-slate-700">
            {/* Passenger & Vehicle */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Passenger
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{pass?.studentName}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{pass?.studentEmail}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assigned Bus
                </span>
                <p className="text-sm font-bold text-sky-700 mt-0.5">{pass?.busNumber}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{pass?.plateNumber}</p>
              </div>
            </div>

            {/* Route & Corridors */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Corridor & Route
              </span>
              <p className="text-xs font-semibold text-slate-800">{pass?.routeName}</p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-teal-700 font-bold uppercase block">Boarding Station</span>
                  <p className="font-semibold text-slate-800 text-[11px] mt-0.5">{pass?.fromStop}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-right">
                  <span className="text-[10px] text-sky-700 font-bold uppercase block">Destination Station</span>
                  <p className="font-semibold text-slate-800 text-[11px] mt-0.5">{pass?.toStop}</p>
                </div>
              </div>
            </div>

            {/* Timestamps & Seat */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Seat Allocation
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{pass?.seatNumber || 'Standard Window'}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Valid Until
                </span>
                <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                  {pass?.validUntil ? new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Expired'}
                </p>
              </div>
            </div>

            {/* Pass Token ID */}
            <div className="flex items-center justify-between text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block">Pass ID / Token</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{pass?.passCode}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isValid
                  ? 'bg-emerald-100 text-emerald-800'
                  : isUsed
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {status}
              </span>
            </div>

            {/* Conductor / Staff Verification Actions */}
            {isValid && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleMarkAsUsed}
                  disabled={consuming}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{consuming ? 'Recording Verification...' : 'Mark as Used / Boarded (Conductor)'}</span>
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Clicking this will invalidate this ticket to prevent reuse on other buses.
                </p>
              </div>
            )}

            {consumeMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800">
                {consumeMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
