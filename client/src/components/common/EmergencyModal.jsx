import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { transitAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EmergencyModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [sosSent, setSosSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendSOS = async () => {
    setLoading(true);
    try {
      await transitAPI.reportIncident({
        title: `EMERGENCY TRANSIT ASSISTANCE: ${user?.name || 'Student'}`,
        description: `Urgent transit assistance requested by ${user?.name || 'Student'} (${user?.email || 'Student'}). Immediate dispatch attention required.`,
        type: 'emergency',
        severity: 'critical',
        delayAddedMinutes: 0,
        location: 'Current Student GPS / Active Corridor'
      });
      setSosSent(true);
    } catch (err) {
      alert('Could not dispatch online SOS. Please dial 112 or Transit Control directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] app-critical-backdrop flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative z-[1210] w-full max-w-md rounded-2xl bg-white border border-rose-200 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Emergency & Transit SOS</h3>
              <p className="text-xs text-slate-500">24x7 Greater Noida Campus Assistance</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSosSent(false);
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sosSent ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Emergency SOS Broadcasted</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your distress signal has been logged with Greater Noida Transit Control Dispatch. If in immediate danger, call 112 directly below.
            </p>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <PhoneCall className="h-4 w-4" /> Dial 112 (National Emergency)
            </a>
          </div>
        ) : (
          <div className="space-y-4 pt-4 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <span className="font-semibold flex items-center gap-1.5 text-rose-900">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Immediate Threat or Medical Incident?
              </span>
              <p className="text-xs text-rose-700">
                Tap below to notify campus transit security or contact official emergency hotlines.
              </p>
            </div>

            <button
              onClick={handleSendSOS}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="h-5 w-5" />
              <span>{loading ? 'Transmitting Distress...' : 'Broadcast Rapid SOS to Dispatch'}</span>
            </button>

            <div className="space-y-2 pt-2">
              <h5 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Direct Emergency Contacts
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="tel:112"
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-slate-900 font-bold block text-sm">112</span>
                    <span className="text-[11px] text-slate-500">Police & Ambulance</span>
                  </div>
                  <PhoneCall className="h-4 w-4 text-rose-600" />
                </a>

                <a
                  href="tel:1090"
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-slate-900 font-bold block text-sm">1090</span>
                    <span className="text-[11px] text-slate-500">Women's Safety</span>
                  </div>
                  <PhoneCall className="h-4 w-4 text-brand-600" />
                </a>

                <a
                  href="tel:+911202345678"
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors flex items-center justify-between sm:col-span-2"
                >
                  <div>
                    <span className="text-slate-900 font-bold block text-sm">+91 120-234-5678</span>
                    <span className="text-[11px] text-slate-500">Pari Chowk Central Transit Control Room (24x7)</span>
                  </div>
                  <PhoneCall className="h-4 w-4 text-brand-600" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
