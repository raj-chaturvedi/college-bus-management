import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  CheckCircle2,
  Clock,
  Bus,
  MapPin,
  ShieldCheck,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Ticket,
  Radio,
  ExternalLink
} from 'lucide-react';
import { transitAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { transitAudio } from '../../utils/audio';
import { notifyUser, requestNotificationPermission } from '../../utils/notification';

export default function DigitalPassModal({ isOpen, onClose, defaultBus, initialBus, defaultRoute }) {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [fromStop, setFromStop] = useState('GL Bajaj & Knowledge Park III');
  const [toStop, setToStop] = useState('Pari Chowk Central Interchange');
  const [seatPreference, setSeatPreference] = useState('Window Seat');
  const [generatedPass, setGeneratedPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [copied, setCopied] = useState(false);

  const effectiveInitialBus = initialBus || defaultBus;

  useEffect(() => {
    if (isOpen) {
      transitAPI.getLiveBuses()
        .then(res => {
          if (res.data?.success && res.data.buses?.length > 0) {
            setBuses(res.data.buses);
            const targetBusQuery = typeof effectiveInitialBus === 'string'
              ? effectiveInitialBus.toLowerCase()
              : (effectiveInitialBus?.busNumber || '').toLowerCase();

            const matched = targetBusQuery
              ? res.data.buses.find(b => b.busNumber.toLowerCase() === targetBusQuery || b._id === targetBusQuery)
              : res.data.buses[0];

            setSelectedBusId(matched?._id || res.data.buses[0]._id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, effectiveInitialBus]);

  // Generate realistic, genuine scannable QR Code linking to in-app verification route
  useEffect(() => {
    if (generatedPass) {
      const verificationUrl = `${window.location.origin}/verify-pass/${encodeURIComponent(generatedPass.passCode)}`;

      QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('[QRCode Generation Error]:', err));

      if (generatedPass.validUntil) {
        const remaining = Math.max(0, Math.floor((new Date(generatedPass.validUntil).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining > 0 ? remaining : 600);
      } else {
        setTimeLeft(600);
      }
    }
  }, [generatedPass]);

  // Strict 10-minute dynamic countdown
  useEffect(() => {
    if (generatedPass && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [generatedPass, timeLeft]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    requestNotificationPermission();
    try {
      const res = await transitAPI.generatePass({
        busId: selectedBusId,
        fromStop,
        toStop,
        seatPreference
      });
      if (res.data?.success) {
        setGeneratedPass(res.data.pass);
        notifyUser({
          title: '🎫 GNTA Digital Boarding Pass Issued!',
          body: `Token: ${res.data.pass.passCode} for ${res.data.pass.busNumber || 'Bus'}. Sent to your Gmail inbox.`
        });
        fetch('/api/email-relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'rajchaturvedi215@gmail.com',
            subject: `College Bus Boarding Token: ${res.data.pass.passCode} (${res.data.pass.busNumber || 'Bus'})`,
            text: `Your dynamic boarding pass for ${res.data.pass.busNumber || 'Bus'} has been issued. Token: ${res.data.pass.passCode}. Valid for 10 minutes.`,
            html: `<h3>College Bus Transit Boarding Pass</h3><p>Your dynamic boarding token is active:</p><p><strong>Token:</strong> ${res.data.pass.passCode}</p><p><strong>Vehicle:</strong> ${res.data.pass.busNumber || 'Bus 12'}</p><p><strong>From:</strong> ${fromStop}</p><p><strong>To:</strong> ${toStop}</p><p>Valid strictly for 10 minutes.</p>`
          })
        }).catch(() => {});
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue digital pass.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!generatedPass?.passCode) return;
    navigator.clipboard.writeText(generatedPass.passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${generatedPass?.passCode || 'bus-boarding-pass'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 600) * 100));
  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft > 0 && timeLeft <= 180; // Under 3 mins

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] app-modal-backdrop flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative z-[1100] app-modal-content w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 overflow-hidden my-auto text-slate-800 dark:text-slate-100 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800 text-sky-600 dark:text-sky-400">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Digital Boarding Token
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                  GNTA
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">10-Minute Dynamic QR Transit Pass</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            title="Close modal"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!generatedPass ? (
          /* Pass Generation Form */
          <form onSubmit={handleGenerate} className="space-y-3.5 pt-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Select Active Vehicle ({buses.length} Fleet Buses)</label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GPS Live
                </span>
              </div>
              <select
                value={selectedBusId}
                onChange={e => setSelectedBusId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:border-sky-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
              >
                {buses.map(b => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.busNumber} • {b.plateNumber || 'UP-16'} ({b.occupancyPercentage}% full)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Boarding Stop</label>
                <input
                  type="text"
                  value={fromStop}
                  onChange={e => setFromStop(e.target.value)}
                  placeholder="e.g. GL Bajaj & Knowledge Park III"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Drop-off Stop</label>
                <input
                  type="text"
                  value={toStop}
                  onChange={e => setToStop(e.target.value)}
                  placeholder="e.g. Pari Chowk Central"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Seating Preference</label>
              <select
                value={seatPreference}
                onChange={e => setSeatPreference(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              >
                <option value="Window Seat">Window Seat (Ventilated)</option>
                <option value="Aisle Seat">Aisle Seat (Fast Exit)</option>
                <option value="Front Priority Seating">Front Priority Seating</option>
                <option value="General Open Seating">General Open Seating</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-300 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sky-950 dark:text-sky-200 block">10-Minute Dynamic Boarding Token Policy</span>
                Tokens expire automatically 10 minutes after generation to prevent pass sharing. Generate right before boarding.
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <QrCode className="h-4 w-4" />
                <span>{loading ? 'Issuing Transit Pass...' : 'Generate 10-Min Boarding QR Token'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel / Close
              </button>
            </div>
          </form>
        ) : (
          /* Realistic Transit Boarding Pass Ticket */
          <div className="pt-2 space-y-3 text-center">
            {/* Real-time Token Notification Alert Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500/40 text-left flex items-start gap-3 shadow-md shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Token Notification Alert
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  Token: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{generatedPass.passCode}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Active for 10 mins. Security alert &amp; QR boarding pass dispatched to <strong>rajchaturvedi215@gmail.com</strong>.
                </p>
              </div>
            </div>

            {/* The Physical-Style Digital Ticket Card */}
            <div className="relative rounded-2xl bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-700 text-left">
              {/* Anti-Screenshot Dynamic Security Ribbon (Moving Laser Bar) */}
              <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                {!isExpired ? (
                  <div className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-cyan-500 to-emerald-400 animate-slide-pulse" />
                ) : (
                  <div className="w-full h-full bg-rose-500" />
                )}
              </div>

              {/* Transit Authority Card Header */}
              <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                    GN
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-cyan-300">
                      Greater Noida Transit Authority
                    </h4>
                    <p className="text-[9px] text-slate-400 font-mono">
                      CAMPUS RAPID TRANSIT • VALIDATED TOKEN
                    </p>
                  </div>
                </div>

                {!isExpired ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>LIVE TOKEN</span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                    EXPIRED
                  </div>
                )}
              </div>

              {/* Route & Passenger Information Header */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Commuter</span>
                  <strong className="text-slate-900 font-bold">{generatedPass.studentName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Fare Status</span>
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    SUBSIDIZED (₹0.00)
                  </span>
                </div>
              </div>

              {/* Journey Path Schematic */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[42%]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate text-[11px]">{generatedPass.fromStop}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <span className="h-px w-6 bg-slate-300"></span>
                    <Bus className="h-3.5 w-3.5 text-brand-600" />
                    <span className="h-px w-6 bg-slate-300"></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate max-w-[42%] justify-end">
                    <span className="truncate text-[11px] text-right">{generatedPass.toStop}</span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
                  <span>Vehicle: <strong className="text-cyan-800">{generatedPass.busNumber}</strong> ({generatedPass.plateNumber || 'UP-16-CB-1012'})</span>
                  <span>{generatedPass.seatNumber}</span>
                </div>
              </div>

              {/* The Genuine Scannable QR Code */}
              <div className="p-4 bg-white flex flex-col items-center justify-center">
                <div className="relative p-2.5 bg-white rounded-2xl border-2 border-slate-900/90 shadow-md">
                  {/* Viewfinder Target Accents */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-brand-600"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-brand-600"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-brand-600"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-brand-600"></div>

                  {qrDataUrl ? (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt="Transit Boarding Token QR"
                        className={`w-44 h-44 object-contain ${isExpired ? 'opacity-20 grayscale' : ''}`}
                      />
                      {isExpired && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg">
                          <AlertTriangle className="h-8 w-8 text-rose-600 mb-1" />
                          <span className="font-bold text-xs text-rose-700 tracking-wider">TOKEN EXPIRED</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-slate-50">
                      <QrCode className="h-8 w-8 text-slate-400 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Token Monospace Code & Copy Button */}
                <div className="mt-3 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                    {generatedPass.passCode}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Copy token string"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="mt-1.5 text-[10px] text-slate-500 font-sans">
                  Point smartphone camera or scan at validator upon boarding.
                </p>
              </div>

              {/* Ticket Cutout Notch Visual Decoration */}
              <div className="relative flex items-center justify-between px-3 py-1 bg-slate-50 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-mono">
                <span>ISSUED: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-cyan-700 font-bold">10-MIN TOKEN</span>
                <span>EXPIRES: {new Date(generatedPass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Dynamic 10-Minute Countdown Clock Widget */}
            <div className={`p-3.5 rounded-2xl border text-xs transition-all ${
              isExpired
                ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                : isUrgent
                ? 'bg-amber-950/70 border-amber-800 text-amber-200'
                : 'bg-slate-800/90 border-slate-700 text-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className={`h-4 w-4 ${isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>{isExpired ? 'Pass Validity Terminated:' : 'Token Expiry Countdown:'}</span>
                </span>
                <span className={`font-mono text-base font-extrabold tracking-wider ${
                  isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-300 animate-pulse' : 'text-emerald-400'
                }`}>
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {/* Visual 10-min Countdown Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-1000 ${
                    isExpired ? 'w-0' : isUrgent ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>Issued for boarding</span>
                <span>Strict 10-Minute Window</span>
              </div>
            </div>

            {/* Quick in-app test link */}
            <div className="pt-1">
              <a
                href={`/verify-pass/${encodeURIComponent(generatedPass.passCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Verification Page (/verify-pass/{generatedPass.passCode})</span>
              </a>
            </div>

            {/* Pass Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDownloadQR}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>Save Ticket</span>
              </button>

              <button
                onClick={() => {
                  setGeneratedPass(null);
                  setTimeLeft(600);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                New Pass
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
