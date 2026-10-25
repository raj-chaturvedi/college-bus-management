import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sliders,
  CheckCircle2,
  Zap,
  Footprints,
  Users,
  Compass,
  Clock,
  ShieldCheck,
  Scale,
  Save
} from 'lucide-react';

export default function PreferencesPage() {
  const { user, updatePreferences } = useAuth();

  const [mode, setMode] = useState(user?.preferences?.mode || 'BALANCED');
  const [walkingPriority, setWalkingPriority] = useState(user?.preferences?.walkingPriority || 'HIGH');
  const [crowdPriority, setCrowdPriority] = useState(user?.preferences?.crowdPriority || 'HIGH');
  const [travelTimePriority, setTravelTimePriority] = useState(user?.preferences?.travelTimePriority || 'MEDIUM');
  const [waitingPriority, setWaitingPriority] = useState(user?.preferences?.waitingPriority || 'MEDIUM');
  const [reliabilityPriority, setReliabilityPriority] = useState(user?.preferences?.reliabilityPriority || 'HIGH');
  const [maxWalkingMeters, setMaxWalkingMeters] = useState(user?.preferences?.maxWalkingMeters || 800);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState(user?.preferences?.maxWaitMinutes || 20);
  const [avoidTransfers, setAvoidTransfers] = useState(user?.preferences?.avoidTransfers || false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updatePreferences({
        mode,
        walkingPriority,
        crowdPriority,
        travelTimePriority,
        waitingPriority,
        reliabilityPriority,
        maxWalkingMeters: Number(maxWalkingMeters),
        maxWaitMinutes: Number(maxWaitMinutes),
        avoidTransfers
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert('Failed to update preferences: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="h-5 w-5 text-sky-600" /> Commute & Route Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure how the routing algorithm prioritizes walking, crowding, travel duration, and transfers for your daily trips.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Optimization Mode */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Primary Optimization Goal
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'BALANCED', label: 'Balanced', desc: 'Equal balance of time, walk & crowd' },
              { id: 'FASTEST', label: 'Fastest Journey', desc: 'Minimal total travel time' },
              { id: 'LEAST_CROWDED', label: 'Least Crowded', desc: 'Guaranteed seat & low density' },
              { id: 'LEAST_WALKING', label: 'Least Walking', desc: 'Minimal pedestrian distance' },
              { id: 'NO_TRANSFERS', label: 'Direct Corridors', desc: 'Never switch buses' },
              { id: 'MOST_RELIABLE', label: 'High Reliability', desc: 'Highest on-time consistency' }
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  mode === m.id
                    ? 'bg-sky-50 border-sky-600 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{m.label}</span>
                  {mode === m.id && <CheckCircle2 className="h-4 w-4 text-sky-600" />}
                </div>
                <p className="text-[11px] text-slate-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Level Sliders/Toggles */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Factor Weights
          </h2>

          <div className="space-y-4 divide-y divide-slate-100 text-xs">
            {/* Travel Time */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="font-semibold text-slate-900 block">Travel Duration</span>
                <span className="text-[11px] text-slate-500">Importance of minimizing journey minutes</span>
              </div>
              <div className="flex gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTravelTimePriority(opt)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      travelTimePriority === opt
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Walking Priority */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="font-semibold text-slate-900 block">Walking Distance</span>
                <span className="text-[11px] text-slate-500">Avoidance of pedestrian walking segments</span>
              </div>
              <div className="flex gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWalkingPriority(opt)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      walkingPriority === opt
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Crowd Priority */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="font-semibold text-slate-900 block">Crowd & Seating</span>
                <span className="text-[11px] text-slate-500">Preference for open seats and low bus density</span>
              </div>
              <div className="flex gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCrowdPriority(opt)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      crowdPriority === opt
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hard Threshold Constraints */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Trip Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-900 block mb-1">
                Max Walking Distance: <strong>{maxWalkingMeters} m</strong>
              </label>
              <input
                type="range"
                min="200"
                max="2000"
                step="50"
                value={maxWalkingMeters}
                onChange={(e) => setMaxWalkingMeters(e.target.value)}
                className="w-full accent-sky-600"
              />
              <span className="text-[11px] text-slate-500">Filter routes requiring more walking than this.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-900 block mb-1">
                Max Boarding Wait: <strong>{maxWaitMinutes} min</strong>
              </label>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={maxWaitMinutes}
                onChange={(e) => setMaxWaitMinutes(e.target.value)}
                className="w-full accent-sky-600"
              />
              <span className="text-[11px] text-slate-500">Flag routes with arrival wait longer than this.</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>Preferences saved successfully.</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
