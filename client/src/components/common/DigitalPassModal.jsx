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
  ArrowRightLeft,
  Ticket,
  Radio,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { transitAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { transitAudio } from '../../utils/audio';
import { notifyUser, requestNotificationPermission } from '../../utils/notification';
import { useScrollLock } from '../../utils/useScrollLock';

const FIVE_MINUTES_SECONDS = 300; // 5 minutes strictly

const DEFAULT_TRANSIT_STOPS = [
  { _id: 'stop_glb', name: 'GL Bajaj & Knowledge Park III', code: 'GLB', zone: 'Knowledge Park Corridor' },
  { _id: 'stop_pck', name: 'Pari Chowk Central Interchange', code: 'PCK', zone: 'Pari Chowk Central' },
  { _id: 'stop_kp2', name: 'Knowledge Park II (KP-2 Metro)', code: 'KP2', zone: 'Knowledge Park Corridor' },
  { _id: 'stop_kp1', name: 'Knowledge Park I (KP-1 Hub)', code: 'KP1', zone: 'Knowledge Park Corridor' },
  { _id: 'stop_shu', name: 'Sharda University (KP-3 Campus Gate)', code: 'SHU', zone: 'Knowledge Park Corridor' },
  { _id: 'stop_gbu', name: 'Gautam Buddha University (GBU Main Gate)', code: 'GBU', zone: 'GBU Campus' },
  { _id: 'stop_bnt', name: 'Bennett University (Tech Zone 2)', code: 'BNT', zone: 'Tech Zone Corridor' },
  { _id: 'stop_glu', name: 'Galgotias University (Yamuna Expressway Campus)', code: 'GLU', zone: 'Yamuna Expressway' },
  { _id: 'stop_al1', name: 'Alpha 1 Commercial & Metro', code: 'AL1', zone: 'Alpha Sector' },
  { _id: 'stop_al2', name: 'Alpha 2 Commercial Centre', code: 'AL2', zone: 'Alpha Sector' },
  { _id: 'stop_cpk', name: 'City Park & Alpha 2 Avenue', code: 'CPK', zone: 'Alpha Sector' },
  { _id: 'stop_bt1', name: 'Beta 1 Central Market', code: 'BT1', zone: 'Beta Sector' },
  { _id: 'stop_bt2', name: 'Beta 2 Omaxe NRI City Center', code: 'BT2', zone: 'Beta Sector' },
  { _id: 'stop_gm1', name: 'Gamma 1 & 2 Green Avenue', code: 'GM1', zone: 'Gamma Sector' },
  { _id: 'stop_jgt', name: 'Jagat Farm Commercial Hub', code: 'JGT', zone: 'Gamma Sector' },
  { _id: 'stop_dl1', name: 'Delta 1 Metro Station (Aqua Line)', code: 'DL1', zone: 'Delta Sector' },
  { _id: 'stop_dl2', name: 'Delta 2 Senior Citizen Park', code: 'DL2', zone: 'Delta Sector' },
  { _id: 'stop_spj', name: 'Surajpur Police Lines & Collectorate', code: 'SPJ', zone: 'Surajpur Corridor' },
  { _id: 'stop_gnw', name: 'Greater Noida West (Gaur City / Gaur Chowk)', code: 'GNW', zone: 'Gr. Noida West' },
  { _id: 'stop_eco', name: 'Ecotech III Industrial & Tech Hub', code: 'ECO', zone: 'Ecotech Zone' },
  { _id: 'stop_ksn', name: 'Kasna Transit Terminal & Heritage Village', code: 'KSN', zone: 'Kasna Junction' },
  { _id: 'stop_yex', name: 'Yamuna Expressway Zero Point', code: 'YEX', zone: 'Expressway Corridor' },
  { _id: 'stop_wpr', name: 'Wipro Knowledge Park IV Campus', code: 'WPR', zone: 'Knowledge Park Corridor' },
  { _id: 'stop_iem', name: 'India Expo Mart & Convention Centre', code: 'IEM', zone: 'Expo Mart Corridor' },
  { _id: 'stop_dep', name: 'Aqua Line Metro Depot & Sector 148', code: 'DEP', zone: 'Metro Depot Junction' },
  { _id: 'stop_s62', name: 'Greater Noida Sector 62 Link', code: 'S62', zone: 'Sector 62 Transit Corridor' }
];

export default function DigitalPassModal({
  isOpen,
  onClose,
  defaultBus,
  initialBus,
  defaultRoute,
  stops: propStops,
  selectedBus,
  initialSourceStopId,
  initialDestinationStopId
}) {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [availableStops, setAvailableStops] = useState(
    Array.isArray(propStops) && propStops.length > 0 ? propStops : DEFAULT_TRANSIT_STOPS
  );
  const [fromStop, setFromStop] = useState('GL Bajaj & Knowledge Park III');
  const [toStop, setToStop] = useState('Pari Chowk Central Interchange');
  const [seatPreference, setSeatPreference] = useState('Window Seat');
  const [generatedPass, setGeneratedPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FIVE_MINUTES_SECONDS);
  const [copied, setCopied] = useState(false);

  // Lock background scrolling completely on mobile and desktop while open
  useScrollLock(isOpen);

  const effectiveInitialBus = selectedBus || initialBus || defaultBus;

  // Sync stops if passed as prop
  useEffect(() => {
    if (Array.isArray(propStops) && propStops.length > 0) {
      setAvailableStops(propStops);
    }
  }, [propStops]);

  // Fetch stops dynamically if propStops not available
  useEffect(() => {
    if (isOpen) {
      if (!Array.isArray(propStops) || propStops.length === 0) {
        transitAPI.getStops()
          .then(res => {
            if (res.data?.success && Array.isArray(res.data.stops) && res.data.stops.length > 0) {
              setAvailableStops(res.data.stops);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, propStops]);

  // Sync initial stops from props if provided
  useEffect(() => {
    if (isOpen && availableStops.length > 0) {
      if (initialSourceStopId) {
        const found = availableStops.find(s => (s._id || s.id) === initialSourceStopId || s.name === initialSourceStopId);
        if (found) setFromStop(found.name);
      }
      if (initialDestinationStopId) {
        const found = availableStops.find(s => (s._id || s.id) === initialDestinationStopId || s.name === initialDestinationStopId);
        if (found) setToStop(found.name);
      }
    }
  }, [isOpen, initialSourceStopId, initialDestinationStopId, availableStops]);

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

  // Generate genuine scannable QR Code linking to in-app verification route
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
        setTimeLeft(remaining > 0 ? remaining : 0);
      } else {
        setTimeLeft(FIVE_MINUTES_SECONDS);
      }
    }
  }, [generatedPass]);

  // Strict 5-minute dynamic countdown (source of truth is server validUntil)
  useEffect(() => {
    if (generatedPass && timeLeft > 0) {
      const timer = setInterval(() => {
        if (generatedPass.validUntil) {
          const remaining = Math.max(0, Math.floor((new Date(generatedPass.validUntil).getTime() - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearInterval(timer);
          }
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }
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
          body: `Token: ${res.data.pass.passCode} for ${res.data.pass.busNumber || 'Bus'}. Valid for 5 minutes.`
        });
        transitAudio.playSuccess();
      }
    } catch (err) {
      alert('Failed to generate boarding pass. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (generatedPass?.passCode) {
      navigator.clipboard.writeText(generatedPass.passCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetForNewPass = () => {
    setGeneratedPass(null);
    setQrDataUrl('');
    setTimeLeft(FIVE_MINUTES_SECONDS);
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / FIVE_MINUTES_SECONDS) * 100));
  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft > 0 && timeLeft <= 90; // Under 1.5 mins

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] app-modal-backdrop flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative z-[1100] app-modal-content w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 my-auto text-slate-800 dark:text-slate-100 transition-colors app-dvh-max-dialog overflow-y-auto modal-scroll-lock"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400">5-Minute Dynamic QR Transit Pass</p>
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
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Telemetry Active
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">Transit Route Terminals & Interchange</span>
                <button
                  type="button"
                  onClick={() => {
                    const temp = fromStop;
                    setFromStop(toStop);
                    setToStop(temp);
                  }}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 font-bold active:scale-95 transition-all"
                  title="Interchange boarding and drop-off stops"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Swap Stops</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Boarding Stop</label>
                  <select
                    value={fromStop}
                    onChange={e => setFromStop(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:border-sky-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                  >
                    {fromStop && !availableStops.some(s => s.name === fromStop) && (
                      <option value={fromStop}>{fromStop}</option>
                    )}
                    {availableStops.map(s => (
                      <option key={s._id || s.id || s.name} value={s.name}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Drop-off Stop / Interchange</label>
                  <select
                    value={toStop}
                    onChange={e => setToStop(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:border-sky-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                  >
                    {toStop && !availableStops.some(s => s.name === toStop) && (
                      <option value={toStop}>{toStop}</option>
                    )}
                    {availableStops.map(s => (
                      <option key={s._id || s.id || s.name} value={s.name}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Seating Priority</label>
              <select
                value={seatPreference}
                onChange={e => setSeatPreference(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-600 focus:outline-none"
              >
                <option>Window Seat (Forward Direction)</option>
                <option>Aisle Seat (Rapid De-boarding)</option>
                <option>Front Deck (Accessible Entrance)</option>
                <option>Standard Commuter Seating</option>
              </select>
            </div>

            {/* Institutional Security Notice */}
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>Five-Minute Single-Use Token</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Newly issued passes remain valid for exactly 5 minutes after generation. Scan at vehicle validator upon boarding.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <QrCode className="h-4 w-4 animate-spin" />
                  <span>Issuing Boarding Token...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate 5-Minute Boarding Token</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Rendered Boarding Pass with 5-Minute Countdown */
          <div className="pt-3 space-y-3">
            {/* The Physical-Style Digital Boarding Pass */}
            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-lg">
              {/* Pass Header Band */}
              <div className="px-4 py-2 bg-gradient-to-r from-sky-700 to-sky-900 text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4" />
                  <span className="font-bold tracking-tight">GREATER NOIDA TRANSIT AUTHORITY</span>
                </div>
                {!isExpired ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ACTIVE
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                    EXPIRED
                  </div>
                )}
              </div>

              {/* Route & Passenger Information Header */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Commuter</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{generatedPass.studentName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Fare Status</span>
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
                    SUBSIDIZED (₹0.00)
                  </span>
                </div>
              </div>

              {/* Journey Path Schematic */}
              <div className="px-4 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-semibold gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[42%]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate text-[11px]">{generatedPass.fromStop}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <span className="h-px w-6 bg-slate-300 dark:bg-slate-600"></span>
                    <Bus className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span className="h-px w-6 bg-slate-300 dark:bg-slate-600"></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate max-w-[42%] justify-end">
                    <span className="truncate text-[11px] text-right">{generatedPass.toStop}</span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Vehicle: <strong className="text-sky-800 dark:text-sky-300">{generatedPass.busNumber}</strong> ({generatedPass.plateNumber || 'UP-16-CB-1012'})</span>
                  <span>{generatedPass.seatNumber}</span>
                </div>
              </div>

              {/* The Genuine Scannable QR Code */}
              <div className="p-4 bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
                <div className="relative p-2.5 bg-white rounded-2xl border-2 border-slate-900/90 shadow-md">
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-sky-600"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-sky-600"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-sky-600"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-sky-600"></div>

                  {qrDataUrl ? (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt="Transit Boarding Token QR"
                        className={`w-40 sm:w-44 h-40 sm:h-44 object-contain ${isExpired ? 'opacity-20 grayscale' : ''}`}
                      />
                      {isExpired && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg p-2 text-center">
                          <AlertTriangle className="h-8 w-8 text-rose-600 mb-1" />
                          <span className="font-bold text-xs text-rose-700 tracking-wider">PASS EXPIRED</span>
                          <span className="text-[10px] text-slate-500 mt-1">5-Minute Window Elapsed</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-50">
                      <QrCode className="h-8 w-8 text-slate-400 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Token Monospace Code & Copy Button */}
                <div className="mt-3 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wider">
                    {generatedPass.passCode}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Copy token string"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-sans text-center">
                  Point smartphone camera or scan at validator upon boarding.
                </p>
              </div>

              {/* Ticket Cutout Notch Visual Decoration */}
              <div className="relative flex items-center justify-between px-3 py-1 bg-slate-50 dark:bg-slate-800 border-t border-dashed border-slate-300 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>ISSUED: {new Date(generatedPass.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-sky-700 dark:text-sky-400 font-bold">5-MIN VALIDITY</span>
                <span>EXPIRES: {new Date(generatedPass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Dynamic 5-Minute Countdown Clock Widget */}
            <div className={`p-3.5 rounded-2xl border text-xs transition-all ${
              isExpired
                ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                : isUrgent
                ? 'bg-amber-950/70 border-amber-800 text-amber-200'
                : 'bg-slate-800/90 border-slate-700 text-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className={`h-4 w-4 ${isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400 animate-pulse' : 'text-sky-400'}`} />
                  <span>{isExpired ? 'Validity Terminated (Expired):' : 'Five-Minute Live Countdown:'}</span>
                </span>
                <span className={`font-mono text-base font-extrabold tracking-wider ${
                  isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-300 animate-pulse' : 'text-emerald-400'
                }`}>
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {/* Visual 5-min Countdown Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-1000 ${
                    isExpired ? 'w-0' : isUrgent ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-500 to-emerald-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                <span>{isExpired ? 'Expired passes cannot board' : 'Valid strictly for 5 minutes'}</span>
                <span>{isExpired ? '0s' : `${timeLeft}s remaining`}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-1">
              {isExpired ? (
                <button
                  type="button"
                  onClick={handleResetForNewPass}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Generate Fresh 5-Minute Pass</span>
                </button>
              ) : (
                <>
                  <a
                    href={`/verify-pass/${encodeURIComponent(generatedPass.passCode)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-sky-600" />
                    <span>Open Scanner Page</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleResetForNewPass}
                    className="py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold transition"
                  >
                    New Pass
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
