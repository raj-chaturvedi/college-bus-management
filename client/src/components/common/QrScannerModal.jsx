import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Search,
  ScanLine
} from 'lucide-react';
import { transitAPI } from '../../services/api';
import { useScrollLock } from '../../utils/useScrollLock';

export default function QrScannerModal({ isOpen, onClose }) {
  useScrollLock(isOpen);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [consuming, setConsuming] = useState(false);

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError('Camera access is not supported by this browser. Use manual token verification below.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError('Camera access was denied or is unavailable. You can enter or paste the pass code below.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // QR Scanning Loop using BarcodeDetector if available
  const startScanningLoop = () => {
    if (!('BarcodeDetector' in window)) {
      return; // BarcodeDetector not available; user can paste code or use simulated scanner
    }

    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });

      const scanFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleDetectedCode(rawValue);
            return; // Stop loop once detected
          }
        } catch {}

        animFrameRef.current = requestAnimationFrame(scanFrame);
      };

      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch {}
  };

  // Extract clean pass token from QR raw value
  const extractToken = (raw) => {
    if (!raw) return '';
    const trimmed = raw.trim();

    // Check if it's a URL
    if (trimmed.includes('/verify-pass/')) {
      const parts = trimmed.split('/verify-pass/');
      return parts[1]?.split('?')[0]?.split('#')[0] || trimmed;
    }

    // Check if it's JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.passCode) return parsed.passCode;
        if (parsed.tokenHash) return parsed.tokenHash;
      } catch {}
    }

    return trimmed;
  };

  const handleDetectedCode = async (rawString) => {
    const token = extractToken(rawString);
    if (!token) return;
    verifyToken(token);
  };

  const verifyToken = async (tokenToVerify) => {
    setVerifying(true);
    setScanResult(null);
    try {
      const res = await transitAPI.verifyPass(tokenToVerify);
      setScanResult(res.data);
    } catch (err) {
      setScanResult({
        success: false,
        valid: false,
        status: 'INVALID',
        message: err.response?.data?.message || 'Invalid or unrecognized boarding token.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const cleanToken = extractToken(manualCode);
    verifyToken(cleanToken);
  };

  const handleConsumePass = async () => {
    const code = scanResult?.pass?.passCode || extractToken(manualCode);
    if (!code) return;
    setConsuming(true);
    try {
      const res = await transitAPI.consumePass(code);
      if (res.data?.success) {
        verifyToken(code);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark pass as used.');
    } finally {
      setConsuming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] app-modal-backdrop flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative z-[1100] app-modal-content w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-4 sm:p-5 my-auto text-slate-800 app-dvh-max-dialog overflow-y-auto modal-scroll-lock"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conductor Pass Scanner</h3>
              <p className="text-[11px] text-slate-500">Scan QR Code or Verify Boarding Token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video / Camera Feed */}
        <div className="mt-4 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {!cameraActive && (
              <div className="text-center p-4 text-slate-400 space-y-2">
                <Camera className="h-8 w-8 mx-auto text-slate-500" />
                <p className="text-xs">{cameraError || 'Camera inactive'}</p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Viewfinder Overlay Box */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-sky-400 rounded-xl animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Verification Result Card */}
          {verifying ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-sky-600" />
              <p className="text-xs font-semibold text-slate-700">Validating Token with Transit Registry...</p>
            </div>
          ) : scanResult ? (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                scanResult.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : scanResult.status === 'USED'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanResult.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : scanResult.status === 'USED' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <div className="font-bold text-sm">
                  {scanResult.valid
                    ? '✓ PASS VALID FOR BOARDING'
                    : scanResult.status === 'USED'
                    ? '⚠ PASS ALREADY USED'
                    : scanResult.status === 'EXPIRED'
                    ? '⚠ PASS EXPIRED'
                    : '✕ INVALID PASS'}
                </div>
              </div>

              {scanResult.pass && (
                <div className="text-xs space-y-1 pt-1 border-t border-slate-200/50">
                  <p><strong>Passenger:</strong> {scanResult.pass.studentName}</p>
                  <p><strong>Bus:</strong> {scanResult.pass.busNumber} ({scanResult.pass.plateNumber})</p>
                  <p><strong>Route:</strong> {scanResult.pass.fromStop} → {scanResult.pass.toStop}</p>
                  <p className="font-mono text-[11px]"><strong>Code:</strong> {scanResult.pass.passCode}</p>
                </div>
              )}

              {scanResult.valid && (
                <button
                  onClick={handleConsumePass}
                  disabled={consuming}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{consuming ? 'Recording...' : 'Mark as Used / Boarded'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setScanResult(null);
                  if (cameraActive) startScanningLoop();
                }}
                className="w-full py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold text-center block"
              >
                Scan Next Pass
              </button>
            </div>
          ) : null}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Manual Token / QR URL Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Paste pass URL or code (GNTA-TKN-...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:bg-white focus:border-sky-600"
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || verifying}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Verify</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
