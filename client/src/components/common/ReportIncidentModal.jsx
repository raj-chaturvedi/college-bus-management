import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  Bus,
  CheckCircle2
} from 'lucide-react';
import { transitAPI } from '../../services/api';
import { useScrollLock } from '../../utils/useScrollLock';

export default function ReportIncidentModal({ isOpen, onClose, onIncidentReported }) {
  useScrollLock(isOpen);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [type, setType] = useState('traffic_jam');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState({ message: '', emailDelivered: false });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccess(false);
      transitAPI.getBuses()
        .then(res => {
          if (res.data?.success) setBuses(res.data.buses);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Pre-flight validation
    if (!title.trim() && !description.trim()) {
      setErrorMessage('Please provide an incident headline or description.');
      return;
    }

    if (submitting) return; // Prevent duplicate clicks
    setSubmitting(true);

    try {
      const res = await transitAPI.reportIncident({
        title: title.trim(),
        description: description.trim(),
        type,
        busId: selectedBusId || null,
        severity,
        delayAddedMinutes: Number(delayMinutes)
      });

      if (res.data?.success) {
        setSuccess(true);
        setSuccessDetails({
          message: res.data.message || 'Incident successfully recorded in transit dispatch.',
          emailDelivered: !!res.data.emailDelivered
        });
        
        // Notify any listeners across the app
        window.dispatchEvent(new CustomEvent('transit:incident-reported'));
        if (onIncidentReported) onIncidentReported();

        setTimeout(() => {
          setSuccess(false);
          setTitle('');
          setDescription('');
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.data?.message || 'Failed to record incident.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error submitting report.');
    } finally {
      setSubmitting(false);
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
        className="relative z-[1100] app-modal-content w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-4 sm:p-6 app-dvh-max-dialog overflow-y-auto modal-scroll-lock"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Report Transit Incident</h3>
              <p className="text-xs text-slate-500">Broadcast route delay or road condition</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMessage}
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Incident Broadcasted</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              {successDetails.message}
            </p>
            <p className="text-[11px] text-slate-400">
              {successDetails.emailDelivered
                ? '✓ Email dispatch delivered to transit admin.'
                : 'ℹ Email notification unavailable (recorded to in-app dispatch).'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Incident Category</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
              >
                <option value="traffic_jam">Heavy Traffic Congestion</option>
                <option value="delay">Service Delay</option>
                <option value="overcrowding">High Overcrowding</option>
                <option value="lost_item">Lost & Found Item</option>
                <option value="emergency">Emergency / SOS Incident</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Affected Bus (Optional)</label>
              <select
                value={selectedBusId}
                onChange={e => setSelectedBusId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
              >
                <option value="">General Corridor Incident</option>
                {buses.map(b => (
                  <option key={b._id} value={b._id}>{b.busNumber} — {b.route?.name || 'Route'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Incident Headline</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Bottleneck near Knowledge Park II roundabout"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Details</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide location details or reason for slowdown..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                >
                  <option value="low">Low (Minor slowdown)</option>
                  <option value="medium">Medium (Moderate traffic)</option>
                  <option value="high">High (Severe standstill)</option>
                  <option value="critical">Critical (Route Blocked)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Estimated Delay (mins)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={delayMinutes}
                  onChange={e => setDelayMinutes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-xs text-white flex items-center gap-1.5 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submitting ? 'Broadcasting...' : 'Broadcast Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
